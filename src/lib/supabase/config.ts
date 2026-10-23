export function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const siteUrl = process.env.SITE_URL;

  if (!url || !key || !siteUrl) {
    return null;
  }

  for (const value of [url, siteUrl]) {
    const parsed = new URL(value);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error("Supabase URL and SITE_URL must be HTTP(S) origins.");
    }
    if (
      parsed.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
    ) {
      throw new Error("Authentication requires HTTPS outside local development.");
    }
  }

  return {
    url,
    key,
    siteUrl: new URL(siteUrl).origin,
    cookieOptions: {
      httpOnly: true,
      secure: siteUrl.startsWith("https://"),
      sameSite: "lax" as const,
    },
  };
}
