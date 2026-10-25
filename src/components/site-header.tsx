import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";
import { Suspense } from "react";
import { HeaderAccount } from "@/components/header-account";
import { Skeleton } from "@/components/ui/skeleton";

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
          <HeaderAccount />
        </Suspense>
      </nav>
    </header>
  );
}
