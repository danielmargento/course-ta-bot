import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  if (!courseId) return NextResponse.json({ error: "course_id is required" }, { status: 400 });

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify instructor owns this course
  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", courseId)
    .single();

  if (!course || course.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get enrolled students
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("student_id, enrolled_at")
    .eq("course_id", courseId)
    .order("enrolled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!enrollments || enrollments.length === 0) return NextResponse.json([]);

  // Get profile info for enrolled students
  const studentIds = enrollments.map((e) => e.student_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", studentIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const roster = enrollments.map((e) => {
    const p = profileMap.get(e.student_id);
    return {
      id: e.student_id,
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      enrolled_at: e.enrolled_at,
    };
  });

  return NextResponse.json(roster);
}
