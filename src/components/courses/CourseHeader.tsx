"use client";

import { Course } from "@/lib/types";

interface Props {
  course: Course;
}

export default function CourseHeader({ course }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">
        {course.code}: {course.name}
      </h1>
      {course.description && <p className="text-gray-600 mt-1">{course.description}</p>}
    </div>
  );
}
