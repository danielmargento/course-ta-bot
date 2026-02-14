import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const { announcement_id } = await req.json();
  if (!announcement_id) {
    return NextResponse.json({ error: "announcement_id is required" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert — ignore if already viewed
  await supabase
    .from("announcement_views")
    .upsert(
      { announcement_id, student_id: user.id },
      { onConflict: "announcement_id,student_id" }
    );

  return NextResponse.json({ success: true });
}
