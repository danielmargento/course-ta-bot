"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { Message } from "@/lib/types";
import SaveToggle from "./SaveToggle";

/** Convert \( ... \) → $...$ and \[ ... \] → $$...$$ so remark-math can parse them */
function normalizeLatex(text: string): string {
  // Display math: \[ ... \] → $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => `$$${inner}$$`);
  // Inline math: \( ... \) → $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => `$${inner}$`);
  return text;
}

interface Props {
  message: Message;
  onToggleSave?: (messageId: string, saved: boolean) => void;
}

export default function ChatMessage({ message, onToggleSave }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
          isUser
            ? "bg-accent text-white"
            : "bg-surface border border-border text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {normalizeLatex(message.content)}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-xs text-muted">
            <SaveToggle
              saved={message.saved}
              onToggle={() => onToggleSave?.(message.id, !message.saved)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
