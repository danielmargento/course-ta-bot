import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabaseServer";
import { buildSystemPrompt } from "@/lib/prompt";
import { isDisallowedRequest } from "@/lib/policy";
import { Course, BotConfig, Assignment, Message } from "@/lib/types";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
}

export async function POST(req: NextRequest) {
  const { session_id, course_id, assignment_id, message } = await req.json();

  const supabase = createServerClient();

  // Fetch course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", course_id)
    .single<Course>();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Fetch bot config
  const { data: config } = await supabase
    .from("bot_configs")
    .select("*")
    .eq("course_id", course_id)
    .single<BotConfig>();

  if (!config) {
    return NextResponse.json({ error: "Bot config not found" }, { status: 404 });
  }

  // Fetch assignment if specified
  let assignment: Assignment | null = null;
  if (assignment_id) {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignment_id)
      .single<Assignment>();
    assignment = data;
  }

  // Check policy
  const policyCheck = isDisallowedRequest(message, config.policy);
  if (policyCheck.blocked) {
    return NextResponse.json({ role: "assistant", content: policyCheck.reason });
  }

  // Fetch prior messages for context
  const { data: priorMessages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  const systemPrompt = buildSystemPrompt(course, config, assignment);

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(priorMessages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Stream response
  const stream = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: chatMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
