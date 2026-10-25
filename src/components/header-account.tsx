"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOutIcon, UserRoundIcon } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export function HeaderAccount({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

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
