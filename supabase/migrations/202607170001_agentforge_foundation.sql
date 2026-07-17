begin;

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'builder', 'reviewer', 'viewer');
create type public.agent_status as enum ('draft', 'testing', 'approved', 'published', 'retired');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  status public.agent_status not null default 'draft',
  current_version_id uuid,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table public.agent_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  specification jsonb not null,
  compiled_configuration jsonb not null,
  specification_hash text not null,
  status public.agent_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (agent_id, version_number),
  unique (agent_id, specification_hash)
);

alter table public.agents
  add constraint agents_current_version_fk
  foreign key (current_version_id) references public.agent_versions(id);

create index workspace_memberships_user_idx on public.workspace_memberships(user_id);
create index agents_workspace_status_idx on public.agents(workspace_id, status);
create index agent_versions_agent_created_idx on public.agent_versions(agent_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = target_workspace
      and m.user_id = auth.uid()
      and m.role = any(allowed_roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.agents enable row level security;
alter table public.agent_versions enable row level security;

create policy organizations_select_member on public.organizations
for select using (
  exists (
    select 1 from public.workspaces w
    where w.organization_id = organizations.id
      and public.is_workspace_member(w.id)
  )
);

create policy workspaces_select_member on public.workspaces
for select using (public.is_workspace_member(id));

create policy memberships_select_member on public.workspace_memberships
for select using (public.is_workspace_member(workspace_id));

create policy agents_select_member on public.agents
for select using (public.is_workspace_member(workspace_id));

create policy agents_insert_builder on public.agents
for insert with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner','builder']::public.workspace_role[])
);

create policy agents_update_builder on public.agents
for update using (
  public.has_workspace_role(workspace_id, array['owner','builder']::public.workspace_role[])
) with check (
  public.has_workspace_role(workspace_id, array['owner','builder']::public.workspace_role[])
);

create policy versions_select_member on public.agent_versions
for select using (public.is_workspace_member(workspace_id));

create policy versions_insert_builder on public.agent_versions
for insert with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner','builder']::public.workspace_role[])
  and exists (
    select 1 from public.agents a
    where a.id = agent_id and a.workspace_id = workspace_id
  )
);

create or replace function public.prevent_published_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' then
    raise exception 'Published agent versions are immutable';
  end if;
  return new;
end;
$$;

create trigger prevent_published_version_update
before update or delete on public.agent_versions
for each row execute function public.prevent_published_version_mutation();

revoke all on function public.is_workspace_member(uuid) from public;
revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;

commit;
