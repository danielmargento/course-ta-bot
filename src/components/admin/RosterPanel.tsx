"use client";

import { useEffect, useState } from "react";
import { RosterStudent } from "@/lib/types";

interface Props {
  courseId: string;
}

export default function RosterPanel({ courseId }: Props) {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/roster?course_id=${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStudents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <p className="text-sm text-muted">Loading roster...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">
          Enrolled Students
        </h3>
        <span className="text-xs text-muted">{students.length} student{students.length !== 1 ? "s" : ""}</span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted">No students enrolled yet. Share your class code to get started.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background text-left">
                <th className="px-4 py-2 text-xs font-medium text-muted">Name</th>
                <th className="px-4 py-2 text-xs font-medium text-muted">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2.5 text-foreground">
                    {s.first_name || s.last_name
                      ? `${s.first_name} ${s.last_name}`.trim()
                      : "Unnamed student"}
                  </td>
                  <td className="px-4 py-2.5 text-muted text-xs">
                    {new Date(s.enrolled_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
