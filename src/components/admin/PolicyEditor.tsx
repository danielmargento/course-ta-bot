"use client";

import { PolicyConfig } from "@/lib/types";

interface Props {
  policy: PolicyConfig;
  onChange: (policy: PolicyConfig) => void;
}

export default function PolicyEditor({ policy, onChange }: Props) {
  const toggle = (key: keyof PolicyConfig) => {
    onChange({ ...policy, [key]: !policy[key] });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Guardrails &amp; Policy</h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={policy.allow_final_answers}
            onChange={() => toggle("allow_final_answers")}
            className="accent-accent"
          />
          Allow final answers
        </label>
        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={policy.allow_full_code}
            onChange={() => toggle("allow_full_code")}
            className="accent-accent"
          />
          Allow full code solutions
        </label>
        <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={policy.require_attempt_first}
            onChange={() => toggle("require_attempt_first")}
            className="accent-accent"
          />
          Require student attempt first
        </label>
      </div>
      <div>
        <label className="text-sm text-muted block mb-1">
          Hint levels: <span className="font-medium text-foreground">{policy.hint_levels}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={policy.hint_levels}
          onChange={(e) =>
            onChange({ ...policy, hint_levels: parseInt(e.target.value) })
          }
          className="w-full accent-accent"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted block mb-1">Refusal message</label>
        <textarea
          className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
          rows={2}
          value={policy.refusal_message}
          onChange={(e) => onChange({ ...policy, refusal_message: e.target.value })}
        />
      </div>
    </div>
  );
}
