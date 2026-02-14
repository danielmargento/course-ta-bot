"use client";

import { Message } from "@/lib/types";
import ChatMessage from "./ChatMessage";

interface Props {
  messages: Message[];
  onToggleSave?: (messageId: string, saved: boolean) => void;
  onFeedback?: (messageId: string, rating: string) => void;
}

export default function ChatWindow({ messages, onToggleSave, onFeedback }: Props) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background">
      {messages.length === 0 && (
        <div className="text-center mt-16">
          <p className="text-muted text-sm">
            Ask your TA a question to get started.
          </p>
          <p className="text-muted/60 text-xs mt-1">
            Paste your current attempt for more targeted feedback.
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          onToggleSave={onToggleSave}
          onFeedback={onFeedback}
        />
      ))}
    </div>
  );
}
