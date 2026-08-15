/**
 * Support Partner dashboard. Sprint 1: empty shell proving auth + role
 * redirect work — Sprint 2 adds the real caseload content.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function PartnerDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardShell title="Dashboard" userName={session.user.name} roleLabel="Support Partner" />
  );
}
