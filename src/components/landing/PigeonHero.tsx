"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Hi! I'm your AI TA.",
  "Ask me anything about your course!",
  "I'm here to help you learn — not cheat.",
  "Stuck at 2 AM? I've got you.",
  "Let's work through it together.",
];

const TYPE_DELAY = 80;
const PAUSE_AFTER_TYPING = 2000;
const DELETE_DELAY = 40;
const PAUSE_AFTER_DELETING = 500;

export default function PigeonHero() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMessage = MESSAGES[messageIndex];

  useEffect(() => {
    if (!isDeleting) {
      if (displayedText.length < currentMessage.length) {
        const timer = setTimeout(() => {
          setDisplayedText(currentMessage.slice(0, displayedText.length + 1));
        }, TYPE_DELAY);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_AFTER_TYPING);
        return () => clearTimeout(timer);
      }
    } else {
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, DELETE_DELAY);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setMessageIndex((i) => (i + 1) % MESSAGES.length);
          setIsDeleting(false);
        }, PAUSE_AFTER_DELETING);
        return () => clearTimeout(timer);
      }
    }
  }, [displayedText, isDeleting, currentMessage]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
      {/* Original mascot */}
      <div className="shrink-0">
        <img
          src="/logo.png"
          alt="pigeonhole mascot"
          className="h-40 w-40 sm:h-52 sm:w-52 animate-float object-contain"
        />
      </div>
      {/* Adjustable speech bubble with tail pointing at pigeon */}
      <div
        className="relative min-w-[12rem] max-w-[20rem] min-h-[3.5rem] bg-white border-2 border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Bubble tail pointing left at pigeon */}
        <div
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-b-[10px] border-r-[12px] border-t-transparent border-b-transparent border-r-surface border-l-0"
          aria-hidden
        />
        <span className="text-sm text-foreground leading-relaxed">
          {displayedText}
          <span className="inline-block w-0.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
        </span>
      </div>
    </div>
  );
}
