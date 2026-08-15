/**
 * Professional Lead review queue. Sprint 1: empty shell proving auth +
 * role redirect work — Sprint 5-6 add the real flagged-item queue.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function ReviewQueuePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <DashboardShell
      title="Review Queue"
      userName={session.user.name}
      roleLabel="Professional Lead"
    />
  );
}
