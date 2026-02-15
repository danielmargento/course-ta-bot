"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { Assignment, Message } from "@/lib/types";
import { printMessages, PdfGroup } from "@/lib/pdf";

/** Convert \( ... \) → $...$ and \[ ... \] → $$...$$ so remark-math can parse them */
function normalizeLatex(text: string): string {
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => `$$${inner}$$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => `$${inner}$`);
  return text;
}

interface SavedMessage extends Message {
  session?: {
    id: string;
    assignment_id: string | null;
    course_id: string;
    student_id: string;
  };
}

interface Props {
  courseId: string;
  assignments: Assignment[];
}

export default function SavedNotesPanel({ courseId, assignments }: Props) {
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchSaved = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?course_id=${courseId}&saved=true`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsave", message_id: messageId }),
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === messages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(messages.map((m) => m.id)));
    }
  };

  const handleExport = () => {
    const toExport = selected.size > 0
      ? messages.filter((m) => selected.has(m.id))
      : messages;

    // Group by assignment
    const grouped = new Map<string, Message[]>();
    for (const msg of toExport) {
      const key = msg.session?.assignment_id ?? "general";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(msg);
    }

    const groups: PdfGroup[] = [...grouped.entries()]
      .sort(([a], [b]) => {
        if (a === "general") return 1;
        if (b === "general") return -1;
        return (assignmentMap.get(a) ?? a).localeCompare(assignmentMap.get(b) ?? b);
      })
      .map(([key, msgs]) => ({
        groupName: key === "general" ? "General" : assignmentMap.get(key) ?? "Unknown Assignment",
        messages: msgs,
      }));

    printMessages(groups, "Saved Notes");
  };

  // Group by assignment for display
  const assignmentMap = new Map(assignments.map((a) => [a.id, a.title]));
  const groups = new Map<string, SavedMessage[]>();

  for (const msg of messages) {
    const assignmentId = msg.session?.assignment_id ?? "general";
    if (!groups.has(assignmentId)) groups.set(assignmentId, []);
    groups.get(assignmentId)!.push(msg);
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "general") return 1;
    if (b === "general") return -1;
    return (assignmentMap.get(a) ?? a).localeCompare(assignmentMap.get(b) ?? b);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted text-sm">Loading saved notes...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted text-sm">
          No saved notes yet. Save messages from the chat to see them here.
        </p>
      </div>
    );
  }

  const allSelected = selected.size === messages.length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sticky toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface shrink-0">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="accent-accent rounded"
          />
          {allSelected ? "Deselect all" : "Select all"}
        </label>
        <button
          onClick={handleExport}
          disabled={messages.length === 0}
          className="flex items-center gap-1.5 border border-border rounded px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-accent/40 disabled:opacity-40 transition-colors bg-surface"
        >
          Export{selected.size > 0 ? ` (${selected.size})` : " all"} as PDF
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sortedKeys.map((key) => {
          const groupMessages = groups.get(key)!;
          const groupName = key === "general" ? "General" : assignmentMap.get(key) ?? "Unknown Assignment";

          return (
            <div key={key} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                {groupName}
              </h3>

              {groupMessages.map((msg) => {
                const isSelected = selected.has(msg.id);
                return (
                  <div
                    key={msg.id}
                    onClick={() => toggleSelect(msg.id)}
                    className={`rounded-lg px-4 py-3 cursor-pointer transition-colors border ${
                      isSelected
                        ? "border-accent/50 bg-accent/5"
                        : "border-border bg-surface hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(msg.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-accent mt-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {normalizeLatex(msg.content)}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-xs text-muted">
                          <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsave(msg.id);
                            }}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            Unsave
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
