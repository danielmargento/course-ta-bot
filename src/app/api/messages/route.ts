import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServerClient();
  const action = body.action as string;

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
