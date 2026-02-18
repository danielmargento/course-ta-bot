# 🎓 Pascal — AI Teaching Assistant

AI isn't going anywhere. Students are already using ChatGPT, Claude, and Copilot to do their homework — often getting complete solutions with zero learning. Banning AI tools doesn't work. The answer isn't prohibition; it's giving teachers control.

**Pascal** is a course-aware AI TA that puts instructors in the loop. Teachers configure exactly how much help the bot gives, what it can and can't reveal, and which materials it draws from. Students get real-time scaffolded help that builds understanding — not an answer machine.

---

## 💡 Why Pascal?

Most AI tools treat education as an afterthought. Students paste a homework problem into ChatGPT and get a full solution. They learn nothing. Teachers have no visibility or control.

Pascal flips this:

- 🧑‍🏫 **Teacher in the loop.** Instructors set the rules — help level, allowed artifacts, topic restrictions, staff notes — and the bot follows them. The teacher decides whether students get Socratic questioning, guided hints, or full tutoring. Not the AI.
- 🔒 **Integrity first.** The default is restrictive. No answers, no full code, attempt required first. Teachers opt *in* to more permissive modes when appropriate. The bot enforces academic integrity by design, not as an afterthought.
- 📄 **Scoped to real course materials.** Pascal only knows what the teacher gives it — syllabi, lecture notes, problem sets. It doesn't hallucinate references to materials that don't exist. When general chat is enabled, it's limited to teacher-selected documents.
- 📌 **Assignment-aware.** Each assignment can have its own help level, anchor document, staff notes, and annotated hints. When a student asks about "question 4," the bot knows exactly which document to look in.

---

## ✨ Features

### 🛠 For Instructors

- **Course creation** with join codes for student enrollment
- **Three help levels** per assignment: Strict (confirmation only), Guided (Socratic hints), Full Support (complete tutoring after effort shown)
- **Policy guardrails** — toggle final answers, full code, require-attempt-first, allowed/disallowed artifacts
- **Topic gating** — mark topics as "not yet taught," "allowed," or "warn" to prevent the bot from spoiling upcoming material
- **Staff notes** — private per-assignment instructions the bot follows but never reveals to students
- **Anchor documents** — designate one material as THE assignment doc so the bot knows where to look for question numbers
- **PDF annotations** — highlight specific passages in uploaded PDFs with private hints for the bot
- **General chat control** — disabled by default; teachers enable it and select exactly which materials (e.g. syllabus) the bot can reference
- **Course materials** — upload PDFs, text files, and markdown; extracted text is chunked and embedded for RAG retrieval
- **Usage insights** — see which assignments get the most questions, top topics, common misconceptions (LLM-summarized)
- **Announcements** — post messages visible to enrolled students
- **Roster management** — view enrolled students
- **Student view preview** — see exactly what students see

### 🎒 For Students

- **Assignment-aware chat** — select an assignment and get help scoped to that specific problem set and its materials
- **Concept check quizzes** — inline multiple-choice questions after explanations to reinforce learning (toggleable)
- **Clickable source citations** — bot responses link back to specific pages/sections of course materials
- **Save and bookmark** helpful messages during a session
- **Export to PDF** — save threads or snippets for offline review or forum sharing
- **Session history** — resume past conversations per assignment
- **Feedback** — rate responses as helpful, not helpful, or too revealing
- **LaTeX and Markdown** rendering for math-heavy courses

### ⚙️ Under the Hood

- **RAG retrieval** — course materials are chunked, embedded, and searched via vector similarity so the bot references real content, not hallucinations
- **Anchor boosting** — chunks from the designated assignment document get a similarity boost and a guaranteed secondary search fallback
- **Anti-hallucination prompting** — the bot is explicitly forbidden from inventing lecture names, chapter titles, or any references not present in its provided materials
- **Per-assignment policy overrides** — each assignment can override the course-level help policy
- **Streaming responses** via SSE for real-time chat
- **Question hint matching** — the bot detects when students reference specific questions and applies instructor-provided hints

---

## 🧱 Tech Stack

- **Next.js** (App Router) + TypeScript
- **TailwindCSS**
- **Supabase** (Postgres + Auth + Storage)
- **OpenAI API** (GPT-4o-mini for chat, text-embedding-3-small for RAG)

---

## 🚀 Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in Supabase + OpenAI keys
3. Run migrations: `supabase db push`
4. Install dependencies: `npm install`
5. Start dev server: `npm run dev`

---

## 📁 Project Structure

```
src/
  app/
    admin/          # Instructor dashboard + course config
    student/        # Student dashboard + chat
    api/            # API routes (chat, assignments, bot-config, etc.)
  components/
    admin/          # AssignmentEditor, MaterialsPanel, PdfAnnotator, etc.
    assignments/    # AssignmentSelect
    chat/           # ChatWindow, ChatMessage, ChatComposer
    courses/        # CourseCard
    layout/         # AppShell (nav)
    pdf/            # ExportButton
  lib/
    prompt.ts       # System prompt builders (full-text + RAG)
    policy.ts       # Guardrail logic, topic gating
    embeddings.ts   # Vector embedding generation
    types.ts        # Shared TypeScript types
supabase/
  migrations/       # SQL migrations
```
