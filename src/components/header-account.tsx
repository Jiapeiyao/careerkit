"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LogOutIcon, UserRoundIcon } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isHeaderAccountResponse, type HeaderAccountResponse } from "@/lib/header-account";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderAccount() {
  const pathname = usePathname();
  const [account, setAccount] = useState<(HeaderAccountResponse & { pathname: string }) | null>(null);
  const [retry, setRetry] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      try {
        const response = await fetch("/api/auth/account", { cache: "no-store", signal });
        const result: unknown = await response.json();
        if (!isHeaderAccountResponse(result) || (!response.ok && !result.error)) {
          throw new Error(`Invalid account response (${response.status}).`);
        }
        if (active && !signal.aborted) setAccount({ ...result, pathname });
      } catch (error) {
        if (!active || signal.aborted) return;
        console.error("Account status request failed:", error);
        setAccount({ user: null, error: "Account details could not load. Please try again.", pathname });
      }
    }

    function refreshVisible() {
      if (document.visibilityState === "visible") void refresh();
    }

    void refresh();
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [pathname, retry]);

  // Root layouts persist across navigation; never display a previous route's account state.
  if (!account || account.pathname !== pathname) {
    if (pathname === "/login") return null;
    return <Skeleton aria-label="Loading account" className="size-11 rounded-full" />;
  }
  if (account.error) {
    return (
      <div className="flex items-center gap-2">
        <p role="alert" className="text-sm text-destructive">Account unavailable.</p>
        <Button variant="ghost" className="min-h-11" onClick={() => setRetry((value) => value + 1)}>Retry</Button>
      </div>
    );
  }
  const { user } = account;
  if (!user) {
    if (pathname === "/login") return null;
    return (
      <Button asChild className="min-h-11">
        <Link href="/login">Sign in / Sign up</Link>
      </Button>
    );
  }

  const initial = user.name ? Array.from(user.name)[0].toLocaleUpperCase() : null;
  return (
    <>
      {pending && <span role="status" className="sr-only">Signing out...</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-11 rounded-full" aria-label="Open account menu" disabled={pending}>
            <Avatar size="lg">
              {user.avatar && <AvatarImage src={user.avatar} alt="" referrerPolicy="no-referrer" />}
              <AvatarFallback>
                {initial ?? <UserRoundIcon aria-hidden="true" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="break-words">{user.name ?? "Your account"}</span>
              <span className="break-all">{user.email ?? "No email address"}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="min-h-11" disabled={pending} onSelect={() => startTransition(signOut)}>
              <LogOutIcon aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
