"use server";

/**
 * Server action behind the login form. On success, signIn's own redirect
 * (redirectTo below) sends the browser to /post-login, which resolves the
 * user's actual role home — see src/app/post-login/page.tsx for why we
 * don't redirect straight to "/". On invalid credentials, signIn throws
 * instead of redirecting on its own, so we redirect back to /login with
 * ?error= ourselves for the page to read. redirect() itself throws a
 * NEXT_REDIRECT signal in both branches — never swallow it as a real error.
 */
import { signIn } from "@/server/auth/auth.config";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/post-login",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=CredentialsSignin");
    }
    throw error;
  }
}
