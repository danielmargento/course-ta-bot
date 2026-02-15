"use client";

import { useEffect, useState } from "react";

const WELCOME_MESSAGES = [
  "Hi! I'm Pascal, your AI assistant.",
  "Ask me anything about your course!",
  "Stuck? Paste your attempt for targeted feedback.",
  "Let's work through it together.",
  "I'm here whenever you need help.",
];

const TYPE_DELAY = 70;
const PAUSE_AFTER_TYPING = 2200;
const DELETE_DELAY = 35;
const PAUSE_AFTER_DELETING = 400;

interface Props {
  /** Latest assistant message content (from chat or streaming) */
  assistantContent: string | null;
  /** Whether Pascal is currently streaming a response */
  streaming?: boolean;
}

export default function PigeonChatBubble({ assistantContent, streaming }: Props) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const hasAssistantContent = !!assistantContent?.trim();
  const currentWelcome = WELCOME_MESSAGES[messageIndex];

  useEffect(() => {
    if (hasAssistantContent || streaming) return;
    if (!isDeleting) {
      if (displayedText.length < currentWelcome.length) {
        const t = setTimeout(() => setDisplayedText(currentWelcome.slice(0, displayedText.length + 1)), TYPE_DELAY);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPING);
      return () => clearTimeout(t);
    }
    if (displayedText.length > 0) {
      const t = setTimeout(() => setDisplayedText((s) => s.slice(0, -1)), DELETE_DELAY);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setMessageIndex((i) => (i + 1) % WELCOME_MESSAGES.length); setIsDeleting(false); }, PAUSE_AFTER_DELETING);
    return () => clearTimeout(t);
  }, [displayedText, isDeleting, currentWelcome, hasAssistantContent, streaming]);

  const showContent = hasAssistantContent || streaming;
  const bubbleText = showContent ? (assistantContent ?? "") : displayedText;

  return (
    <div className="flex items-end gap-2 px-3 pt-2 pb-1">
      <img
        src="/logo.png"
        alt="Pascal"
        className="h-12 w-12 sm:h-14 sm:w-14 object-contain animate-float shrink-0"
      />
      <div className="relative min-w-[12rem] max-w-xl min-h-[2.5rem] max-h-40 bg-white border-2 border-border rounded-xl rounded-bl-sm px-3 py-2 shadow-sm flex items-start overflow-y-auto">
        <div
          className="absolute -left-2 top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-surface"
          aria-hidden
        />
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-1">
          {bubbleText}
          {(!showContent || streaming) ? (
            <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
          ) : null}
        </p>
      </div>
    </div>
  );
}
