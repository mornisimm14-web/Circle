/**
 * Support Partner dashboard: caseload list — every Member this Partner
 * is actively assigned to, across all their circles, against their
 * caseload cap.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPartnerCaseload } from "@/server/data/careCircles";
import { getSessionScope } from "@/server/data/scope";

export default async function PartnerDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const scope = await getSessionScope();
  const { caseloadCap, memberships } = scope
    ? await getPartnerCaseload(scope)
    : { caseloadCap: 0, memberships: [] };

  return (
    <DashboardShell title="Dashboard" userName={session.user.name} roleLabel="Support Partner">
      <p className="text-muted-foreground mt-2 text-sm">
        My caseload ({memberships.length} / {caseloadCap})
      </p>

      {memberships.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">
          No Members assigned to you yet.
        </p>
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>{membership.careCircle.member.user.name}</TableCell>
                <TableCell>{membership.roleInCircle === "PRIMARY" ? "Primary" : "Secondary"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardShell>
  );
}
