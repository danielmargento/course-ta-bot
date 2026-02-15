"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { Message } from "@/lib/types";
import SaveToggle from "./SaveToggle";
import ConceptCheckCard from "./ConceptCheckCard";
import { parseConceptCheck, hasPartialConceptCheck } from "@/lib/conceptCheck";

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
  conceptCheckId?: string | null;
  conceptCheckAnswer?: number | null;
  onConceptCheckAnswer?: (conceptCheckId: string, selectedIndex: number) => void;
  conceptCheckSaved?: boolean;
  onToggleConceptCheckSave?: (conceptCheckId: string, saved: boolean) => void;
  hideSave?: boolean;
}

export default function ChatMessage({
  message,
  onToggleSave,
  conceptCheckId,
  conceptCheckAnswer,
  onConceptCheckAnswer,
  conceptCheckSaved,
  onToggleConceptCheckSave,
  hideSave,
}: Props) {
  const isUser = message.role === "user";

  // Parse concept check from assistant messages
  const { cleanContent, conceptCheck } = isUser
    ? { cleanContent: message.content, conceptCheck: null }
    : parseConceptCheck(message.content);

  // Hide partial concept check tags during streaming
  const isPartial = !isUser && hasPartialConceptCheck(message.content);
  const displayContent = isPartial
    ? message.content.replace(/\[CONCEPT_CHECK\][\s\S]*$/, "").trim()
    : cleanContent;

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
          <>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {normalizeLatex(displayContent)}
              </ReactMarkdown>
            </div>
            {conceptCheck && conceptCheckId && (
              <ConceptCheckCard
                question={conceptCheck.question}
                options={conceptCheck.options}
                correctIndex={conceptCheck.correct}
                explanation={conceptCheck.explanation}
                studentAnswer={conceptCheckAnswer ?? null}
                onAnswer={(selectedIndex) =>
                  onConceptCheckAnswer?.(conceptCheckId, selectedIndex)
                }
                saved={conceptCheckSaved}
                onToggleSave={() =>
                  onToggleConceptCheckSave?.(conceptCheckId, !conceptCheckSaved)
                }
              />
            )}
          </>
        )}
        {!isUser && !hideSave && (
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
