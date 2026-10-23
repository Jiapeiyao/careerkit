import { NextResponse } from "next/server";
import { getAuthConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const config = getAuthConfig();
  if (!config) {
    return new Response("Supabase authentication is not configured. See README.md.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let destination = "/login?error=callback";

  if (code && !url.searchParams.has("error")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      destination = "/account";
    } else {
      console.error("Supabase callback exchange failed", {
        code: error.code,
        status: error.status,
      });
    }
  }

  const response = NextResponse.redirect(new URL(destination, config.siteUrl), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
