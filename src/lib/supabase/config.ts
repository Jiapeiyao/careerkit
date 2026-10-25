import "server-only";

export function getAuthConfig() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key } =
    process.env;

  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error("Set both Supabase environment variables before using authentication.");
  }

  return { url, key };
}

export function getSiteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("Set SITE_URL before using authentication.");

  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash
  ) {
    throw new Error("SITE_URL must be an HTTPS origin, or an HTTP origin on localhost.");
  }
  return url.origin;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: new URL(getSiteUrl()).protocol === "https:",
    path: "/",
  };
}
