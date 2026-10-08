-- AI traffic log for thefreeiching.com. Written by the Vercel middleware for
-- known bots and non-browser tools only, never for people's browsers.
-- Reads: admins (JWT app_metadata.role = 'admin') and the service role.

create table if not exists public.agent_hits (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  agent text not null,
  kind text not null check (kind in ('training', 'search', 'assistant', 'seo', 'tool')),
  path text not null,
  user_agent text not null default ''
);

create index if not exists agent_hits_ts_idx on public.agent_hits (ts desc);
create index if not exists agent_hits_agent_idx on public.agent_hits (agent, ts desc);

alter table public.agent_hits enable row level security;
revoke all on public.agent_hits from anon, authenticated;
grant select on public.agent_hits to authenticated;

drop policy if exists agent_hits_admin_read on public.agent_hits;
create policy agent_hits_admin_read on public.agent_hits
  for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Insert one hit. Trims every input so a hostile user agent cannot bloat the table.
create or replace function public.log_agent_hit(p_agent text, p_kind text, p_path text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if p_kind not in ('training', 'search', 'assistant', 'seo', 'tool') then
    return;
  end if;
  insert into public.agent_hits (agent, kind, path, user_agent)
  values (
    left(coalesce(nullif(btrim(p_agent), ''), 'unknown'), 80),
    p_kind,
    left(split_part(coalesce(p_path, '/'), '?', 1), 300),
    left(coalesce(p_user_agent, ''), 300)
  );
end;
$$;

-- Weekly summary for the last p_days days plus the previous period.
create or replace function public.agent_hits_summary(p_days int default 7)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  d int := greatest(1, least(coalesce(p_days, 7), 90));
  cur_from timestamptz := now() - make_interval(days => d);
  prev_from timestamptz := now() - make_interval(days => 2 * d);
  agent_file text := '^/(llms\.txt|llms/|data/|mcp$|\.well-known/|sitemap\.xml|robots\.txt)|\.md$';
  result jsonb;
begin
  -- current_user is always the function owner here, so check the caller via
  -- the JWT role and the connection's session_user.
  if coalesce(auth.role(), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'period', jsonb_build_object('days', d, 'from', cur_from, 'to', now()),
    'total_hits', (select count(*) from agent_hits where ts >= cur_from),
    'by_agent_and_kind', coalesce((
      select jsonb_agg(jsonb_build_object('agent', agent, 'kind', kind, 'hits', n) order by n desc)
      from (select agent, kind, count(*) n from agent_hits where ts >= cur_from group by 1, 2) s), '[]'::jsonb),
    'by_kind', coalesce((
      select jsonb_object_agg(kind, n)
      from (select kind, count(*) n from agent_hits where ts >= cur_from group by 1) s), '{}'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'hits', n) order by n desc)
      from (select path, count(*) n from agent_hits where ts >= cur_from group by 1 order by 2 desc limit 25) s), '[]'::jsonb),
    'agent_file_hits', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'agent', agent, 'hits', n) order by n desc)
      from (select path, agent, count(*) n from agent_hits where ts >= cur_from and path ~ agent_file group by 1, 2 order by 3 desc limit 40) s), '[]'::jsonb),
    'mcp_hits', coalesce((
      select jsonb_agg(jsonb_build_object('agent', agent, 'hits', n) order by n desc)
      from (select agent, count(*) n from agent_hits where ts >= cur_from and path = '/mcp' group by 1) s), '[]'::jsonb),
    'unknown_user_agents', coalesce((
      select jsonb_agg(jsonb_build_object('user_agent', user_agent, 'hits', n) order by n desc)
      from (select user_agent, count(*) n from agent_hits where ts >= cur_from and agent like 'unknown:%' group by 1 order by 2 desc limit 25) s), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'hits', n) order by day)
      from (select (ts at time zone 'utc')::date as day, count(*) as n from agent_hits where ts >= cur_from group by 1) s), '[]'::jsonb),
    'previous_period', jsonb_build_object(
      'from', prev_from,
      'to', cur_from,
      'total_hits', (select count(*) from agent_hits where ts >= prev_from and ts < cur_from),
      'by_kind', coalesce((
        select jsonb_object_agg(kind, n)
        from (select kind, count(*) n from agent_hits where ts >= prev_from and ts < cur_from group by 1) s), '{}'::jsonb))
  ) into result;
  return result;
end;
$$;

-- Delete rows older than p_days days (default 180). Returns rows deleted.
create or replace function public.prune_agent_hits(p_days int default 180)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed bigint;
begin
  if coalesce(auth.role(), '') <> 'service_role' and session_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  delete from agent_hits where ts < now() - make_interval(days => greatest(coalesce(p_days, 180), 30));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.log_agent_hit(text, text, text, text) from public, anon, authenticated;
revoke all on function public.agent_hits_summary(int) from public, anon, authenticated;
revoke all on function public.prune_agent_hits(int) from public, anon, authenticated;
grant execute on function public.log_agent_hit(text, text, text, text) to service_role;
grant execute on function public.agent_hits_summary(int) to service_role;
grant execute on function public.prune_agent_hits(int) to service_role;
