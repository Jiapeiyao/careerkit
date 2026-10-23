import { AuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function getUser() {
  const supabase = await createClient("read-only");
  const { data, error } = await supabase.auth.getUser();

  if (error && !(error instanceof AuthSessionMissingError)) {
    console.error("Supabase user verification failed", {
      code: error.code,
      status: error.status,
    });
    throw new Error("Unable to verify your account. Please try again.");
  }

  return data.user;
}
