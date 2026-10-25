import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let destination = "/login?error=callback";
  if (code && !url.searchParams.has("error")) {
    const client = await createClient(true);
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Sign-in callback failed:", error.code ?? error.name);
    } else {
      destination = "/account";
    }
  }
  const response = NextResponse.redirect(new URL(destination, getSiteUrl()), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
