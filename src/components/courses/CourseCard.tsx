"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Course, Announcement } from "@/lib/types";

interface Props {
  course: Course;
  basePath: string;
  showClassCode?: boolean;
  announcements?: Announcement[];
  onDelete?: (id: string) => void;
  onLeave?: (id: string) => void;
}

export default function CourseCard({ course, basePath, showClassCode, announcements, onDelete, onLeave }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unviewedCount = announcements?.filter((a) => !a.viewed).length ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showAnnouncements) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAnnouncements(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAnnouncements]);

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
            Join code:{" "}
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(course.class_code);
              }}
              className="font-mono font-semibold text-foreground hover:text-accent transition-colors cursor-pointer"
              title="Click to copy"
            >
              {course.class_code}
            </button>
          </p>
        )}
      </Link>

      {announcements && announcements.length > 0 && (
        <div ref={dropdownRef} className="relative mt-3 pt-3 border-t border-border">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!showAnnouncements && announcements) {
                // Mark unviewed announcements as viewed
                announcements.forEach((a) => {
                  if (!a.viewed) {
                    fetch("/api/announcements/view", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ announcement_id: a.id }),
                    });
                  }
                });
              }
              setShowAnnouncements(!showAnnouncements);
            }}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
              <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
            </svg>
            <span>Announcements ({announcements.length})</span>
            {unviewedCount > 0 && (
              <span className="bg-accent text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none">
                {unviewedCount} new
              </span>
            )}
          </button>

          {showAnnouncements && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className={`px-3 py-2.5 text-xs border-b border-border last:border-b-0 ${
                    a.viewed ? "text-muted" : "text-foreground bg-accent-light/50"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{a.content}</p>
                  <span className="text-[10px] text-muted mt-1 block">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(onDelete || onLeave) && !confirming && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setConfirming(true);
          }}
          className="absolute top-3 right-3 text-muted hover:text-red-500 text-xs transition-colors opacity-0 group-hover:opacity-100"
        >
          {onLeave ? "Leave" : "Delete"}
        </button>
      )}

      {confirming && onDelete && (
        <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
          <p className="text-xs text-muted mb-2">
            Type <span className="font-semibold text-foreground">{course.name}</span> to confirm deletion:
          </p>
          <div className="flex gap-2">
            <input
              className="border border-border rounded px-2 py-1 text-xs flex-1 focus:outline-none focus:border-red-400 bg-background"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={course.name}
              autoFocus
            />
            <button
              onClick={() => {
                if (confirmText === course.name) onDelete(course.id);
              }}
              disabled={confirmText !== course.name}
              className="px-2 py-1 text-xs rounded bg-red-500 text-white disabled:opacity-30 transition-opacity"
            >
              Delete
            </button>
            <button
              onClick={() => { setConfirming(false); setConfirmText(""); }}
              className="px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirming && onLeave && (
        <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
          <p className="text-xs text-muted mb-2">Leave this course?</p>
          <div className="flex gap-2">
            <button
              onClick={() => onLeave(course.id)}
              className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Leave
            </button>
            <button
              onClick={() => { setConfirming(false); }}
              className="px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
