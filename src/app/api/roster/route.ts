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

  // Get enrolled students with profile info
  const { data, error } = await supabase
    .from("enrollments")
    .select("student_id, enrolled_at, profiles(first_name, last_name)")
    .eq("course_id", courseId)
    .order("enrolled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const roster = (data ?? []).map((e) => {
    const p = e.profiles as unknown as { first_name: string; last_name: string } | null;
    return {
      id: e.student_id,
      first_name: p?.first_name ?? "",
      last_name: p?.last_name ?? "",
      enrolled_at: e.enrolled_at,
    };
  });

  return NextResponse.json(roster);
}
