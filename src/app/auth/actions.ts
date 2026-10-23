"use server";

import { redirect } from "next/navigation";
import { getAuthConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function signIn(provider: "google" | "github") {
  const config = getAuthConfig();
  if (!config) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${config.siteUrl}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("Supabase sign-in failed", {
      provider,
      code: error?.code,
      status: error?.status,
    });
    redirect("/login?error=signin");
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await signIn("google");
}

export async function signInWithGitHub() {
  await signIn("github");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    console.error("Supabase sign-out failed", {
      code: error.code,
      status: error.status,
    });
    redirect("/account?error=signout");
  }

  redirect("/login");
}
