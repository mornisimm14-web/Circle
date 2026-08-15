/**
 * Member's own Care Circle — who their PRIMARY/SECONDARY Support
 * Partners are. Deliberately shows no contact details (phone/email),
 * per the platform's anti-off-platform-leakage principle.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOwnCareCircle } from "@/server/data/careCircles";
import { getSessionScope } from "@/server/data/scope";

export default async function MemberCirclePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const scope = await getSessionScope();
  const careCircle = scope ? await getOwnCareCircle(scope) : null;

  return (
    <DashboardShell
      title="My Circle"
      userName={session.user.name}
      roleLabel="Member"
      nav={[
        { label: "Dashboard", href: "/member/dashboard" },
        { label: "My Circle", href: "/member/circle" },
      ]}
    >
      {!careCircle ? (
        <p className="text-muted-foreground mt-8 text-sm">
          You haven&apos;t been assigned to a circle yet. Your org admin will set this up shortly.
        </p>
      ) : careCircle.memberships.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">
          Your circle exists but doesn&apos;t have any Support Partners assigned yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {careCircle.memberships.map((membership) => (
            <Card key={membership.id}>
              <CardHeader>
                <span className="bg-primary/10 text-primary w-fit rounded-full px-3 py-1 text-xs font-semibold">
                  {membership.roleInCircle === "PRIMARY" ? "Primary" : "Secondary"}
                </span>
                <CardTitle className="mt-2 text-lg">{membership.supportPartner.user.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Support Partner</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
