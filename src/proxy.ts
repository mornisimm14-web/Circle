/**
 * Route gate for the whole app (Next.js 16 renamed middleware.ts to
 * proxy.ts — see docs/plan.md). Reads the JWT session (no DB call) to:
 * redirect signed-out users away from role-scoped routes, redirect
 * signed-in users away from /login and /signup, and block a role from
 * another role's area. This is a first-pass UX redirect only — every
 * Server Action still calls requireRole() itself; see the RBAC section
 * of docs/plan.md for why the real enforcement lives there, not here.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth/auth.config";
import { ROLE_HOME, ROLE_PATH_PREFIX } from "@/server/auth/role-home";

const AUTH_PAGES = new Set(["/login", "/signup"]);
const ROLE_SCOPED_PREFIXES = Object.values(ROLE_PATH_PREFIX);

export default auth((request) => {
  const { nextUrl } = request;
  const session = request.auth;
  const role = session?.user?.role;

  const isRoleScopedPath = ROLE_SCOPED_PREFIXES.some((prefix) =>
    nextUrl.pathname.startsWith(prefix),
  );

  if (!session) {
    if (isRoleScopedPath) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  if (!role) return NextResponse.next();

  if (AUTH_PAGES.has(nextUrl.pathname) || nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[role], nextUrl));
  }

  if (isRoleScopedPath && !nextUrl.pathname.startsWith(ROLE_PATH_PREFIX[role])) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api/chat|api/auth).*)"],
};
