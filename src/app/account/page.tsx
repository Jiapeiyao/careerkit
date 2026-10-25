import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { AuthSubmit } from "@/components/auth-submit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthState } from "@/lib/supabase/server";

export default function AccountPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense fallback={<p role="status">Loading account...</p>}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const { user, error } = await getAuthState();
  if (error) throw new Error(error);
  if (!user) redirect("/login");

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle><h1>Your account</h1></CardTitle>
        <CardDescription>{user.email ?? "No email address is available."}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={signOut}><AuthSubmit>Sign out</AuthSubmit></form>
      </CardContent>
    </Card>
  );
}
