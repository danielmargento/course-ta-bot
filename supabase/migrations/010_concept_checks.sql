-- Concept check results table
create table concept_checks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete set null,
  course_id uuid not null references courses(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text not null default '',
  student_answer int,
  is_correct boolean,
  created_at timestamptz not null default now()
);

create index idx_concept_checks_course on concept_checks(course_id);
create index idx_concept_checks_assignment on concept_checks(assignment_id);

-- LLM-generated insights cache (one per course)
create table course_insights_cache (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade unique,
  insights jsonb not null default '{}',
  generated_at timestamptz not null default now()
);

-- Student preference for concept checks
alter table profiles add column concept_checks_enabled boolean not null default true;
