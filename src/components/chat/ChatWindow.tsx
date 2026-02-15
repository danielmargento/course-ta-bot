"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onToggleSave?: (messageId: string, saved: boolean) => void;
}

export default function ChatWindow({ messages, onToggleSave }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted text-sm">Ask your TA a question to get started.</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onToggleSave={onToggleSave}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
