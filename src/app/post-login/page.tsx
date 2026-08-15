/**
 * Post-login resolver. The login Server Action redirects here instead of
 * to "/" directly: the login page has a "back to home" link, which Next.js
 * prefetches (caching an unauthenticated RSC payload for "/"), so a
 * post-login soft navigation straight to "/" can silently reuse that stale
 * cache and never re-render as the signed-in user. "/post-login" is never
 * linked or prefetched anywhere, so it always renders fresh.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { ROLE_HOME } from "@/server/auth/role-home";

export default async function PostLoginPage() {
  const session = await auth();
  redirect(session?.user?.role ? ROLE_HOME[session.user.role] : "/login");
}
