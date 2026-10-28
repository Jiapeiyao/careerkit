import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAccount } from "@/lib/mock-account";

export default function AccountPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle><h1>Your account</h1></CardTitle>
          <CardDescription>{mockAccount.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>{mockAccount.name}</p>
          <p>This MVP uses a shared demo account. No real authentication is active.</p>
        </CardContent>
      </Card>
    </main>
  );
}
