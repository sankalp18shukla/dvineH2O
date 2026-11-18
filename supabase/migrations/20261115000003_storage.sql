-- ════════════════════════════════════════════════════════════════════════════
-- DVINE H2O · file storage (Supabase Storage)
--
--   media          public   promotion photos & videos uploaded in Admin › Homepage & promotions
--   review-photos  public   photos attached to verified-purchase reviews (random, unguessable names)
--   private        private  water reports, lab reports, enquiry site photos — served only through
--                           /api/admin/files after an ownership / staff check
--
-- No storage.objects policies are created for anon or authenticated: browsers can't list, write or
-- delete anything. Every write goes through the server, which checks the caller and the file's real
-- type (magic bytes) first. Admin media uploads go straight to Storage over a one-time signed URL that
-- the server issues to signed-in staff only, then the server verifies the bytes before accepting it.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 157286400,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']),
  ('review-photos', 'review-photos', true, 5242880,
    array['image/png', 'image/jpeg', 'image/webp']),
  ('private', 'private', false, 15728640,
    array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
