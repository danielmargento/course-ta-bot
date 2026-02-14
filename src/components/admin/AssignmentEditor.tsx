"use client";

import { useMemo, useState } from "react";
import { CourseMaterial, PolicyConfig, StylePreset } from "@/lib/types";
import { stylePresets } from "@/config/stylePresets";

interface Props {
  materials?: CourseMaterial[];
  onSave: (assignment: {
    title: string;
    prompt: string;
    staff_notes: string;
    faq: string[];
    style_preset: StylePreset;
    overrides: Partial<PolicyConfig> | null;
    material_ids: string[];
  }) => void;
}

export default function AssignmentEditor({ materials = [], onSave }: Props) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [faq, setFaq] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [stylePreset, setStylePreset] = useState<StylePreset>("socratic");

  // Policy controls
  const [allowFinalAnswers, setAllowFinalAnswers] = useState(false);
  const [allowFullCode, setAllowFullCode] = useState(false);
  const [requireAttemptFirst, setRequireAttemptFirst] = useState(true);
  const [hintLevels, setHintLevels] = useState(3);
  const [refusalMessage, setRefusalMessage] = useState("");

  // Group materials by category
  const materialsByCategory = useMemo(() => {
    const groups: Record<string, CourseMaterial[]> = {};
    for (const m of materials) {
      const cat = m.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    }
    return groups;
  }, [materials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const overrides: Partial<PolicyConfig> = {
      allow_final_answers: allowFinalAnswers,
      allow_full_code: allowFullCode,
      require_attempt_first: requireAttemptFirst,
      hint_levels: hintLevels,
    };
    if (refusalMessage.trim()) {
      overrides.refusal_message = refusalMessage.trim();
    }

    onSave({
      title,
      prompt,
      staff_notes: staffNotes,
      faq: faq.split("\n").map((l) => l.trim()).filter(Boolean),
      style_preset: stylePreset,
      overrides,
      material_ids: selectedMaterialIds,
    });
    setTitle("");
    setPrompt("");
    setStaffNotes("");
    setFaq("");
    setSelectedMaterialIds([]);
    setStylePreset("socratic");
    setAllowFinalAnswers(false);
    setAllowFullCode(false);
    setRequireAttemptFirst(true);
    setHintLevels(3);
    setRefusalMessage("");
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

      {/* Style Preset */}
      <div>
        <label className="text-xs font-medium text-muted block mb-1">Teaching Style</label>
        <div className="grid grid-cols-2 gap-2">
          {stylePresets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setStylePreset(p.key)}
              className={`text-left border rounded-lg p-3 transition-all text-sm ${
                stylePreset === p.key
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

      {/* Materials selector grouped by category */}
      {materials.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted block mb-1">
            Relevant Materials <span className="text-muted/60">(select which materials apply)</span>
          </label>
          <div className="border border-border rounded-lg p-3 bg-background space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => {
              const allSelected = categoryMaterials.every((m) => selectedMaterialIds.includes(m.id));
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {category}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setSelectedMaterialIds(
                            selectedMaterialIds.filter((id) => !categoryMaterials.some((m) => m.id === id))
                          );
                        } else {
                          const newIds = new Set([...selectedMaterialIds, ...categoryMaterials.map((m) => m.id)]);
                          setSelectedMaterialIds([...newIds]);
                        }
                      }}
                      className="text-[10px] text-accent hover:underline"
                    >
                      {allSelected ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {categoryMaterials.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMaterialIds.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterialIds([...selectedMaterialIds, m.id]);
                            } else {
                              setSelectedMaterialIds(selectedMaterialIds.filter((id) => id !== m.id));
                            }
                          }}
                          className="accent-accent"
                        />
                        {m.file_name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Policy Controls */}
      <div className="border border-border rounded-lg p-4 bg-background space-y-3">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Policy</h4>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={allowFinalAnswers}
            onChange={(e) => setAllowFinalAnswers(e.target.checked)}
            className="accent-accent"
          />
          Allow final answers
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={allowFullCode}
            onChange={(e) => setAllowFullCode(e.target.checked)}
            className="accent-accent"
          />
          Allow full code solutions
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={requireAttemptFirst}
            onChange={(e) => setRequireAttemptFirst(e.target.checked)}
            className="accent-accent"
          />
          Require student attempt first
        </label>
        <div>
          <label className="text-xs text-muted block mb-1">Hint levels</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={5}
              value={hintLevels}
              onChange={(e) => setHintLevels(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-xs text-foreground font-medium w-4">{hintLevels}</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Refusal message</label>
          <textarea
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent bg-background"
            rows={2}
            value={refusalMessage}
            onChange={(e) => setRefusalMessage(e.target.value)}
            placeholder="Custom message when the bot declines to answer..."
          />
        </div>
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
