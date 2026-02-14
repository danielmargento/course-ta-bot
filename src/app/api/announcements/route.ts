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

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (profile?.role === "instructor") {
    // Get total enrolled students
    const { count: totalStudents } = await supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("course_id", courseId);

    // Get view counts per announcement
    const enriched = await Promise.all(
      (announcements ?? []).map(async (a) => {
        const { count } = await supabase
          .from("announcement_views")
          .select("*", { count: "exact", head: true })
          .eq("announcement_id", a.id);
        return { ...a, view_count: count ?? 0, total_students: totalStudents ?? 0 };
      })
    );
    return NextResponse.json(enriched);
  } else {
    // For students, mark which ones they've viewed
    const { data: views } = await supabase
      .from("announcement_views")
      .select("announcement_id")
      .eq("student_id", user.id);

    const viewedIds = new Set((views ?? []).map((v) => v.announcement_id));
    const enriched = (announcements ?? []).map((a) => ({
      ...a,
      viewed: viewedIds.has(a.id),
    }));
    return NextResponse.json(enriched);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify instructor owns the course
  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", body.course_id)
    .single();

  if (!course || course.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      course_id: body.course_id,
      author_id: user.id,
      content: body.content,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, view_count: 0, total_students: 0 }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify instructor owns the course this announcement belongs to
  const { data: announcement } = await supabase
    .from("announcements")
    .select("course_id")
    .eq("id", id)
    .single();

  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", announcement.course_id)
    .single();

  if (!course || course.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
