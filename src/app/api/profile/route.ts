import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role, concept_checks_enabled")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    email: user.email,
    role: data.role,
    concept_checks_enabled: data.concept_checks_enabled ?? true,
    firstName: user.user_metadata?.first_name ?? "",
    lastName: user.user_metadata?.last_name ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Update names in user metadata if provided
  if (body.firstName !== undefined || body.lastName !== undefined) {
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: body.firstName ?? "",
        last_name: body.lastName ?? "",
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Update concept_checks_enabled in profiles if provided
  if (body.concept_checks_enabled !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ concept_checks_enabled: body.concept_checks_enabled })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
