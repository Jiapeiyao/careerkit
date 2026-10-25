import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            <h1 className="text-4xl font-semibold tracking-tight">CareerKit</h1>
          </CardTitle>
          <CardDescription className="text-base">
            Turn your career materials into a resume for your target role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed text-muted-foreground">
            Sign in with Google or GitHub to create your account.
            Conversations, Agent workflows, and resume exports are not
            available yet.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
