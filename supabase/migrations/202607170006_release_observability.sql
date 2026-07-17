begin;

create type public.release_status as enum ('candidate','approved','published','retired','rolled_back');
create type public.deployment_environment as enum ('development','staging','production');
create type public.deployment_status as enum ('pending','deploying','healthy','failed','rolled_back');

create table public.agent_releases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_version_id uuid not null references public.agent_versions(id) on delete restrict,
  status public.release_status not null default 'candidate',
  release_notes text not null default '',
  gate_result jsonb not null,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(agent_version_id)
);

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  release_id uuid not null references public.agent_releases(id) on delete restrict,
  environment public.deployment_environment not null,
  status public.deployment_status not null default 'pending',
  rollout_percent integer not null default 0 check (rollout_percent between 0 and 100),
  rollback_release_id uuid references public.agent_releases(id),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(release_id, environment)
);

create table public.execution_metrics (
  execution_id uuid primary key references public.executions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_version_id uuid not null references public.agent_versions(id) on delete restrict,
  outcome text not null check (outcome in ('completed','failed','cancelled')),
  duration_ms bigint not null check (duration_ms >= 0),
  cost_usd numeric(12,6) not null check (cost_usd >= 0),
  prompt_tokens integer not null check (prompt_tokens >= 0),
  completion_tokens integer not null check (completion_tokens >= 0),
  recorded_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','mitigated','resolved')),
  title text not null,
  description text not null,
  execution_id uuid references public.executions(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index releases_workspace_status_idx on public.agent_releases(workspace_id,status,created_at desc);
create index deployments_workspace_environment_idx on public.deployments(workspace_id,environment,status);
create index metrics_workspace_recorded_idx on public.execution_metrics(workspace_id,recorded_at desc);
create index incidents_workspace_status_idx on public.incidents(workspace_id,status,severity);

alter table public.agent_releases enable row level security;
alter table public.deployments enable row level security;
alter table public.execution_metrics enable row level security;
alter table public.incidents enable row level security;

create policy releases_read on public.agent_releases for select using (public.is_workspace_member(workspace_id));
create policy releases_write on public.agent_releases for all using (public.has_workspace_role(workspace_id,array['owner','reviewer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id,array['owner','reviewer']::public.workspace_role[]));
create policy deployments_read on public.deployments for select using (public.is_workspace_member(workspace_id));
create policy deployments_write on public.deployments for all using (public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]));
create policy metrics_read on public.execution_metrics for select using (public.is_workspace_member(workspace_id));
create policy incidents_read on public.incidents for select using (public.is_workspace_member(workspace_id));
create policy incidents_write on public.incidents for all using (public.has_workspace_role(workspace_id,array['owner','reviewer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id,array['owner','reviewer']::public.workspace_role[]));

commit;
