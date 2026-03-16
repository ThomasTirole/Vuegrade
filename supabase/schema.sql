-- ============================================================
-- VuGrade M294 — Schéma Supabase
-- Exécuter dans l'éditeur SQL de Supabase Dashboard
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- EXPERTS (enseignant + experts invités)
-- ------------------------------------------------------------
create table experts (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  initials    text not null,           -- ex: KGE, FHE, TTI
  role        text not null default 'expert' check (role in ('teacher', 'expert')),
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- STUDENTS (élèves + infos projet)
-- ------------------------------------------------------------
create table students (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  github_username     text not null,
  repo_url            text not null,
  deploy_url          text,
  project_description text,
  api_name            text,
  api_url             text,
  teacher_api_key     text,            -- clé API enseignant pour tester le projet
  passage_order       int,             -- ordre de passage à l'oral
  passage_time        text,            -- ex: "08:20"
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ------------------------------------------------------------
-- QUESTIONS (pool théorique + questions pratiques par élève)
-- ------------------------------------------------------------
create table questions (
  id              uuid primary key default uuid_generate_v4(),
  type            text not null check (type in ('theoretical', 'practical')),
  ref             text not null,       -- ex: T-1, P-4
  title           text not null,
  question        text not null,
  expected_answer text,
  hint            text,
  code_snippet    text,
  code_language   text default 'vue',
  student_id      uuid references students(id) on delete cascade,  -- null = pool commun
  tags            text[],
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Index pour récupérer vite les questions d'un élève
create index idx_questions_student on questions(student_id);
create index idx_questions_type on questions(type);

-- ------------------------------------------------------------
-- ORAL SESSIONS (session d'oral par élève)
-- ------------------------------------------------------------
create table oral_sessions (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  question_ids  uuid[] not null default '{}',   -- questions sélectionnées
  status        text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  notes         text,
  total_score   numeric(3,1),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

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
  -- Un expert ne note qu'une fois par question par session
  unique(session_id, question_id, expert_id)
);

create index idx_grades_session on oral_grades(session_id);
create index idx_grades_student on oral_grades(student_id);

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

create trigger students_updated_at before update on students
  for each row execute procedure update_updated_at();

create trigger questions_updated_at before update on questions
  for each row execute procedure update_updated_at();

create trigger oral_sessions_updated_at before update on oral_sessions
  for each row execute procedure update_updated_at();

create trigger oral_grades_updated_at before update on oral_grades
  for each row execute procedure update_updated_at();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (à activer en prod)
-- Pour l'instant : accès libre avec anon key (outil interne)
-- ------------------------------------------------------------
alter table experts enable row level security;
alter table students enable row level security;
alter table questions enable row level security;
alter table oral_sessions enable row level security;
alter table oral_grades enable row level security;

-- Politique permissive pour usage interne (à restreindre si besoin)
create policy "allow_all_experts"        on experts        using (true) with check (true);
create policy "allow_all_students"       on students       using (true) with check (true);
create policy "allow_all_questions"      on questions      using (true) with check (true);
create policy "allow_all_oral_sessions"  on oral_sessions  using (true) with check (true);
create policy "allow_all_oral_grades"    on oral_grades    using (true) with check (true);

-- ------------------------------------------------------------
-- SEED — Experts M294
-- À adapter avec vos vrais noms/initiales
-- ------------------------------------------------------------
insert into experts (name, initials, role) values
  ('Enseignant principal', 'TTI', 'teacher'),
  ('Expert 1',             'FHE', 'expert'),
  ('Expert 2',             'KGE', 'expert');

-- ------------------------------------------------------------
-- VUE — Récapitulatif notes par élève
-- ------------------------------------------------------------
create or replace view student_score_summary as
select
  s.id as student_id,
  s.name as student_name,
  os.id as session_id,
  os.status,
  count(distinct og.question_id) as questions_graded,
  round(avg(og.score), 1) as average_score,
  os.total_score
from students s
left join oral_sessions os on os.student_id = s.id
left join oral_grades og on og.session_id = os.id
group by s.id, s.name, os.id, os.status, os.total_score
order by s.name;
