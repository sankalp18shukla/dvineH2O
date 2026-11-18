import { MEDIA_BUCKET } from '@/lib/media';
import { publicFileUrl, supabaseUrl } from '@/lib/supabase/config';

/** Older promotion links (/media/<file>) now point at the same file in Supabase Storage's CDN. */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!supabaseUrl() || !/^[a-z0-9-]{1,60}\.(png|jpg|webp|gif|avif|webm|mov|mp4)$/.test(name)) return new Response('Not found', { status: 404 });
  return Response.redirect(publicFileUrl(MEDIA_BUCKET, name), 308);
}
