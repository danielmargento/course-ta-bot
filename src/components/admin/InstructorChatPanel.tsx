"use client";

import { useRef, useState } from "react";
import { Message } from "@/lib/types";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatComposer from "@/components/chat/ChatComposer";

interface Props {
  courseId: string;
}

export default function InstructorChatPanel({ courseId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const streamingTextRef = useRef("");

  const handleSend = async (text: string) => {
    setStreaming(true);
    streamingTextRef.current = "";

    const userMsg: Message = {
      id: `tmp-${Date.now()}-u`,
      session_id: "",
      role: "user",
      content: text,
      saved: false,
      created_at: new Date().toISOString(),
    };
    const placeholderId = `tmp-${Date.now()}-a`;
    const assistantMsg: Message = {
      id: placeholderId,
      session_id: "",
      role: "assistant",
      content: "",
      saved: false,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    // Build conversation history for API (exclude the placeholder)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/instructor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, messages: history }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.replace("data: ", "");
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              streamingTextRef.current += parsed.text;
              const currentText = streamingTextRef.current;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === placeholderId ? { ...m, content: currentText } : m
                )
              );
            } catch {
              // skip parse errors
            }
          }
        }
      }
    } catch {
      // Remove placeholder on error
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-surface border border-border rounded-lg overflow-hidden">
      <ChatWindow messages={messages} hideSave />
      <div className="flex items-end gap-3 border-t border-border bg-surface p-3">
        <img
          src="/logo.png"
          alt="Pascal"
          className="h-12 w-12 sm:h-14 sm:w-14 object-contain animate-float shrink-0"
        />
        <div className="flex-1 min-w-0">
          <ChatComposer onSend={handleSend} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}
