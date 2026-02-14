"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabaseClient";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, firstName, loading } = useUser();
  const isAdmin = pathname.startsWith("/admin");
  const isStudent = pathname.startsWith("/student");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="pigeonhole" className="h-8 w-8 object-contain" />
          <span className="font-bold text-lg tracking-tight text-accent">pigeonhole</span>
        </Link>
        {!isAuthPage && !loading && user && (
          <div className="flex items-center gap-4">
            <nav className="flex gap-1 text-sm">
              {role === "student" && (
                <Link
                  href="/student/courses"
                  className={`px-3 py-1.5 rounded transition-colors ${
                    isStudent
                      ? "bg-accent-light text-accent font-medium"
                      : "text-muted hover:text-foreground hover:bg-accent-light/50"
                  }`}
                >
                  My Courses
                </Link>
              )}
              {role === "instructor" && (
                <Link
                  href="/admin/courses"
                  className={`px-3 py-1.5 rounded transition-colors ${
                    isAdmin
                      ? "bg-accent-light text-accent font-medium"
                      : "text-muted hover:text-foreground hover:bg-accent-light/50"
                  }`}
                >
                  My Courses
                </Link>
              )}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/profile"
                className="text-muted text-xs hover:text-foreground transition-colors"
              >
                {firstName || user.email}
              </Link>
              <button
                onClick={handleLogout}
                className="text-muted hover:text-foreground text-xs transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
