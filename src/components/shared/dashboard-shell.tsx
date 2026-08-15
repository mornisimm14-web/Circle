/**
 * Authenticated-area shell shared by every role's screens: logo, an
 * optional set of role-specific nav links, role badge, sign-out. `nav`
 * stays a flat list (not a real sidebar) — deliberately minimal until a
 * role has enough screens to justify one.
 */
import Link from "next/link";
import { LogoMark } from "@/components/shared/logo-mark";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/logout";

export function DashboardShell({
  title,
  userName,
  roleLabel,
  nav,
  children,
}: {
  title: string;
  userName: string;
  roleLabel: string;
  nav?: { label: string; href: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="text-primary font-serif text-lg font-semibold">CIRCLE</span>
          </div>
          {nav && nav.length > 0 && (
            <nav className="flex items-center gap-4">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
            {roleLabel}
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <h1 className="text-foreground font-serif text-2xl font-medium">{title}</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {userName}.</p>
        {children}
      </main>
    </div>
  );
}
