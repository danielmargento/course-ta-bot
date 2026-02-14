"use client";

interface Props {
  context: string;
  onChange: (context: string) => void;
}

export default function ContextUploader({ context, onChange }: Props) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-1">
        Course Context
      </label>
      <p className="text-xs text-muted mb-3">
        Paste syllabus, lecture notes, or other materials the TA should reference.
      </p>
      <textarea
        className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
        rows={12}
        placeholder="Paste course context here..."
        value={context}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
