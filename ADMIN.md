# Content / admin plan

The public site is intentionally data-driven already. For the next phase, move `data/squad.ts` into Supabase and add a protected `/admin` area.

Recommended admin operations:

- Edit squad name, tagline and social links.
- CRUD for the 25 member records.
- Upload/replace profile photos through Supabase Storage.
- CRUD for montage records and YouTube/Cloudinary URLs.
- CRUD for achievements and gallery items.
- Publish/unpublish members or montage clips.

The public component API should stay unchanged so the visual layer does not need a rewrite.
