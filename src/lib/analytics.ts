import { UsageInsight, Session, Message, Assignment } from "./types";

const STOP_WORDS = new Set([
  "about", "after", "again", "being", "between", "could", "does", "doing",
  "during", "every", "from", "have", "having", "here", "into", "just",
  "might", "more", "most", "much", "must", "never", "only", "other",
  "over", "really", "same", "shall", "should", "some", "still", "such",
  "than", "that", "their", "them", "then", "there", "these", "they",
  "this", "those", "through", "under", "very", "want", "what", "when",
  "where", "which", "while", "will", "with", "would", "your",
  "been", "before", "each", "first", "help", "like", "make", "many",
  "need", "also", "back", "because", "come", "even", "give", "good",
  "know", "look", "take", "tell", "think", "trying", "using", "well",
  "work",
]);

export function aggregateInsights(
  courseId: string,
  sessions: Session[],
  messages: Message[],
  assignments: Assignment[]
): UsageInsight {
  // Count sessions per assignment
  const assignmentCounts = new Map<string, number>();
  for (const s of sessions) {
    if (s.assignment_id) {
      assignmentCounts.set(s.assignment_id, (assignmentCounts.get(s.assignment_id) ?? 0) + 1);
    }
  }

  const assignmentMap = new Map(assignments.map((a) => [a.id, a.title]));
  const top_assignments = Array.from(assignmentCounts.entries())
    .map(([assignment_id, count]) => ({
      assignment_id,
      title: assignmentMap.get(assignment_id) ?? "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Extract topic keywords from user messages
  const wordCounts = new Map<string, number>();
  const userMessages = messages.filter((m) => m.role === "user");
  for (const m of userMessages) {
    const words = m.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w));

    const seen = new Set<string>();
    for (const word of words) {
      if (!seen.has(word)) {
        seen.add(word);
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
      }
    }
  }

  const top_topics = Array.from(wordCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    course_id: courseId,
    top_topics,
    top_assignments,
    total_sessions: sessions.length,
    total_messages: messages.length,
  };
}
