import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Discord OAuth callback (Section 4 of the master brief). Supabase redirects here after
 * the user approves Discord login; exchanges the auth code for a session, then sends the
 * user back to wherever they started (e.g. /tournaments/[slug]/register), falling back to
 * the dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  // Behind a reverse proxy (Caddy in front of the standalone Next.js server), `request.url`
  // can resolve to the container's own bind address (0.0.0.0:3000) instead of the public
  // domain. Prefer the explicit site URL when it's configured, and only fall back to the
  // request-derived origin for local dev where NEXT_PUBLIC_SITE_URL isn't set.
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? requestOrigin;
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect_to") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
