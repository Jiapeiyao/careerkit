import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, getAuthCookieOptions } from "@/lib/supabase/config";
import { isInvalidSession } from "@/lib/supabase/server";

/**
 * Next.js 16 runs this entry point before routes selected by the matcher.
 * Refresh auth cookies here because Server Components cannot write them.
 * Route handlers and Server Actions must still enforce their own access checks.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getAuthConfig();
  const pathname = request.nextUrl.pathname;

  // The callback exchanges its authorization code and writes its own session cookies.
  if (config && pathname !== "/auth/callback") {
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
    if (error && isInvalidSession(error)) {
      const { error: signOutError } = await client.auth.signOut({ scope: "local" });
      if (signOutError) console.error("Invalid session cleanup failed:", signOutError.code);
    }

    // Redirect known auth states, but leave service failures for the page to report.
    let destination: string | null = null;
    if (pathname === "/login" && data.user) destination = "/account";
    if ((pathname === "/account" || pathname.startsWith("/account/")) && !data.user && (!error || isInvalidSession(error))) {
      destination = "/login";
    }
    if (destination) {
      const redirect = NextResponse.redirect(new URL(destination, request.url));
      // Redirects must also deliver refreshed or cleared cookies to the browser.
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      response = redirect;
    }
  } else if (!config && (pathname === "/account" || pathname.startsWith("/account/"))) {
    response = NextResponse.redirect(new URL("/login", request.url));
  }

  // All matched pages show account-specific UI; shared caches must not store it.
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  // Cover pages with the shared header, but skip APIs and static assets.
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
