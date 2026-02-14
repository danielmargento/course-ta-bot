"use client";

import { StylePreset } from "@/lib/types";
import { stylePresets } from "@/config/stylePresets";

interface Props {
  value: StylePreset;
  onChange: (preset: StylePreset) => void;
}

export default function StylePresetSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-2">Teaching Style</label>
      <div className="grid grid-cols-2 gap-2">
        {stylePresets.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`text-left border rounded-lg p-3 transition-all text-sm ${
              value === p.key
                ? "border-accent bg-accent-light"
                : "border-border hover:border-accent/40"
            }`}
          >
            <span className="font-medium text-foreground">{p.label}</span>
            <p className="text-xs text-muted mt-0.5">{p.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
