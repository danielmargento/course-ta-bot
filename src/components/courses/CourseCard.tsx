"use client";

import Link from "next/link";
import { Course } from "@/lib/types";

interface Props {
  course: Course;
  basePath: string;
  showClassCode?: boolean;
  onDelete?: (id: string) => void;
}

export default function CourseCard({ course, basePath, showClassCode, onDelete }: Props) {
  return (
    <div className="relative bg-surface border border-border rounded-lg p-5 hover:border-accent/40 hover:shadow-sm transition-all group">
      <Link href={`${basePath}/${course.id}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-0.5 rounded">
              {course.code}
            </span>
            <h3 className="font-semibold text-foreground mt-2 group-hover:text-accent transition-colors">
              {course.name}
            </h3>
          </div>
          <span className="text-muted text-lg">&rarr;</span>
        </div>
        {course.description && (
          <p className="text-sm text-muted mt-2 line-clamp-2">{course.description}</p>
        )}
        {showClassCode && course.class_code && (
          <p className="text-xs text-muted mt-3">
            Join code: <span className="font-mono font-semibold text-foreground">{course.class_code}</span>
          </p>
        )}
      </Link>
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm("Delete this course? This will remove all assignments, sessions, and enrollments.")) {
              onDelete(course.id);
            }
          }}
          className="absolute top-3 right-3 text-muted hover:text-red-500 text-xs transition-colors opacity-0 group-hover:opacity-100"
        >
          Delete
        </button>
      )}
    </div>
  );
}
