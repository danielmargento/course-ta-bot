import { UsageInsight } from "./types";

/** Placeholder: aggregate usage insights for a course from raw session/message data */
export function aggregateInsights(
  courseId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
): UsageInsight {
  return {
    course_id: courseId,
    top_topics: [],
    top_assignments: [],
    total_sessions: sessions.length,
    total_messages: messages.length,
  };
}
