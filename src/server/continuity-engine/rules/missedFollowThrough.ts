/**
 * Finds a Member's approved commitments that are past their due date and
 * don't already have an open flag for them — run on every Capture
 * approval as a general sweep of that Member's open items, not just
 * whatever the just-approved interaction mentioned.
 */
import { db } from "@/lib/db";

export type MissedFollowThroughMatch = {
  actionItemId: string;
  description: string;
  dueDate: Date;
};

export async function checkMissedFollowThrough(memberId: string): Promise<MissedFollowThroughMatch[]> {
  const overdue = await db.actionItem.findMany({
    where: {
      memberId,
      status: "APPROVED",
      dueDate: { lt: new Date() },
      reviewQueueItems: { none: { flagType: "MISSED_FOLLOW_UP" } },
    },
  });

  return overdue.map((item) => ({
    actionItemId: item.id,
    description: item.description,
    dueDate: item.dueDate!,
  }));
}
