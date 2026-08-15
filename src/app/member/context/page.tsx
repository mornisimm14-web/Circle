/**
 * Member's own Context Ledger: goals/preferences/notes that stay with
 * them across every Support Partner they ever work with — the whole
 * point of "human continuity." Editing a row supersedes it rather than
 * overwriting (see context-ledger.ts); the full history stays queryable
 * even though this view only shows the current version of each entry.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createContextEntryAction,
  updateContextEntryAction,
  updateSharingPrefsAction,
} from "@/server/actions/context-ledger";
import { getContextEntries } from "@/server/data/contextEntries";
import { getSessionScope } from "@/server/data/scope";
import { db } from "@/lib/db";

const CATEGORIES = ["GOAL", "PREFERENCE", "NOTE"] as const;
const VISIBILITY_OPTIONS = [
  { value: "MEMBER_ONLY", label: "Only me" },
  { value: "CIRCLE", label: "My Circle" },
  { value: "COHORT", label: "My Cohort (+ Lead)" },
  { value: "ORG", label: "Whole Org" },
] as const;

const selectClass = "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";

export default async function MemberContextPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; category?: string; edit?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { error, category, edit } = await searchParams;
  const scope = await getSessionScope();
  if (!scope?.memberProfileId) redirect("/member/dashboard");

  const [allEntries, profile] = await Promise.all([
    getContextEntries(scope, scope.memberProfileId),
    db.memberProfile.findUnique({ where: { id: scope.memberProfileId } }),
  ]);
  const entries = category ? allEntries.filter((entry) => entry.category === category) : allEntries;
  const sharingPrefs = (profile?.sharingPrefs as Record<string, string> | null) ?? {};

  return (
    <DashboardShell
      title="My Context Ledger"
      userName={session.user.name}
      roleLabel="Member"
      nav={[
        { label: "Dashboard", href: "/member/dashboard" },
        { label: "My Circle", href: "/member/circle" },
        { label: "My Context", href: "/member/context" },
      ]}
    >
      {error && (
        <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">Filter:</span>
            {[null, ...CATEGORIES].map((c) => (
              <a
                key={c ?? "all"}
                href={c ? `/member/context?category=${c}` : "/member/context"}
                className={
                  (c ?? null) === (category ?? null)
                    ? "text-primary text-sm font-semibold underline-offset-4"
                    : "text-muted-foreground hover:text-foreground text-sm"
                }
              >
                {c ?? "All"}
              </a>
            ))}
          </div>

          {entries.length === 0 && (
            <p className="text-muted-foreground text-sm">No entries yet — add your first one.</p>
          )}

          {entries.map((entry) =>
            edit === entry.id ? (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <form action={updateContextEntryAction} className="flex flex-col gap-2">
                    <input type="hidden" name="entryId" value={entry.id} />
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {entry.category}
                    </span>
                    <textarea
                      name="content"
                      defaultValue={entry.content}
                      required
                      rows={2}
                      className="border-input w-full rounded-lg border bg-transparent p-2 text-sm"
                    />
                    <select name="visibility" defaultValue={entry.visibility} className={selectClass}>
                      {VISIBILITY_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<a href="/member/context">Cancel</a>}
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {entry.category}
                    </span>
                    <a
                      href={`/member/context?edit=${entry.id}`}
                      className="text-primary text-xs underline-offset-4 hover:underline"
                    >
                      Edit
                    </a>
                  </div>
                  <CardTitle className="text-base font-normal">{entry.content}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    added by {entry.createdBy.name} ·{" "}
                    {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(entry.createdAt)}{" "}
                    · visible to: {VISIBILITY_OPTIONS.find((v) => v.value === entry.visibility)?.label}
                  </p>
                </CardContent>
              </Card>
            ),
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">+ Add entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createContextEntryAction} className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Category</label>
                  <select name="category" required className={selectClass} defaultValue="GOAL">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex min-w-48 flex-1 flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Entry</label>
                  <input
                    name="content"
                    required
                    className="border-input h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Visible to</label>
                  {/* Pre-filled from the Member's own sharing preference for GOAL, since
                      that's the category select's default — without client JS this can't
                      re-sync if they switch category, so it's a starting point, not a lock. */}
                  <select name="visibility" defaultValue={sharingPrefs.GOAL ?? "CIRCLE"} className={selectClass}>
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit">Add</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Sharing preferences</CardTitle>
            <p className="text-muted-foreground text-xs">
              Default visibility for new entries, per category. You can still override it per entry.
            </p>
          </CardHeader>
          <CardContent>
            <form action={updateSharingPrefsAction} className="flex flex-col gap-3">
              {CATEGORIES.map((c) => (
                <div key={c} className="flex items-center justify-between gap-2">
                  <label className="text-sm">{c}</label>
                  <select name={`visibility_${c}`} defaultValue={sharingPrefs[c] ?? "CIRCLE"} className={selectClass}>
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <Button type="submit" size="sm" className="mt-2">
                Save preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
