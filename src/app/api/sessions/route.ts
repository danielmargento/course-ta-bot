import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  const studentId = req.nextUrl.searchParams.get("student_id");
  const supabase = createServerClient();

  let query = supabase.from("sessions").select("*").order("updated_at", { ascending: false });
  if (courseId) query = query.eq("course_id", courseId);
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      course_id: body.course_id,
      assignment_id: body.assignment_id ?? null,
      student_id: body.student_id,
      title: body.title ?? "New Session",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
