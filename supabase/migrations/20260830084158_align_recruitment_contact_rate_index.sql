-- Keep the contact cooldown lookup index aligned with the exact normalization
-- expression used by submit_recruitment_application().

drop index if exists public.recruitment_applications_contact_created_at_idx;
create index if not exists recruitment_applications_contact_norm_created_at_idx
  on public.recruitment_applications (
    lower(regexp_replace(btrim(contact), '[[:space:]]+', ' ', 'g')),
    created_at desc
  );
