import { Assignment, BotConfig, Course } from "./types";
import { buildPolicyInstructions } from "./policy";
import { getPresetConfig } from "@/config/stylePresets";

export function buildSystemPrompt(
  course: Course,
  config: BotConfig,
  assignment?: Assignment | null
): string {
  const sections: string[] = [];

  sections.push(`You are an AI Teaching Assistant for the course "${course.name}" (${course.code}).`);
  sections.push(
    "Your role is to help students learn through scaffolded guidance, not by giving away answers."
  );

  // Style preset
  const preset = getPresetConfig(config.style_preset);
  if (preset) {
    sections.push(`\n## Teaching Style: ${preset.label}\n${preset.systemPromptFragment}`);
  }

  // Policy
  sections.push(`\n${buildPolicyInstructions(config.policy)}`);

  // Course context
  if (config.context) {
    sections.push(`\n## Course Context\n${config.context}`);
  }

  // Assignment context
  if (assignment) {
    sections.push(`\n## Current Assignment: ${assignment.title}\n${assignment.prompt}`);
    if (assignment.staff_notes) {
      sections.push(
        `\n## Staff Notes (hidden from student, use to guide responses)\n${assignment.staff_notes}`
      );
    }
    if (assignment.faq.length > 0) {
      sections.push(`\n## FAQ\n${assignment.faq.map((q) => `- ${q}`).join("\n")}`);
    }
  }

  return sections.join("\n");
}
