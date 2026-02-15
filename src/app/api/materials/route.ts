import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { extractText, getFileType } from "@/lib/fileParse";

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

  // Extract text
  let extractedText = "";
  try {
    extractedText = await extractText(buffer, fileType);
    if (!extractedText) {
      console.warn(`Text extraction returned empty for ${file.name}`);
    } else {
      console.log(`Extracted ${extractedText.length} chars from ${file.name}`);
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
