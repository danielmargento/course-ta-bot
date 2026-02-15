import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  const supabase = await createServerClient();

  // If no course_id, show all courses and their material counts
  if (!courseId) {
    const { data: courses } = await supabase.from("courses").select("id, name, code");
    const { data: allMaterials } = await supabase
      .from("course_materials")
      .select("id, course_id, file_name, extracted_text");

    const summary = (courses ?? []).map((c) => {
      const mats = (allMaterials ?? []).filter((m) => m.course_id === c.id);
      return {
        course_id: c.id,
        course_name: c.name,
        course_code: c.code,
        materials: mats.map((m) => ({
          file_name: m.file_name,
          extracted_text_length: m.extracted_text?.length ?? 0,
          has_text: !!(m.extracted_text && m.extracted_text.length > 0),
          preview: m.extracted_text?.slice(0, 150) || "(empty)",
        })),
      };
    });

    return NextResponse.json(summary, { status: 200 });
  }

  // With course_id, show detailed material info
  const { data, error } = await supabase
    .from("course_materials")
    .select("id, file_name, file_type, category, extracted_text")
    .eq("course_id", courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = (data ?? []).map((m) => ({
    id: m.id,
    file_name: m.file_name,
    file_type: m.file_type,
    category: m.category,
    extracted_text_length: m.extracted_text?.length ?? 0,
    has_text: !!(m.extracted_text && m.extracted_text.length > 0),
    preview: m.extracted_text?.slice(0, 300) ?? "(empty)",
  }));

  return NextResponse.json(summary);
}
