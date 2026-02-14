"use client";

interface Props {
  saved: boolean;
  onToggle: () => void;
}

export default function SaveToggle({ saved, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`text-xs transition-colors ${
        saved ? "text-accent font-medium" : "hover:text-accent"
      }`}
      title={saved ? "Unsave" : "Save"}
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
