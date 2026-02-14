"use client";

import { Assignment } from "@/lib/types";

interface Props {
  assignments: Assignment[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function AssignmentSelect({ assignments, selected, onSelect }: Props) {
  return (
    <select
      className="border border-border rounded px-3 py-1.5 text-sm bg-surface focus:outline-none focus:border-accent"
      value={selected ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
    >
      <option value="">General — no assignment</option>
      {assignments.map((a) => (
        <option key={a.id} value={a.id}>
          {a.title}
        </option>
      ))}
    </select>
  );
}
