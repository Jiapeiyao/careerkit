import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, getAuthCookieOptions } from "@/lib/supabase/config";
import { isInvalidSession } from "@/lib/supabase/server";

/**
 * Next.js 16 runs this entry point before routes selected by the matcher.
 * Verify and refresh sessions before login and protected account pages.
 * Public pages load account details separately, without waiting for Supabase.
 * Route handlers and Server Actions must still enforce their own access checks.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getAuthConfig();
  const pathname = request.nextUrl.pathname;
  const accountPage = pathname === "/account" || pathname.startsWith("/account/");

  if (config && (pathname === "/login" || accountPage)) {
    const client = createServerClient(config.url, config.key, {
      cookieOptions: getAuthCookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          // Pass refreshed tokens to this render and back to the browser.
          // Rebuilding the response must preserve cookies from earlier writes.
          for (const { name, value } of values) request.cookies.set(name, value);
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          for (const cookie of previous) response.cookies.set(cookie);
          for (const { name, value, options } of values) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        },
      },
    });
    // Verify with Supabase rather than trusting the user data stored in cookies.
    const { data, error } = await client.auth.getUser();
    if (error && !isInvalidSession(error)) {
      console.error("Session verification failed:", error.code ?? error.name);
    }
    // A missing session is normal during OAuth; signing out would delete its PKCE verifier.
    if (error && isInvalidSession(error) && !isAuthSessionMissingError(error)) {
      const { error: signOutError } = await client.auth.signOut({ scope: "local" });
      if (signOutError) console.error("Invalid session cleanup failed:", signOutError.code);
    }

    // Redirect known auth states, but leave service failures for the page to report.
    let destination: string | null = null;
    if (pathname === "/login" && data.user) destination = "/account";
    if (accountPage && !data.user && (!error || isInvalidSession(error))) {
      destination = "/login";
    }
    if (destination) {
      const redirect = NextResponse.redirect(new URL(destination, request.url));
      // Redirects must also deliver refreshed or cleared cookies to the browser.
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      response = redirect;
    }
  } else if (!config && accountPage) {
    response = NextResponse.redirect(new URL("/login", request.url));
  }

  // Never cache auth redirects or responses that can update session cookies.
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  // Cover pages with the shared header, but skip APIs and static assets.
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
