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
        <Link href={user ? (role === "instructor" ? "/admin/courses" : "/student/courses") : "/"} className="flex items-center gap-2">
          <img src="/logo.png" alt="pigeonhole" className="h-9 w-9 object-contain" />
          <span className="font-bold text-xl tracking-tight text-accent">pigeonhole</span>
        </Link>
        {!isAuthPage && !loading && user && (
          <div className="flex items-center gap-6 text-sm">
            {role === "student" && (
              <Link
                href="/student/courses"
                className={`transition-colors ${
                  isStudent ? "text-accent font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                My Courses
              </Link>
            )}
            {role === "instructor" && (
              <Link
                href="/admin/courses"
                className={`transition-colors ${
                  isAdmin ? "text-accent font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                My Courses
              </Link>
            )}
            <Link
              href="/profile"
              className="text-muted hover:text-foreground transition-colors"
            >
              {firstName || user.email}
            </Link>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
