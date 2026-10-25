import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";
import { Suspense } from "react";
import { HeaderAccount } from "@/components/header-account";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthState } from "@/lib/supabase/server";

export function SiteHeader() {
  return (
    <header className="shrink-0 border-b bg-background">
      <nav aria-label="Main navigation" className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="CareerKit home"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <BriefcaseBusinessIcon aria-hidden="true" className="size-6" />
          <span>CareerKit</span>
        </Link>
        <Suspense fallback={<Skeleton aria-label="Loading account" className="size-11 rounded-full" />}>
          <Account />
        </Suspense>
      </nav>
    </header>
  );
}

async function Account() {
  const { user, error } = await getAuthState();
  if (error) {
    return <p role="alert" className="text-sm text-destructive">Account unavailable. Please reload.</p>;
  }
  const metadata: Record<string, unknown> = user?.user_metadata ?? {};
  const name = [metadata.full_name, metadata.name, metadata.user_name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
  const avatar = [metadata.avatar_url, metadata.picture]
    .find((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value)) ?? null;

  return <HeaderAccount user={user ? { name, email: user.email ?? null, avatar } : null} />;
}
