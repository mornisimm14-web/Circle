"use server";

/**
 * Mutations for a Member's own Context Ledger. Sprint 3 scope: only the
 * Member writes their own entries (Support Partners get write access via
 * the Capture flow in Sprint 4). "Editing" never overwrites content — see
 * updateContextEntryAction — the append-only invariant is structural, not
 * a convention: there is no updateMany/update on `content` anywhere here.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { ContextCategory, ContextVisibility } from "@/generated/prisma/enums";
import { getSessionScope, requireRole } from "@/server/data/scope";

export async function createContextEntryAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "MEMBER");
  if (!scope.memberProfileId) redirect("/member/context?error=No+member+profile+yet");

  const category = formData.get("category") as ContextCategory;
  const content = (formData.get("content") as string)?.trim();
  const visibility = formData.get("visibility") as ContextVisibility;
  if (!content) redirect("/member/context?error=Entry+text+is+required");

  await db.contextLedgerEntry.create({
    data: {
      memberId: scope.memberProfileId,
      category,
      content,
      visibility,
      createdById: scope.userId,
    },
  });

  revalidatePath("/member/context");
}

/**
 * "Editing" an entry: create a new current row with supersedesId pointing
 * at the old one, then flip the old row's isCurrent to false. The old
 * row's content is never touched — its full text stays in the version
 * chain forever.
 */
export async function updateContextEntryAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "MEMBER");
  const entryId = formData.get("entryId") as string;
  const content = (formData.get("content") as string)?.trim();
  if (!content) redirect("/member/context?error=Entry+text+is+required");

  const existing = await db.contextLedgerEntry.findFirst({
    where: { id: entryId, memberId: scope.memberProfileId ?? "", isCurrent: true },
  });
  if (!existing) redirect("/member/context?error=Entry+not+found");

  await db.$transaction([
    db.contextLedgerEntry.update({ where: { id: entryId }, data: { isCurrent: false } }),
    db.contextLedgerEntry.create({
      data: {
        memberId: existing.memberId,
        category: existing.category,
        content,
        visibility: (formData.get("visibility") as ContextVisibility) ?? existing.visibility,
        createdById: scope.userId,
        supersedesId: existing.id,
      },
    }),
  ]);

  revalidatePath("/member/context");
}

export async function updateSharingPrefsAction(formData: FormData) {
  const scope = requireRole(await getSessionScope(), "MEMBER");
  if (!scope.memberProfileId) redirect("/member/context?error=No+member+profile+yet");

  const categories: ContextCategory[] = ["GOAL", "PREFERENCE", "NOTE"];
  const sharingPrefs: Record<string, string> = {};
  for (const category of categories) {
    const value = formData.get(`visibility_${category}`) as ContextVisibility | null;
    if (value) sharingPrefs[category] = value;
  }

  await db.memberProfile.update({
    where: { id: scope.memberProfileId },
    data: { sharingPrefs },
  });

  revalidatePath("/member/context");
}
