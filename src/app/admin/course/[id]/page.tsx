"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import PolicyEditor from "@/components/admin/PolicyEditor";
import StylePresetSelect from "@/components/admin/StylePresetSelect";
import ContextUploader from "@/components/admin/ContextUploader";
import AssignmentEditor from "@/components/admin/AssignmentEditor";
import PreviewPanel from "@/components/admin/PreviewPanel";
import InsightsPanel from "@/components/admin/InsightsPanel";
import { PolicyConfig, StylePreset } from "@/lib/types";
import { defaultPolicy } from "@/config/defaultPolicy";

type Tab = "policy" | "context" | "assignments" | "preview" | "insights";

export default function AdminCoursePage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("policy");
  const [policy, setPolicy] = useState<PolicyConfig>(defaultPolicy);
  const [stylePreset, setStylePreset] = useState<StylePreset>("socratic");
  const [context, setContext] = useState("");

  const tabs: { key: Tab; label: string }[] = [
    { key: "policy", label: "Policy" },
    { key: "context", label: "Context" },
    { key: "assignments", label: "Assignments" },
    { key: "preview", label: "Preview" },
    { key: "insights", label: "Insights" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Course Configuration</h1>
        <p className="text-sm text-muted mt-1">Configure your TA bot&apos;s behavior and policies.</p>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        {activeTab === "policy" && (
          <div className="space-y-6">
            <StylePresetSelect value={stylePreset} onChange={setStylePreset} />
            <hr className="border-border" />
            <PolicyEditor policy={policy} onChange={setPolicy} />
          </div>
        )}
        {activeTab === "context" && (
          <ContextUploader context={context} onChange={setContext} />
        )}
        {activeTab === "assignments" && (
          <AssignmentEditor
            onSave={(a) => {
              fetch("/api/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...a, course_id: courseId }),
              });
            }}
          />
        )}
        {activeTab === "preview" && <PreviewPanel courseId={courseId} />}
        {activeTab === "insights" && <InsightsPanel insights={null} />}
      </div>
    </div>
  );
}
