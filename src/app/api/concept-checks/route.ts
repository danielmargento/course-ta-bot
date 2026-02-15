import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

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
      .from("concept_checks")
      .insert({
        session_id: body.session_id,
        assignment_id: body.assignment_id ?? null,
        course_id: body.course_id,
        question: body.question,
        options: body.options,
        correct_index: body.correct_index,
        explanation: body.explanation ?? "",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "save" || action === "unsave") {
    const { error } = await supabase
      .from("concept_checks")
      .update({ saved: action === "save" })
      .eq("id", body.concept_check_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "answer") {
    const { data: existing } = await supabase
      .from("concept_checks")
      .select("correct_index")
      .eq("id", body.concept_check_id)
      .single();

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isCorrect = body.student_answer === existing.correct_index;

    const { data, error } = await supabase
      .from("concept_checks")
      .update({
        student_answer: body.student_answer,
        is_correct: isCorrect,
      })
      .eq("id", body.concept_check_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

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

  const savedOnly = req.nextUrl.searchParams.get("saved") === "true";

  // Student fetching saved concept checks
  if (savedOnly) {
    const { data, error } = await supabase
      .from("concept_checks")
      .select("*")
      .eq("course_id", courseId)
      .eq("saved", true)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Instructor aggregate view
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("concept_checks")
    .select("assignment_id, student_answer, is_correct")
    .eq("course_id", courseId)
    .not("student_answer", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byAssignment = new Map<string, { total: number; correct: number }>();
  for (const cc of data ?? []) {
    const key = cc.assignment_id ?? "general";
    const entry = byAssignment.get(key) ?? { total: 0, correct: 0 };
    entry.total++;
    if (cc.is_correct) entry.correct++;
    byAssignment.set(key, entry);
  }

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title")
    .eq("course_id", courseId);
  const titleMap = new Map((assignments ?? []).map((a) => [a.id, a.title]));

  const aggregates = Array.from(byAssignment.entries())
    .map(([assignment_id, { total, correct }]) => ({
      assignment_id,
      assignment_title: assignment_id === "general" ? "General" : titleMap.get(assignment_id) ?? "Unknown",
      total_answered: total,
      total_correct: correct,
      percent_correct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.percent_correct - b.percent_correct);

  return NextResponse.json(aggregates);
}
