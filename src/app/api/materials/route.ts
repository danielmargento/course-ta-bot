import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { extractText, extractChunks, getFileType } from "@/lib/fileParse";
import { generateEmbeddings } from "@/lib/embeddings";
import { generateSummary } from "@/lib/summarize";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  if (!courseId) return NextResponse.json({ error: "course_id required" }, { status: 400 });

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("course_materials")
    .select("id, course_id, file_name, file_type, category, storage_path, extracted_text, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify instructor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const courseId = formData.get("course_id") as string | null;
  const category = (formData.get("category") as string) || "other";
  const texFile = formData.get("tex_file") as File | null;

  if (!file || !courseId) {
    return NextResponse.json({ error: "file and course_id are required" }, { status: 400 });
  }

  // Verify instructor owns the course
  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", courseId)
    .single();
  if (!course || course.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileType = getFileType(file.name);
  if (!fileType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract text — use .tex companion if provided, otherwise extract from the file itself
  let extractedText = "";
  const hasTexCompanion = texFile && fileType === "pdf";
  const extractionSource = hasTexCompanion ? "tex" : fileType;
  const extractionBuffer = hasTexCompanion
    ? Buffer.from(await texFile.arrayBuffer())
    : buffer;

  try {
    extractedText = await extractText(extractionBuffer, extractionSource);
    if (!extractedText) {
      console.warn(`Text extraction returned empty for ${file.name}`);
    } else {
      console.log(`Extracted ${extractedText.length} chars from ${file.name}${hasTexCompanion ? " (via .tex companion)" : ""}`);
    }
  } catch (e) {
    console.error(`Text extraction failed for ${file.name}:`, e);
    // Continue with empty text rather than failing the upload
  }

  // Generate a material ID for storage path
  const materialId = crypto.randomUUID();
  const storagePath = `${courseId}/${materialId}/${file.name}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("course-materials")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Insert metadata row
  const { data, error } = await supabase
    .from("course_materials")
    .insert({
      id: materialId,
      course_id: courseId,
      file_name: file.name,
      file_type: fileType,
      category,
      storage_path: storagePath,
      extracted_text: extractedText,
    })
    .select("id, course_id, file_name, file_type, category, storage_path, extracted_text, created_at")
    .single();

  if (error) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from("course-materials").remove([storagePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RAG processing: extract chunks, generate summary & embeddings, store
  // Non-fatal — upload succeeds even if RAG processing fails
  try {
    const chunks = await extractChunks(extractionBuffer, extractionSource);
    console.log(`[rag] Extracted ${chunks.length} chunks from ${file.name}`);

    if (chunks.length > 0) {
      // Generate summary and embeddings in parallel
      const [summary, embeddings] = await Promise.all([
        generateSummary(extractedText, file.name),
        generateEmbeddings(chunks.map((c) => c.content)),
      ]);

      // Store summary on course_materials row
      if (summary) {
        await supabase
          .from("course_materials")
          .update({ summary })
          .eq("id", materialId);
      }

      // Bulk insert chunks with embeddings
      const chunkRows = chunks.map((chunk, i) => ({
        material_id: materialId,
        course_id: courseId,
        chunk_index: i,
        content: chunk.content,
        source_label: chunk.source_label,
        metadata: chunk.metadata,
        embedding: JSON.stringify(embeddings[i]),
      }));

      const { error: chunkError } = await supabase
        .from("material_chunks")
        .insert(chunkRows);

      if (chunkError) {
        console.error(`[rag] Failed to insert chunks for ${file.name}:`, chunkError);
      } else {
        console.log(`[rag] Stored ${chunkRows.length} chunks with embeddings for ${file.name}`);
      }
    }
  } catch (ragError) {
    console.error(`[rag] RAG processing failed for ${file.name}:`, ragError);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const materialId = req.nextUrl.searchParams.get("id");
  if (!materialId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the material to get storage path and verify ownership
  const { data: material } = await supabase
    .from("course_materials")
    .select("storage_path, course_id")
    .eq("id", materialId)
    .single();

  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", material.course_id)
    .single();

  if (!course || course.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from storage
  await supabase.storage.from("course-materials").remove([material.storage_path]);

  // Delete from DB
  const { error } = await supabase.from("course_materials").delete().eq("id", materialId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
