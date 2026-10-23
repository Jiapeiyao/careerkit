import { createServerClient } from "@supabase/ssr";
import { AuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const authConfig = getAuthConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");

  if (!authConfig) {
    if (request.nextUrl.pathname.startsWith("/account")) {
      const destination = request.nextUrl.clone();
      destination.pathname = "/login";
      destination.search = "";
      const redirect = NextResponse.redirect(destination);
      redirect.headers.set("Cache-Control", "private, no-store");
      return redirect;
    }
    return response;
  }

  const supabase = createServerClient(authConfig.url, authConfig.key, {
    cookieOptions: authConfig.cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const invalidSession = error && (
    error.status === 401 ||
    error.status === 403 ||
    error.code === "refresh_token_not_found" ||
    error.code === "refresh_token_already_used"
  );
  if (invalidSession) {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.error("Supabase invalid session cleanup failed", {
        code: signOutError.code,
        status: signOutError.status,
      });
      throw new Error("Unable to clear an invalid session. Please try again.");
    }
  }
  if (error && !invalidSession && !(error instanceof AuthSessionMissingError)) {
    console.error("Supabase session refresh failed", {
      code: error.code,
      status: error.status,
    });
    const failure = new NextResponse(
      "Unable to verify your account. Please try again.",
      { status: 503 },
    );
    failure.headers.set("Cache-Control", "private, no-store");
    response.cookies.getAll().forEach((cookie) => failure.cookies.set(cookie));
    return failure;
  }

  const destination = request.nextUrl.clone();
  if (!data.user && request.nextUrl.pathname.startsWith("/account")) {
    destination.pathname = "/login";
  } else if (data.user && request.nextUrl.pathname === "/login") {
    destination.pathname = "/account";
  } else {
    return response;
  }

  destination.search = "";
  const redirect = NextResponse.redirect(destination);
  response.headers.forEach((value, name) => {
    if (["cache-control", "expires", "pragma"].includes(name)) {
      redirect.headers.set(name, value);
    }
  });
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/login", "/account/:path*"],
};
