export function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_AUTH_SUPABASE_PUBLISHABLE_KEY;
  const siteUrl = process.env.SITE_URL;

  if (!url || !key || !siteUrl) {
    return null;
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
