"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Redirect based on role
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.role === "instructor") {
          router.push("/admin/courses");
        } else {
          router.push("/student/courses");
        }
      });
  }, [user, loading, router]);

  return (
    <div className="max-w-xl mx-auto text-center mt-24">
      <h1 className="text-3xl font-bold text-foreground mb-2">Course TA</h1>
      <p className="text-muted mb-10 text-[15px]">
        AI teaching assistants that guide you through scaffolded learning.
      </p>
      <p className="text-muted text-sm">Redirecting...</p>
    </div>
  );
}
