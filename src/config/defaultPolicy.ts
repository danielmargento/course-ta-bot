import { PolicyConfig } from "@/lib/types";

export const defaultPolicy: PolicyConfig = {
  allow_final_answers: false,
  allow_full_code: false,
  require_attempt_first: true,
  hint_levels: 3,
  allowed_artifacts: ["pseudocode", "diagrams", "partial_code", "concept_explanation"],
  disallowed_artifacts: ["full_solution", "solution_outline", "test_answers"],
  refusal_message:
    "I can't provide that directly, but I can help guide you toward the answer. Can you share what you've tried so far?",
  topic_gates: [],
};
