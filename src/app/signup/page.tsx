"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Create user via server API (bypasses email confirmation)
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, firstName, lastName, role }),
    });
    const result = await res.json();

    if (!res.ok) {
      setError(result.error || "Signup failed");
      setLoading(false);
      return;
    }

    // Now sign in client-side
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
      <p className="text-sm text-muted mb-6">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted block mb-1">First Name</label>
            <input
              type="text"
              className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted block mb-1">Last Name</label>
            <input
              type="text"
              className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Email</label>
          <input
            type="email"
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Password</label>
          <input
            type="password"
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Role</label>
          <select
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            value={role}
            onChange={(e) => setRole(e.target.value as "student" | "instructor")}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white px-4 py-2 rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
