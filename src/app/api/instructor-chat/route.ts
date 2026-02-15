import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerClient } from "@/lib/supabaseServer";
import { Session, Message, LLMInsightSummary } from "@/lib/types";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
}

export async function POST(req: NextRequest) {
  const { course_id, messages } = await req.json();

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

  // Fetch recent student messages for this course (anonymized)
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("course_id", course_id)
    .returns<Pick<Session, "id">[]>();

  const sessionIds = (sessions ?? []).map((s) => s.id);

  let studentMessages: string[] = [];
  if (sessionIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("content, created_at")
      .in("session_id", sessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(300)
      .returns<Pick<Message, "content" | "created_at">[]>();
    studentMessages = (msgs ?? []).map((m) => m.content);
  }

  // Fetch cached LLM insight summary
  let insightSummary: LLMInsightSummary | null = null;
  const { data: cached } = await supabase
    .from("course_insights_cache")
    .select("insights")
    .eq("course_id", course_id)
    .single();
  if (cached?.insights) {
    insightSummary = cached.insights as LLMInsightSummary;
  }

  // Build system prompt
  const systemParts: string[] = [];

  systemParts.push(
    `You are an analytics assistant for a course instructor. The instructor is asking you about patterns in student questions sent to Pascal, the course's AI assistant. Your job is to help them understand what students are struggling with and provide actionable teaching recommendations.`
  );

  systemParts.push(`\n## Guidelines
- Be concise and direct.
- When citing student questions, quote them exactly but never include student names or identifiers.
- Provide actionable recommendations: what to re-teach, what to clarify, what to add to materials.
- If asked about something the data doesn't cover, say so honestly.
- Use markdown formatting for clarity.`);

  if (insightSummary) {
    systemParts.push(`\n## Pre-Generated Insight Summary
${JSON.stringify(insightSummary, null, 2)}`);
  }

  if (studentMessages.length > 0) {
    const sample = studentMessages.slice(0, 200);
    systemParts.push(
      `\n## Recent Student Questions (${sample.length} of ${studentMessages.length} total, anonymized)\n${sample.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    );
  } else {
    systemParts.push(`\n## Student Data\nNo student messages have been recorded yet.`);
  }

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemParts.join("\n") },
    ...(messages ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
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
