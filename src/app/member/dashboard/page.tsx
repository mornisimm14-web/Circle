/**
 * Member dashboard. Sprint 2 adds a Care Circle summary; the full circle
 * view (with per-partner cards) lives at /member/circle.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { getOwnCareCircle } from "@/server/data/careCircles";
import { getOpenActionItemsForMember } from "@/server/data/interactions";
import { getSessionScope } from "@/server/data/scope";

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const scope = await getSessionScope();
  const careCircle = scope ? await getOwnCareCircle(scope) : null;
  const primary = careCircle?.memberships.find((m) => m.roleInCircle === "PRIMARY");
  const openActionItems = scope?.memberProfileId
    ? await getOpenActionItemsForMember(scope, scope.memberProfileId)
    : [];

  return (
    <DashboardShell
      title="Dashboard"
      userName={session.user.name}
      roleLabel="Member"
      nav={[
        { label: "Dashboard", href: "/member/dashboard" },
        { label: "My Circle", href: "/member/circle" },
        { label: "My Context", href: "/member/context" },
      ]}
    >
      <div className="mt-8 flex flex-wrap gap-4">
        <div className="border-border max-w-sm flex-1 rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Your Circle
          </p>
          <p className="text-foreground mt-2 text-sm">
            {primary
              ? `Primary Support Partner: ${primary.supportPartner.user.name}`
              : "No Support Partner assigned yet."}
          </p>
          <Link href="/member/circle" className="text-primary mt-3 inline-block text-sm underline-offset-4 hover:underline">
            View full circle &rarr;
          </Link>
        </div>

        <div className="border-border max-w-sm flex-1 rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Open Commitments
          </p>
          {openActionItems.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">Nothing open right now.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {openActionItems.map((item) => (
                <li key={item.id}>
                  ☐ {item.description}
                  {item.dueDate && (
                    <span className="text-muted-foreground"> — due {item.dueDate.toISOString().slice(0, 10)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
