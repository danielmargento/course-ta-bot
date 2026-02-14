import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get("course_id");
  const supabase = createServerClient();

  let query = supabase.from("assignments").select("*").order("created_at", { ascending: false });
  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      course_id: body.course_id,
      title: body.title,
      prompt: body.prompt,
      staff_notes: body.staff_notes ?? "",
      faq: body.faq ?? [],
      overrides: body.overrides ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
