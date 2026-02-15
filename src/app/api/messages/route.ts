import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const courseId = req.nextUrl.searchParams.get("course_id");
  const saved = req.nextUrl.searchParams.get("saved");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch saved messages for a course (joined through sessions)
  if (courseId && saved === "true") {
    const { data, error } = await supabase
      .from("messages")
      .select("*, session:sessions!inner(id, assignment_id, course_id, student_id)")
      .eq("session.course_id", courseId)
      .eq("session.student_id", user.id)
      .eq("saved", true)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Fetch messages for a specific session
  if (!sessionId) {
    return NextResponse.json({ error: "session_id or course_id+saved is required" }, { status: 400 });
  }

  // Verify user owns the session
  const { data: session } = await supabase
    .from("sessions")
    .select("student_id")
    .eq("id", sessionId)
    .single();
  if (!session || session.student_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = body.action as string;

  if (action === "create") {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        session_id: body.session_id,
        role: body.role,
        content: body.content,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "save" || action === "unsave") {
    const { error } = await supabase
      .from("messages")
      .update({ saved: action === "save" })
      .eq("id", body.message_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "feedback") {
    const { data, error } = await supabase
      .from("feedback")
      .insert({
        message_id: body.message_id,
        rating: body.rating,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
