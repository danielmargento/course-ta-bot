import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-xl mx-auto text-center mt-24">
      <h1 className="text-3xl font-bold text-foreground mb-2">Course TA</h1>
      <p className="text-muted mb-10 text-[15px]">
        AI teaching assistants that guide you through scaffolded learning.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/student/courses"
          className="bg-accent text-white px-6 py-2.5 rounded font-medium text-sm hover:bg-accent-hover transition-colors"
        >
          Student Dashboard
        </Link>
        <Link
          href="/admin/courses"
          className="bg-surface text-foreground px-6 py-2.5 rounded font-medium text-sm border border-border hover:bg-accent-light transition-colors"
        >
          Instructor Dashboard
        </Link>
      </div>
    </div>
  );
}
