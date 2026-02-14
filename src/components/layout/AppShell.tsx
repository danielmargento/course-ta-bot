"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isStudent = pathname.startsWith("/student");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-[#1a2332] text-white px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Course TA
        </Link>
        <nav className="flex gap-1 text-sm">
          <Link
            href="/student/courses"
            className={`px-3 py-1.5 rounded transition-colors ${
              isStudent
                ? "bg-white/15 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Student
          </Link>
          <Link
            href="/admin/courses"
            className={`px-3 py-1.5 rounded transition-colors ${
              isAdmin
                ? "bg-white/15 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            Instructor
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
