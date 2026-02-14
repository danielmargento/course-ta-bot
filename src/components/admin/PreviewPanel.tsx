"use client";

import { useState } from "react";

interface Props {
  courseId: string;
}

export default function PreviewPanel({ courseId }: Props) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          session_id: "preview",
          message: input,
        }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
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
              text += parsed.text;
              setResponse(text);
            } catch {
              // skip
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Preview / Test Bot</h3>
        <p className="text-xs text-muted">
          Test how the bot responds to student prompts with current settings.
        </p>
      </div>
      <textarea
        className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
        rows={3}
        placeholder='Try: "Give me the full solution" or "Can you explain recursion?"'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={handleTest}
        disabled={loading || !input.trim()}
        className="bg-accent text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-hover transition-colors"
      >
        {loading ? "Testing..." : "Send Test"}
      </button>
      {response && (
        <div className="bg-background border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}
