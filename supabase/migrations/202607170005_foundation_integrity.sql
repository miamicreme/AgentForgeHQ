begin;

create or replace function public.validate_agent_version_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.agents a
    where a.id = new.agent_id
      and a.workspace_id = new.workspace_id
  ) then
    raise exception 'Agent version workspace must match its agent workspace';
  end if;
  return new;
end;
$$;

create trigger validate_agent_version_workspace_before_write
before insert or update of workspace_id, agent_id
on public.agent_versions
for each row execute function public.validate_agent_version_workspace();

create or replace function public.validate_current_agent_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.current_version_id is not null and not exists (
    select 1
    from public.agent_versions v
    where v.id = new.current_version_id
      and v.agent_id = new.id
      and v.workspace_id = new.workspace_id
  ) then
    raise exception 'Current agent version must belong to the same agent and workspace';
  end if;
  return new;
end;
$$;

create trigger validate_current_agent_version_before_write
before insert or update of current_version_id, workspace_id
on public.agents
for each row execute function public.validate_current_agent_version();

create or replace function public.prevent_agent_version_identity_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.agent_id <> new.agent_id
     or old.workspace_id <> new.workspace_id
     or old.version_number <> new.version_number
     or old.specification_hash <> new.specification_hash then
    raise exception 'Agent version identity fields are immutable';
  end if;
  return new;
end;
$$;

create trigger prevent_agent_version_identity_update
before update on public.agent_versions
for each row execute function public.prevent_agent_version_identity_mutation();

create policy versions_update_builder on public.agent_versions
for update using (
  public.has_workspace_role(workspace_id, array['owner','builder','reviewer']::public.workspace_role[])
) with check (
  public.has_workspace_role(workspace_id, array['owner','builder','reviewer']::public.workspace_role[])
);

create policy agents_delete_owner on public.agents
for delete using (
  public.has_workspace_role(workspace_id, array['owner']::public.workspace_role[])
);

revoke all on function public.validate_agent_version_workspace() from public;
revoke all on function public.validate_current_agent_version() from public;
revoke all on function public.prevent_agent_version_identity_mutation() from public;

commit;
