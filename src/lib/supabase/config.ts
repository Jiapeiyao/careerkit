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

export function getSiteUrl(requestHeaders: Pick<Headers, "get">) {
  let value = process.env.SITE_URL;
  if (!value) {
    const host = requestHeaders.get("host");
    if (!host) throw new Error("Missing Host header for authentication.");
    if (!/^[a-z0-9.:[\]-]+$/i.test(host)) {
      throw new Error("Invalid Host header for authentication.");
    }
    const url = new URL(`https://${host}`);
    if (url.host !== host.toLowerCase() || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Invalid Host header for authentication.");
    }
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (process.env.VERCEL === "1") {
      value = url.origin;
    } else if (local) {
      value = `http://${host}`;
    } else {
      throw new Error("Set SITE_URL for authentication outside Vercel or localhost.");
    }
  }

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

export function getAuthCookieOptions(requestHeaders: Pick<Headers, "get">) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: new URL(getSiteUrl(requestHeaders)).protocol === "https:",
    path: "/",
  };
}
