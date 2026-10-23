import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthConfig } from "./config";

export async function createClient(
  cookieAccess: "read-only" | "read-write" = "read-write",
) {
  const config = getAuthConfig();
  if (!config) {
    throw new Error("Supabase authentication is not configured. See README.md.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookieOptions: config.cookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Proxy refreshes cookies before read-only Server Components render.
        if (cookieAccess === "read-write") {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      },
    },
  });
}
