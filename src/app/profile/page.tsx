"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setEmail(data.email);
          setRole(data.role);
          setFirstName(data.firstName);
          setLastName(data.lastName);
        }
        setLoading(false);
      });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName }),
    });

    if (res.ok) {
      setMessage("Profile updated.");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to save.");
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-muted text-sm mt-12 text-center">Loading...</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Email</label>
          <input
            type="email"
            className="border border-border rounded px-3 py-2 text-sm w-full bg-gray-50 text-muted"
            value={email}
            disabled
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Role</label>
          <input
            type="text"
            className="border border-border rounded px-3 py-2 text-sm w-full bg-gray-50 text-muted capitalize"
            value={role}
            disabled
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">First Name</label>
          <input
            type="text"
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Last Name</label>
          <input
            type="text"
            className="border border-border rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("updated") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-accent text-white px-4 py-2 rounded text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
