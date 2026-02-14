"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Session } from "@/lib/types";

export default function SessionHistoryPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch(`/api/sessions?course_id=${courseId}`)
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, [courseId]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Past Sessions</h1>
        <p className="text-sm text-muted mt-1">Resume a previous conversation.</p>
      </div>
      {sessions.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-muted text-sm">No past sessions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/student/course/${courseId}?session=${s.id}`}
              className="block bg-surface border border-border rounded-lg p-4 hover:border-accent/40 transition-all"
            >
              <span className="font-medium text-foreground text-sm">{s.title}</span>
              <p className="text-xs text-muted mt-0.5">
                {new Date(s.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
