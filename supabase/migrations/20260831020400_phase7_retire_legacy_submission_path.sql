-- Phase 7 replaces the older contact-based recruitment contract. Leaving the old
-- RPC executable would create a bypass around job/email/resume requirements.
drop trigger if exists enforce_recruitment_submission_limits on public.recruitment_applications;
revoke execute on function public.submit_recruitment_application(jsonb,text) from public, anon, authenticated;
