import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserFromAuth } from "@/services/authService";

// In production, redirect through APP_BASE_URL rather than the request's
// own origin — behind Vercel's proxy, request.url's origin isn't reliably
// the public-facing domain. Local dev keeps using the request origin so
// this works on whatever port `next dev` happens to be running on.
function resolveRedirectBase(requestOrigin: string) {
  if (process.env.NODE_ENV === "development") return requestOrigin;
  return process.env.APP_BASE_URL ?? requestOrigin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";
  const redirectBase = resolveRedirectBase(url.origin);

  if (!code) {
    return NextResponse.redirect(new URL("/login", redirectBase));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", redirectBase)
    );
  }

  await upsertUserFromAuth(data.user);

  return NextResponse.redirect(new URL(next, redirectBase));
}
