import { PolicyConfig, TopicGate } from "./types";

/** Check if user message requests a disallowed artifact */
export function isDisallowedRequest(
  message: string,
  policy: PolicyConfig
): { blocked: boolean; reason?: string } {
  const lower = message.toLowerCase();

  if (!policy.allow_final_answers && /give me the (answer|solution)/i.test(lower)) {
    return { blocked: true, reason: policy.refusal_message };
  }

  if (!policy.allow_full_code && /give me the (full |complete )?code/i.test(lower)) {
    return { blocked: true, reason: policy.refusal_message };
  }

  return { blocked: false };
}

/** Check if topic is gated */
export function checkTopicGate(
  topic: string,
  gates: TopicGate[]
): { gated: boolean; gate?: TopicGate } {
  const gate = gates.find(
    (g) => g.topic.toLowerCase() === topic.toLowerCase()
  );
  if (gate && gate.status === "not_yet_taught") {
    return { gated: true, gate };
  }
  return { gated: false };
}

/** Build policy instruction block for system prompt */
export function buildPolicyInstructions(policy: PolicyConfig): string {
  const lines: string[] = [];

  lines.push("## Guardrails & Policy");

  if (!policy.allow_final_answers) {
    lines.push("- Do NOT provide final answers or complete solutions.");
  }
  if (!policy.allow_full_code) {
    lines.push("- Do NOT provide full working code. Pseudocode and partial snippets are OK.");
  }
  if (policy.require_attempt_first) {
    lines.push(
      "- Before giving hints, ask the student to share what they have tried so far."
    );
  }

  lines.push(`- Use up to ${policy.hint_levels} levels of hints before escalating.`);

  if (policy.allowed_artifacts.length > 0) {
    lines.push(`- Allowed artifacts: ${policy.allowed_artifacts.join(", ")}`);
  }
  if (policy.disallowed_artifacts.length > 0) {
    lines.push(`- Disallowed artifacts: ${policy.disallowed_artifacts.join(", ")}`);
  }

  if (policy.topic_gates.length > 0) {
    lines.push("- Topic gating:");
    for (const gate of policy.topic_gates) {
      lines.push(
        `  - "${gate.topic}": ${gate.status}${gate.message ? ` — ${gate.message}` : ""}`
      );
    }
  }

  lines.push(`- Refusal message: "${policy.refusal_message}"`);

  return lines.join("\n");
}
