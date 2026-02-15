"use client";

import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import "katex/dist/katex.min.css";
import { Assignment, Message, ConceptCheck } from "@/lib/types";
import { parseConceptCheck } from "@/lib/conceptCheck";
import { printMessages, PdfGroup } from "@/lib/pdf";

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

type SavedItem =
  | { type: "message"; id: string; assignmentId: string | null; data: SavedMessage }
  | { type: "concept_check"; id: string; assignmentId: string | null; data: ConceptCheck };

interface Props {
  courseId: string;
  assignments: Assignment[];
}

export default function SavedNotesPanel({ courseId, assignments }: Props) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchSaved = useCallback(async () => {
    try {
      const [msgRes, ccRes] = await Promise.all([
        fetch(`/api/messages?course_id=${courseId}&saved=true`),
        fetch(`/api/concept-checks?course_id=${courseId}&saved=true`),
      ]);
      const msgs: SavedMessage[] = await msgRes.json();
      const ccs: ConceptCheck[] = await ccRes.json();

      const all: SavedItem[] = [];

      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          all.push({
            type: "message",
            id: m.id,
            assignmentId: m.session?.assignment_id ?? null,
            data: m,
          });
        }
      }

      if (Array.isArray(ccs)) {
        for (const cc of ccs) {
          all.push({
            type: "concept_check",
            id: cc.id,
            assignmentId: cc.assignment_id,
            data: cc,
          });
        }
      }

      // Sort by created_at descending
      all.sort(
        (a, b) =>
          new Date(b.type === "message" ? b.data.created_at : b.data.created_at).getTime() -
          new Date(a.type === "message" ? a.data.created_at : a.data.created_at).getTime()
      );

      setItems(all);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleUnsave = async (item: SavedItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });

    if (item.type === "message") {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsave", message_id: item.id }),
      });
    } else {
      await fetch("/api/concept-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsave", concept_check_id: item.id }),
      });
    }
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
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const handleExport = () => {
    const toExport = selected.size > 0 ? items.filter((i) => selected.has(i.id)) : items;

    // Only export messages for now (concept checks don't map to the PDF system)
    const msgItems = toExport.filter((i) => i.type === "message") as Extract<SavedItem, { type: "message" }>[];
    const grouped = new Map<string, Message[]>();
    for (const item of msgItems) {
      const key = item.assignmentId ?? "general";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item.data);
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

  const assignmentMap = new Map(assignments.map((a) => [a.id, a.title]));

  // Group items by assignment
  const groups = new Map<string, SavedItem[]>();
  for (const item of items) {
    const key = item.assignmentId ?? "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
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

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted text-sm">
          No saved notes yet. Save messages or concept checks from the chat to see them here.
        </p>
      </div>
    );
  }

  const allSelected = selected.size === items.length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
          disabled={items.length === 0}
          className="flex items-center gap-1.5 border border-border rounded px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:border-accent/40 disabled:opacity-40 transition-colors bg-surface"
        >
          Export{selected.size > 0 ? ` (${selected.size})` : " all"} as PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sortedKeys.map((key) => {
          const groupItems = groups.get(key)!;
          const groupName = key === "general" ? "General" : assignmentMap.get(key) ?? "Unknown Assignment";

          return (
            <div key={key} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wide">
                {groupName}
              </h3>

              {groupItems.map((item) => {
                const isSelected = selected.has(item.id);
                const createdAt =
                  item.type === "message" ? item.data.created_at : item.data.created_at;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
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
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-accent mt-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {item.type === "message" ? (
                          <MessageContent content={item.data.content} />
                        ) : (
                          <ConceptCheckNote cc={item.data} />
                        )}
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border text-xs text-muted">
                          <span>{new Date(createdAt).toLocaleDateString()}</span>
                          <span className="text-muted/60">
                            {item.type === "concept_check" ? "Concept Check" : "Response"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsave(item);
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

/** Renders a saved message, stripping concept check tags and rendering markdown */
function MessageContent({ content }: { content: string }) {
  const { cleanContent } = parseConceptCheck(content);
  return (
    <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeLatex(cleanContent)}
      </ReactMarkdown>
    </div>
  );
}

/** Renders a saved concept check as a styled card */
function ConceptCheckNote({ cc }: { cc: ConceptCheck }) {
  const answered = cc.student_answer !== null;
  return (
    <div className="border border-accent/30 rounded-lg bg-accent/5 overflow-hidden">
      <div className="px-3 py-1.5 bg-accent/10 border-b border-accent/20">
        <span className="text-xs font-semibold text-accent uppercase tracking-wide">
          Concept Check
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-2">
        <p className="text-sm font-medium text-foreground">{cc.question}</p>
        <div className="space-y-1.5">
          {(cc.options as string[]).map((option, i) => {
            let className = "w-full text-left px-2.5 py-1.5 rounded-md text-xs border ";
            if (!answered) {
              className += "border-border bg-surface";
            } else if (i === cc.correct_index) {
              className += "border-green-400 bg-green-50 text-green-800";
            } else if (i === cc.student_answer) {
              className += "border-red-400 bg-red-50 text-red-800";
            } else {
              className += "border-border bg-surface opacity-50";
            }
            return (
              <div key={i} className={className}>
                {option}
              </div>
            );
          })}
        </div>
        {answered && cc.explanation && (
          <div
            className={`text-xs px-2.5 py-1.5 rounded-md ${
              cc.is_correct
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span className="font-semibold">
              {cc.is_correct ? "Correct!" : "Not quite."}
            </span>{" "}
            {cc.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
