-- Override inherited default privileges: entries use a recoverable archive.
revoke all on public.life_entries from authenticated;
grant select, insert, update on public.life_entries to authenticated;
