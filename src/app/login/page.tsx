import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signInWithGitHub, signInWithGoogle } from "@/app/auth/actions";
import { AuthSubmit } from "@/components/auth-submit";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthConfig } from "@/lib/supabase/config";
import { getAuthState } from "@/lib/supabase/server";

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle><h1>Sign in to CareerKit</h1></CardTitle>
          <CardDescription>
            Use Google or GitHub. Your first sign-in creates your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p role="status">Loading sign-in...</p>}>
            <LoginOptions searchParams={props.searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

async function LoginOptions({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { user, error } = await getAuthState();
  if (user) redirect("/account");
  const params = await searchParams;
  const configured = Boolean(getAuthConfig());
  const message = !configured
    ? "Sign-in is not configured. The site owner must set the Supabase environment variables and SITE_URL."
    : error ?? (params.error === "callback"
      ? "Sign-in did not complete. Please try again."
      : params.error === "signin" ? "Sign-in failed. Please try again."
      : params.error === "signout"
        ? "Sign-out failed. Local session data was cleared, but the server could not confirm sign-out. Sign in again to retry."
        : null);

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <Alert variant="destructive">
          <AlertTitle>{params.error === "signout" ? "Sign-out could not be confirmed" : "Sign-in unavailable"}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {configured && (
        <>
          <form action={signInWithGoogle}><AuthSubmit>Continue with Google</AuthSubmit></form>
          <form action={signInWithGitHub}><AuthSubmit>Continue with GitHub</AuthSubmit></form>
        </>
      )}
    </div>
  );
}
