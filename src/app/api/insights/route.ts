import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { aggregateInsights, generateLLMInsights } from "@/lib/analytics";
import { Session, Message, Assignment } from "@/lib/types";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  if (!courseId) {
    return NextResponse.json({ error: "course_id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  // Fetch sessions for this course
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("course_id", courseId)
    .returns<Session[]>();

  const sessionIds = (sessions ?? []).map((s) => s.id);

  // Fetch messages for those sessions
  let messages: Message[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .in("session_id", sessionIds)
      .returns<Message[]>();
    messages = data ?? [];
  }

  // Fetch assignments for this course
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*")
    .eq("course_id", courseId)
    .returns<Assignment[]>();

  const insights = aggregateInsights(courseId, sessions ?? [], assignments ?? []);

  // Generate LLM insights from user messages
  const userMessages = messages.filter((m) => m.role === "user");
  const llmSummary = await generateLLMInsights(supabase, courseId, userMessages);
  insights.llm_summary = llmSummary;

  return NextResponse.json(insights);
}
