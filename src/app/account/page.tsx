import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/auth/actions";
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

export default function Account(props: PageProps<"/account">) {
  return (
    <Suspense fallback={<main className="p-6" role="status">Loading your account...</main>}>
      <AccountContent {...props} />
    </Suspense>
  );
}

async function AccountContent({ searchParams }: PageProps<"/account">) {
  await connection();
  if (!getAuthConfig()) {
    redirect("/login");
  }

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle><h1 className="text-2xl font-semibold">Your account</h1></CardTitle>
          <CardDescription>Signed in as {user.email ?? user.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account is ready. Career materials, Agent workflows, and resume
            exports are not available yet.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              Sign-out failed. Please try again.
            </p>
          )}
          <form action={signOut}>
            <AuthSubmit>Sign out</AuthSubmit>
          </form>
          <Link href="/" className="inline-block text-sm underline underline-offset-4">
            Back to CareerKit
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
