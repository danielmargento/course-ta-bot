"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import PigeonHero from "@/components/landing/PigeonHero";

export default function HomePage() {
  const { user, role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const dest = role === "instructor" ? "/admin/courses" : "/student/courses";
      router.replace(dest);
    }
  }, [loading, user, role, router]);

  if (loading || user) {
    return (
      <div className="max-w-xl mx-auto text-center mt-24">
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      {/* Hero — full-width so envelopes span the entire screen */}
      <section className="relative pt-20 pb-14">
        {/* Floating envelopes that fly across the screen */}
        <style>{`
          /* Left-to-right flights */
          @keyframes flyRight1 {
            0%   { transform: translate(-15vw, 0) rotate(-5deg); }
            50%  { transform: translate(50vw, -40px) rotate(3deg); }
            100% { transform: translate(110vw, 20px) rotate(-4deg); }
          }
          @keyframes flyRight2 {
            0%   { transform: translate(-15vw, 0) rotate(3deg); }
            40%  { transform: translate(40vw, 30px) rotate(-4deg); }
            100% { transform: translate(110vw, -15px) rotate(5deg); }
          }
          @keyframes flyRight3 {
            0%   { transform: translate(-15vw, 0) rotate(-3deg); }
            60%  { transform: translate(55vw, -25px) rotate(4deg); }
            100% { transform: translate(110vw, 10px) rotate(-2deg); }
          }
          /* Right-to-left flights */
          @keyframes flyLeft1 {
            0%   { transform: translate(15vw, 0) rotate(4deg); }
            50%  { transform: translate(-50vw, 35px) rotate(-3deg); }
            100% { transform: translate(-110vw, -10px) rotate(5deg); }
          }
          @keyframes flyLeft2 {
            0%   { transform: translate(15vw, 0) rotate(-3deg); }
            45%  { transform: translate(-45vw, -30px) rotate(5deg); }
            100% { transform: translate(-110vw, 20px) rotate(-4deg); }
          }
          @keyframes flyLeft3 {
            0%   { transform: translate(15vw, 0) rotate(2deg); }
            55%  { transform: translate(-48vw, 25px) rotate(-4deg); }
            100% { transform: translate(-110vw, -5px) rotate(3deg); }
          }
          @keyframes dashMove {
            0%   { stroke-dashoffset: 20; }
            100% { stroke-dashoffset: 0; }
          }
          .fly-r1 { animation: flyRight1 11s linear infinite; }
          .fly-r2 { animation: flyRight2 14s linear infinite; animation-delay: 3s; }
          .fly-r3 { animation: flyRight3 12s linear infinite; animation-delay: 7s; }
          .fly-l1 { animation: flyLeft1 13s linear infinite; animation-delay: 1.5s; }
          .fly-l2 { animation: flyLeft2 10s linear infinite; animation-delay: 5s; }
          .fly-l3 { animation: flyLeft3 15s linear infinite; animation-delay: 9s; }
          .wind-trail {
            stroke-dasharray: 6 4;
            animation: dashMove 0.4s linear infinite;
          }
        `}</style>

        {/* Envelope 1 — flies right, large */}
        <div className="fly-r1 absolute pointer-events-none" style={{ top: '8%', left: '0' }}>
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
            <path className="wind-trail" d="M118 42 Q95 39 78 42" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path className="wind-trail" d="M115 52 Q96 49 82 52" stroke="#c4b5a0" strokeWidth="1" fill="none" opacity="0.35" />
            <rect x="10" y="20" width="56" height="40" rx="4" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M10 20 L38 45 L66 20" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Envelope 2 — flies left, medium */}
        <div className="fly-l1 absolute pointer-events-none" style={{ top: '30%', right: '0' }}>
          <svg width="95" height="72" viewBox="0 0 95 72" fill="none">
            <path className="wind-trail" d="M2 33 Q18 30 30 33" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.5" />
            <rect x="38" y="16" width="44" height="32" rx="3.5" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M38 16 L60 36 L82 16" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Envelope 3 — flies right, small */}
        <div className="fly-r2 absolute pointer-events-none" style={{ top: '55%', left: '0' }}>
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
            <path className="wind-trail" d="M78 28 Q62 25 50 28" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.45" />
            <rect x="7" y="14" width="38" height="27" rx="3" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M7 14 L26 31 L45 14" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Envelope 4 — flies left, large */}
        <div className="fly-l2 absolute pointer-events-none" style={{ top: '15%', right: '0' }}>
          <svg width="110" height="82" viewBox="0 0 110 82" fill="none">
            <path className="wind-trail" d="M2 38 Q22 35 36 38" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.5" />
            <path className="wind-trail" d="M5 48 Q22 45 34 48" stroke="#c4b5a0" strokeWidth="1" fill="none" opacity="0.35" />
            <rect x="42" y="18" width="52" height="37" rx="4" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M42 18 L68 41 L94 18" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Envelope 5 — flies right, medium-large */}
        <div className="fly-r3 absolute pointer-events-none" style={{ top: '42%', left: '0' }}>
          <svg width="105" height="78" viewBox="0 0 105 78" fill="none">
            <path className="wind-trail" d="M103 36 Q82 33 68 36" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.45" />
            <rect x="8" y="18" width="50" height="36" rx="4" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M8 18 L33 40 L58 18" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Envelope 6 — flies left, small */}
        <div className="fly-l3 absolute pointer-events-none" style={{ top: '65%', right: '0' }}>
          <svg width="75" height="56" viewBox="0 0 75 56" fill="none">
            <path className="wind-trail" d="M2 26 Q16 23 26 26" stroke="#c4b5a0" strokeWidth="1.5" fill="none" opacity="0.4" />
            <rect x="32" y="12" width="34" height="24" rx="3" fill="#f5efe6" stroke="#c4b5a0" strokeWidth="1.5" />
            <path d="M32 12 L49 28 L66 12" fill="none" stroke="#c4b5a0" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-center relative z-10">
          <div className="flex justify-center mb-6">
            <PigeonHero />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
            pigeonhole
          </h1>
          <p className="text-lg text-muted max-w-md mx-auto leading-relaxed">
            Your AI teaching assistant that helps students learn — not cheat.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <Link
              href="/signup"
              className="bg-accent text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="border border-border text-foreground px-6 py-2.5 rounded text-sm font-medium hover:bg-accent-light transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border pt-12 pb-12 max-w-3xl mx-auto px-6">
        <h2 className="text-2xl text-foreground text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="text-sm text-accent mb-2">Instructors</div>
            <h3 className="text-base text-foreground mb-1.5">Set the guardrails</h3>
            <p className="text-sm text-muted leading-relaxed">
              Choose what the bot can and can&apos;t reveal — no final answers, no full code,
              hints only. Pick a teaching style and upload course materials.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="text-sm text-accent mb-2">Students</div>
            <h3 className="text-base text-foreground mb-1.5">Ask for help</h3>
            <p className="text-sm text-muted leading-relaxed">
              Chat with an AI TA that knows your course, your assignments, and your
              instructor&apos;s policies. Get hints, explanations, and debugging guidance.
            </p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-5">
            <div className="text-sm text-accent mb-2">Learning</div>
            <h3 className="text-base text-foreground mb-1.5">Scaffolded, not spoon-fed</h3>
            <p className="text-sm text-muted leading-relaxed">
              The bot guides you step by step — concept checks, targeted hints, &ldquo;try this
              next&rdquo; prompts — so you actually understand the material.
            </p>
          </div>
        </div>
      </section>

      {/* Why this exists */}
      <section className="border-t border-border pt-12 pb-16 max-w-3xl mx-auto px-6">
        <h2 className="text-2xl text-foreground text-center mb-4">Why this exists</h2>
        <div className="max-w-2xl mx-auto space-y-4 text-sm text-muted leading-relaxed">
          <p>
            Students have always used every resource available to them — office hours,
            study groups, Stack Overflow, and now AI. The problem isn&apos;t that students
            use AI. It&apos;s that general-purpose chatbots have no concept of course policy,
            academic integrity, or pedagogical intent. They&apos;ll happily hand over a full
            solution the night before a deadline.
          </p>
          <p>
            pigeonhole flips the model. Instead of banning AI and hoping for the best,
            instructors define exactly how the AI should help: which topics are fair game,
            what level of detail is appropriate, and when the bot should push back and
            ask the student to try first. The result is an AI that teaches the way the
            instructor would — available 24/7, infinitely patient, and policy-aware.
          </p>
          <p>
            For students, it means getting unstuck at 2 AM without waiting for office hours.
            For instructors, it means knowing that the help students receive is aligned with
            their learning objectives — not undermining them.
          </p>
        </div>
      </section>
    </div>
  );
}
