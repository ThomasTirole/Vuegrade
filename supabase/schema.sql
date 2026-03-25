-- ============================================================
-- VueGrade M294 — Schéma Supabase (Multi-Tenancy)
-- Exécuter dans l'éditeur SQL de Supabase Dashboard
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- USERS (profs + experts unifiés)
-- ------------------------------------------------------------
create table users (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  email                   text unique not null,
  password_hash           text,
  role                    text not null check (role in ('teacher', 'expert')),
  github_token_encrypted  text,               -- token GitHub chiffré (pour profs)
  legacy_expert_id        uuid,               -- migration: ancien expert_id
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create index idx_users_email on users(email);

-- ------------------------------------------------------------
-- CLASSES (avec settings intégrés)
-- ------------------------------------------------------------
create table classes (
  id                uuid primary key default uuid_generate_v4(),
  teacher_id        uuid references users(id) on delete cascade,
  name              text not null,
  year              integer not null default extract(year from now()),
  github_org        text,
  project_template  text,
  pause_interval    integer default 4,
  pause_duration    integer default 15,
  pause_positions   jsonb default '[]',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_classes_teacher on classes(teacher_id);

-- ------------------------------------------------------------
-- CLASS_EXPERTS (liaison many-to-many)
-- ------------------------------------------------------------
create table class_experts (
  class_id    uuid references classes(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (class_id, user_id)
);

create index idx_class_experts_user on class_experts(user_id);

-- ------------------------------------------------------------
-- EXPERTS (legacy - sera supprimée après migration complète)
-- ------------------------------------------------------------
create table experts (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  initials    text not null,
  role        text not null default 'expert' check (role in ('teacher', 'expert')),
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- STUDENTS (élèves + infos projet)
-- ------------------------------------------------------------
create table students (
  id                  uuid primary key default uuid_generate_v4(),
  class_id            uuid references classes(id) on delete cascade,
  name                text not null,
  github_username     text not null,
  repo_url            text not null,
  deploy_url          text,
  project_description text,
  api_name            text,
  api_url             text,
  teacher_api_key     text,
  passage_order       int,
  passage_time        text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_students_class on students(class_id);

-- ------------------------------------------------------------
-- QUESTIONS (pool théorique + questions pratiques par élève)
-- ------------------------------------------------------------
create table questions (
  id              uuid primary key default uuid_generate_v4(),
  class_id        uuid references classes(id) on delete cascade,
  type            text not null check (type in ('theoretical', 'practical')),
  ref             text,
  title           text not null,
  question        text not null,
  expected_answer text,
  hint            text,
  code_snippet    text,
  code_language   text default 'vue',
  student_id      uuid references students(id) on delete cascade,
  tags            text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_questions_student on questions(student_id);
create index idx_questions_type on questions(type);
create index idx_questions_class on questions(class_id);

-- ------------------------------------------------------------
-- STUDENT_QUESTIONS (liaison élève <-> questions théoriques)
-- ------------------------------------------------------------
create table student_questions (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position    integer not null default 1,
  created_at  timestamptz default now(),
  unique(student_id, question_id)
);

-- ------------------------------------------------------------
-- ORAL SESSIONS (session d'oral par élève)
-- ------------------------------------------------------------
create table oral_sessions (
  id            uuid primary key default uuid_generate_v4(),
  class_id      uuid references classes(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  question_ids  uuid[] not null default '{}',
  status        text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  notes         text,
  total_score   numeric(3,1),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_oral_sessions_class on oral_sessions(class_id);

-- ------------------------------------------------------------
-- ORAL GRADES (note par question par expert)
-- ------------------------------------------------------------
create table oral_grades (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references oral_sessions(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  question_id   uuid not null references questions(id) on delete cascade,
  expert_id     uuid not null references experts(id) on delete cascade,
  score         int check (score between 1 and 6),
  comment       text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(session_id, question_id, expert_id)
);

create index idx_grades_session on oral_grades(session_id);
create index idx_grades_student on oral_grades(student_id);

-- ------------------------------------------------------------
-- SETTINGS (legacy - sera supprimée, settings dans classes)
-- ------------------------------------------------------------
create table settings (
  key         text primary key,
  value       text not null,
  description text,
  updated_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- TRIGGERS — updated_at automatique
-- ------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute procedure update_updated_at();

create trigger classes_updated_at before update on classes
  for each row execute procedure update_updated_at();

create trigger students_updated_at before update on students
  for each row execute procedure update_updated_at();

create trigger questions_updated_at before update on questions
  for each row execute procedure update_updated_at();

create trigger oral_sessions_updated_at before update on oral_sessions
  for each row execute procedure update_updated_at();

create trigger oral_grades_updated_at before update on oral_grades
  for each row execute procedure update_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table users enable row level security;
alter table classes enable row level security;
alter table class_experts enable row level security;
alter table experts enable row level security;
alter table students enable row level security;
alter table questions enable row level security;
alter table student_questions enable row level security;
alter table oral_sessions enable row level security;
alter table oral_grades enable row level security;
alter table settings enable row level security;

-- Politiques permissives (outil interne - à restreindre avec auth)
create policy "allow_all" on users using (true) with check (true);
create policy "allow_all" on classes using (true) with check (true);
create policy "allow_all" on class_experts using (true) with check (true);
create policy "allow_all" on experts using (true) with check (true);
create policy "allow_all" on students using (true) with check (true);
create policy "allow_all" on questions using (true) with check (true);
create policy "allow_all" on student_questions using (true) with check (true);
create policy "allow_all" on oral_sessions using (true) with check (true);
create policy "allow_all" on oral_grades using (true) with check (true);
create policy "allow_all" on settings using (true) with check (true);

-- ------------------------------------------------------------
-- VUE — Récapitulatif notes par élève
-- ------------------------------------------------------------
create or replace view student_score_summary as
select
  s.id as student_id,
  s.name as student_name,
  s.class_id,
  os.id as session_id,
  os.status,
  count(distinct og.question_id) as questions_graded,
  round(avg(og.score), 1) as average_score,
  os.total_score
from students s
left join oral_sessions os on os.student_id = s.id
left join oral_grades og on og.session_id = os.id
group by s.id, s.name, s.class_id, os.id, os.status, os.total_score
order by s.name;
