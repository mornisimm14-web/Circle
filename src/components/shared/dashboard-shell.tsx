/**
 * Minimal authenticated-area shell for Sprint 1's empty dashboards — just
 * enough to prove the redirect-by-role flow works end to end. Sprint 2+
 * replaces this with the real app shell (org name, nav, role badge).
 */
import { LogoMark } from "@/components/shared/logo-mark";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/logout";

export function DashboardShell({
  title,
  userName,
  roleLabel,
  children,
}: {
  title: string;
  userName: string;
  roleLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="text-primary font-serif text-lg font-semibold">CIRCLE</span>
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
