"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/config";

async function signIn(provider: "google" | "github") {
  const client = await createClient(true);
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getSiteUrl()}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) {
    console.error("Sign-in failed:", error?.code ?? "missing_provider_url");
    redirect("/login?error=signin");
  }
  redirect(data.url);
}

export async function signInWithGoogle() {
  return signIn("google");
}

export async function signInWithGitHub() {
  return signIn("github");
}

export async function signOut() {
  const client = await createClient(true);
  const { error } = await client.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  if (error) {
    console.error("Sign-out failed:", error.code ?? error.name);
    redirect("/login?error=signout");
  }
  redirect("/login");
}
