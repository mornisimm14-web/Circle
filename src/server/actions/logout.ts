"use server";

/** Server action behind every dashboard's "Sign out" button. */
import { signOut } from "@/server/auth/auth.config";

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
