"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatComposer from "@/components/chat/ChatComposer";
import AssignmentSelect from "@/components/assignments/AssignmentSelect";
import ExportButton from "@/components/pdf/ExportButton";
import { Assignment, Message } from "@/lib/types";

export default function StudentCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    fetch(`/api/assignments?course_id=${courseId}`)
      .then((r) => r.json())
      .then(setAssignments)
      .catch(() => {});
  }, [courseId]);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      session_id: "",
      role: "user",
      content: text,
      saved: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          session_id: "demo",
          assignment_id: selectedAssignment,
          message: text,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantMsg: Message = {
        id: `tmp-${Date.now()}-a`,
        session_id: "",
        role: "assistant",
        content: "",
        saved: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

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
              assistantText += parsed.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: assistantText } : m
                )
              );
            } catch {
              // skip parse errors
            }
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  const savedMessages = messages.filter((m) => m.saved);

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AssignmentSelect
            assignments={assignments}
            selected={selectedAssignment}
            onSelect={setSelectedAssignment}
          />
          {streaming && (
            <span className="text-xs text-muted animate-pulse">TA is typing...</span>
          )}
        </div>
        <ExportButton messages={savedMessages} title="Saved Messages" />
      </div>
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-lg overflow-hidden">
        <ChatWindow
          messages={messages}
          onToggleSave={(id, saved) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, saved } : m))
            )
          }
        />
        <ChatComposer onSend={handleSend} disabled={streaming} />
      </div>
    </div>
  );
}
