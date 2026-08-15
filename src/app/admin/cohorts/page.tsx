/**
 * Org Admin cohorts screen. Sprint 1: empty shell proving auth + role
 * redirect work — Sprint 2 adds real cohort creation/management.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function CohortsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardShell title="Cohorts" userName={session.user.name} roleLabel="Org Admin" />
  );
}
