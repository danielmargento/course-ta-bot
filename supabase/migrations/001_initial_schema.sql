-- Courses
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Bot configurations (one per course)
create table bot_configs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade unique,
  style_preset text not null default 'socratic',
  policy jsonb not null default '{}',
  context text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assignments
create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  staff_notes text not null default '',
  faq jsonb not null default '[]',
  overrides jsonb,
  created_at timestamptz not null default now()
);

-- Chat sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  student_id text not null,
  title text not null default 'New Session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  saved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Feedback
create table feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful', 'too_revealing')),
  created_at timestamptz not null default now()
);
