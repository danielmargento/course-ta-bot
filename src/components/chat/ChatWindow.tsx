"use client";

import { useEffect, useRef, useCallback } from "react";
import { Message } from "@/lib/types";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onToggleSave?: (messageId: string, saved: boolean) => void;
  conceptCheckIds?: Record<string, string>;
  conceptCheckAnswers?: Record<string, number>;
  onConceptCheckAnswer?: (conceptCheckId: string, selectedIndex: number) => void;
  conceptCheckSaved?: Record<string, boolean>;
  onToggleConceptCheckSave?: (conceptCheckId: string, saved: boolean) => void;
  hideSave?: boolean;
}

export default function ChatWindow({
  messages,
  onToggleSave,
  conceptCheckIds,
  conceptCheckAnswers,
  onConceptCheckAnswer,
  conceptCheckSaved,
  onToggleConceptCheckSave,
  hideSave,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  // Track whether user has scrolled up (to avoid forcing them back down)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (!isNearBottomRef.current) return;

    const countChanged = messages.length !== prevCountRef.current;
    prevCountRef.current = messages.length;

    // New message added → smooth scroll; streaming chunk → instant jump
    scrollToBottom(countChanged);
  }, [messages, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto space-y-4 p-4 bg-background"
    >
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted text-sm">Ask Pascal a question to get started.</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onToggleSave={onToggleSave}
          conceptCheckId={conceptCheckIds?.[msg.id] ?? null}
          conceptCheckAnswer={
            conceptCheckIds?.[msg.id]
              ? conceptCheckAnswers?.[conceptCheckIds[msg.id]] ?? null
              : null
          }
          onConceptCheckAnswer={onConceptCheckAnswer}
          conceptCheckSaved={
            conceptCheckIds?.[msg.id]
              ? conceptCheckSaved?.[conceptCheckIds[msg.id]] ?? false
              : false
          }
          onToggleConceptCheckSave={onToggleConceptCheckSave}
          hideSave={hideSave}
        />
      ))}
    </div>
  );
}
