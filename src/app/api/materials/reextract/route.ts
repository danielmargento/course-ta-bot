import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { extractText } from "@/lib/fileParse";

/**
 * Re-extracts text from all materials for a course (or a single material).
 * Downloads each file from Supabase storage and re-runs text extraction.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { course_id, material_id } = body;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Build query
  let query = supabase.from("course_materials").select("*");
  if (material_id) {
    query = query.eq("id", material_id);
  } else if (course_id) {
    query = query.eq("course_id", course_id);
  } else {
    return NextResponse.json({ error: "course_id or material_id required" }, { status: 400 });
  }

  const { data: materials, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!materials || materials.length === 0) {
    return NextResponse.json({ error: "No materials found" }, { status: 404 });
  }

  const results = [];

  for (const mat of materials) {
    try {
      // Download from Supabase storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("course-materials")
        .download(mat.storage_path);

      if (downloadError || !fileData) {
        results.push({
          id: mat.id,
          file_name: mat.file_name,
          status: "error",
          error: `Download failed: ${downloadError?.message || "No data"}`,
        });
        continue;
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const extractedText = await extractText(buffer, mat.file_type);

      // Update the row
      const { error: updateError } = await supabase
        .from("course_materials")
        .update({ extracted_text: extractedText })
        .eq("id", mat.id);

      results.push({
        id: mat.id,
        file_name: mat.file_name,
        status: updateError ? "update_failed" : "success",
        text_length: extractedText.length,
        preview: extractedText.slice(0, 200),
        error: updateError?.message,
      });
    } catch (e) {
      results.push({
        id: mat.id,
        file_name: mat.file_name,
        status: "extraction_failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json(results);
}
