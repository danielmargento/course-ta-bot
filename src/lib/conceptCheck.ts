import { ConceptCheckPayload } from "./types";

const CONCEPT_CHECK_REGEX = /\[CONCEPT_CHECK\]([\s\S]*?)\[\/CONCEPT_CHECK\]/;

export interface ParsedMessage {
  cleanContent: string;
  conceptCheck: ConceptCheckPayload | null;
}

export function parseConceptCheck(content: string): ParsedMessage {
  const match = content.match(CONCEPT_CHECK_REGEX);
  if (!match) {
    return { cleanContent: content, conceptCheck: null };
  }

  const cleanContent = content.replace(CONCEPT_CHECK_REGEX, "").trim();

  try {
    const parsed = JSON.parse(match[1]);

    if (
      typeof parsed.question !== "string" ||
      !Array.isArray(parsed.options) ||
      parsed.options.length < 2 ||
      typeof parsed.correct !== "number" ||
      parsed.correct < 0 ||
      parsed.correct >= parsed.options.length
    ) {
      return { cleanContent, conceptCheck: null };
    }

    return {
      cleanContent,
      conceptCheck: {
        question: parsed.question,
        options: parsed.options,
        correct: parsed.correct,
        explanation: parsed.explanation ?? "",
      },
    };
  } catch {
    return { cleanContent, conceptCheck: null };
  }
}

/**
 * Detects an incomplete concept check tag during streaming,
 * so the client can hide the raw tag text until it's complete.
 */
export function hasPartialConceptCheck(content: string): boolean {
  return content.includes("[CONCEPT_CHECK]") && !content.includes("[/CONCEPT_CHECK]");
}
