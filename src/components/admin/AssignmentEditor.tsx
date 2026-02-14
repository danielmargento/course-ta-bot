"use client";

import { useState } from "react";

interface Props {
  onSave: (assignment: {
    title: string;
    prompt: string;
    staff_notes: string;
    faq: string[];
  }) => void;
}

export default function AssignmentEditor({ onSave }: Props) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [faq, setFaq] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      prompt,
      staff_notes: staffNotes,
      faq: faq
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
    setTitle("");
    setPrompt("");
    setStaffNotes("");
    setFaq("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted block mb-1">Assignment Title</label>
        <input
          className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted block mb-1">Prompt</label>
        <textarea
          className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted block mb-1">
          Staff Notes <span className="text-muted/60">(hidden from students)</span>
        </label>
        <textarea
          className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
          rows={3}
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted block mb-1">FAQ (one per line)</label>
        <textarea
          className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
          rows={3}
          value={faq}
          onChange={(e) => setFaq(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-accent text-white px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Add Assignment
      </button>
    </form>
  );
}
