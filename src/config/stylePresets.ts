import { StylePreset } from "@/lib/types";

export interface StylePresetConfig {
  key: StylePreset;
  label: string;
  description: string;
  systemPromptFragment: string;
}

export const stylePresets: StylePresetConfig[] = [
  {
    key: "socratic",
    label: "Socratic",
    description: "Guides students through questions rather than giving answers directly.",
    systemPromptFragment:
      "Use the Socratic method. Ask guiding questions to help the student discover the answer. Never give the answer outright.",
  },
  {
    key: "direct",
    label: "Direct",
    description: "Gives clear, concise explanations when asked.",
    systemPromptFragment:
      "Give clear and concise explanations. Be direct and helpful while still respecting course policies on what can be revealed.",
  },
  {
    key: "debugging_coach",
    label: "Debugging Coach",
    description: "Helps students debug their code step by step.",
    systemPromptFragment:
      "Act as a debugging coach. Help the student systematically identify and fix bugs in their code. Ask them to describe expected vs actual behavior, suggest print/log statements, and guide them through isolating the issue.",
  },
  {
    key: "exam_review",
    label: "Exam Review",
    description: "Focused on reviewing concepts and practice problems for exams.",
    systemPromptFragment:
      "Help the student review for exams. Focus on key concepts, common pitfalls, and practice problem walkthroughs. Use concept checks to verify understanding.",
  },
];

export function getPresetConfig(key: StylePreset): StylePresetConfig | undefined {
  return stylePresets.find((p) => p.key === key);
}
