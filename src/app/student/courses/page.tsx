"use client";

import { useEffect, useState } from "react";
import CourseCard from "@/components/courses/CourseCard";
import { Course } from "@/lib/types";

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">My Courses</h1>
        <p className="text-sm text-muted mt-1">Select a course to start chatting with your TA.</p>
      </div>
      {courses.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-muted text-sm">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} basePath="/student/course" />
          ))}
        </div>
      )}
    </div>
  );
}
