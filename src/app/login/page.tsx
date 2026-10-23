import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signInWithGitHub, signInWithGoogle } from "@/app/auth/actions";
import { AuthSubmit } from "@/components/auth-submit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthConfig } from "@/lib/supabase/config";
import { getUser } from "@/lib/supabase/user";

export default function Login(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<main className="p-6" role="status">Loading sign-in...</main>}>
      <LoginContent {...props} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: PageProps<"/login">) {
  await connection();
  const config = getAuthConfig();
  if (config && (await getUser())) {
    redirect("/account");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle><h1 className="text-2xl font-semibold">Sign in to CareerKit</h1></CardTitle>
          <CardDescription>
            Use Google or GitHub to sign in or create an account. No password or
            confirmation email from CareerKit is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config ? (
            <p role="alert" className="text-sm text-destructive">
              Sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL,
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SITE_URL as described in
              the project README.
            </p>
          ) : (
            <>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  Sign-in did not complete. Please try again. If the problem
                  continues, contact the site owner.
                </p>
              )}
              <form action={signInWithGoogle}>
                <AuthSubmit>Continue with Google</AuthSubmit>
              </form>
              <form action={signInWithGitHub}>
                <AuthSubmit>Continue with GitHub</AuthSubmit>
              </form>
            </>
          )}
          <Link href="/" className="inline-block text-sm underline underline-offset-4">
            Back to CareerKit
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
