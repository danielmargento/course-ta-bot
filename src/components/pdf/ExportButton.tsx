"use client";

import { Message } from "@/lib/types";
import { printMessages } from "@/lib/pdf";

interface Props {
  messages: Message[];
  title?: string;
}

export default function ExportButton({ messages, title = "Chat Export" }: Props) {
  const handleExport = () => {
    printMessages([{ groupName: title, messages }], title);
  };

  return (
    <button
      onClick={handleExport}
      disabled={messages.length === 0}
      className="border border-border rounded px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-accent/40 disabled:opacity-40 transition-colors bg-surface"
    >
      Export PDF
    </button>
  );
}
