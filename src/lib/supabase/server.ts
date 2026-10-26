import "server-only";

import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { getAuthConfig, getAuthCookieOptions } from "./config";

export async function createClient(writable = false) {
  await connection();
  const config = getAuthConfig();
  if (!config) throw new Error("Supabase authentication is not configured.");

  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: getAuthCookieOptions(await headers()),
    cookies: {
      getAll: () => store.getAll(),
      ...(writable ? {
        setAll: (values: Parameters<SetAllCookies>[0]) => {
          for (const { name, value, options } of values) {
            store.set(name, value, options);
          }
        },
      } : {}),
    },
  });
}

export function isInvalidSession(error: { status?: number }) {
  return isAuthSessionMissingError(error) || [400, 401, 403].includes(error.status ?? 0);
}

export async function readAuthState(writable = false) {
  await cookies();
  if (!getAuthConfig()) return { user: null, error: null };

  const client = await createClient(writable);
  const { data, error } = await client.auth.getUser();
  if (error && !isInvalidSession(error)) {
    console.error("Account verification failed:", error.code ?? error.name);
    return { user: null, error: "Account details could not load. Please try again." };
  }
  if (writable && error && isInvalidSession(error) && !isAuthSessionMissingError(error)) {
    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) console.error("Invalid session cleanup failed:", signOutError.code);
  }
  return { user: data.user, error: null };
}

export const getAuthState = cache(() => readAuthState());
