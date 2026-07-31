import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertUserFromAuth } from "@/services/authService";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", url.origin)
    );
  }

  await upsertUserFromAuth(data.user);

  return NextResponse.redirect(new URL(next, url.origin));
}
