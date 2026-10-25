import { NextResponse } from "next/server";
import type { HeaderAccountResponse } from "@/lib/header-account";
import { readAuthState } from "@/lib/supabase/server";

export async function GET() {
  const { user, error } = await readAuthState(true);
  const metadata: Record<string, unknown> = user?.user_metadata ?? {};
  const name = [metadata.full_name, metadata.name, metadata.user_name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? null;
  const avatar = [metadata.avatar_url, metadata.picture]
    .find((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value)) ?? null;
  const body: HeaderAccountResponse = {
    user: user ? { name, email: user.email ?? null, avatar } : null,
    error,
  };

  return NextResponse.json(body, {
    status: error ? 503 : 200,
    headers: {
      "Cache-Control": "private, no-store",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
