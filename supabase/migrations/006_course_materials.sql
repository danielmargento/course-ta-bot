-- Course materials (uploaded files with extracted text for AI context)
create table course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  category text not null default 'other',
  storage_path text not null,
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

-- Add material_ids array to assignments
alter table assignments add column material_ids uuid[] not null default '{}';

-- Storage bucket for course materials (run via supabase dashboard or CLI)
insert into storage.buckets (id, name, public) values ('course-materials', 'course-materials', false);
