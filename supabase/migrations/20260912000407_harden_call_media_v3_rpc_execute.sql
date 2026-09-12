-- 4b4c Call Engine V3 — restrict SECURITY DEFINER RPC execution to authenticated users only.
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default unless explicitly revoked.
-- V3 RPCs retain their internal auth.uid() and call-access checks; this migration also removes
-- the unnecessary anonymous API surface at the privilege layer.

revoke all on function public.register_call_provider_session_v3(uuid,text) from public, anon, authenticated;
revoke all on function public.upsert_call_media_track_v3(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.end_call_media_track_v3(uuid,text) from public, anon, authenticated;
revoke all on function public.end_all_call_media_tracks_v3(uuid) from public, anon, authenticated;
revoke all on function public.get_call_media_catalog_v3(uuid) from public, anon, authenticated;
revoke all on function public.record_call_media_telemetry_v3(uuid,text,text,jsonb) from public, anon, authenticated;

grant execute on function public.register_call_provider_session_v3(uuid,text) to authenticated;
grant execute on function public.upsert_call_media_track_v3(uuid,text,text,text,text) to authenticated;
grant execute on function public.end_call_media_track_v3(uuid,text) to authenticated;
grant execute on function public.end_all_call_media_tracks_v3(uuid) to authenticated;
grant execute on function public.get_call_media_catalog_v3(uuid) to authenticated;
grant execute on function public.record_call_media_telemetry_v3(uuid,text,text,jsonb) to authenticated;
