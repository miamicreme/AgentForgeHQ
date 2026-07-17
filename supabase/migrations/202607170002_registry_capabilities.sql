create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version text not null,
  name text not null,
  description text not null,
  manifest jsonb not null,
  status text not null default 'draft' check (status in ('draft','approved','published','retired')),
  created_at timestamptz not null default now(),
  unique (slug, version)
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version text not null,
  name text not null,
  description text not null,
  manifest jsonb not null,
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  status text not null default 'draft' check (status in ('draft','approved','published','retired')),
  created_at timestamptz not null default now(),
  unique (slug, version)
);

create table if not exists public.agent_version_skills (
  agent_version_id uuid not null references public.agent_versions(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  primary key (agent_version_id, skill_id)
);

create table if not exists public.agent_version_tools (
  agent_version_id uuid not null references public.agent_versions(id) on delete cascade,
  tool_id uuid not null references public.tools(id),
  primary key (agent_version_id, tool_id)
);

alter table public.skills enable row level security;
alter table public.tools enable row level security;
alter table public.agent_version_skills enable row level security;
alter table public.agent_version_tools enable row level security;

create policy "published skills readable" on public.skills for select using (status = 'published');
create policy "published tools readable" on public.tools for select using (status = 'published');
