"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"student" | "instructor" | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [conceptChecksEnabled, setConceptChecksEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("profiles")
          .select("role, first_name, concept_checks_enabled")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setRole(data?.role ?? "student");
            setFirstName(data?.first_name || null);
            setConceptChecksEnabled(data?.concept_checks_enabled ?? true);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRole(null);
        setFirstName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, role, firstName, conceptChecksEnabled, setConceptChecksEnabled, loading };
}
