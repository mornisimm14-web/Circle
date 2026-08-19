/**
 * Org Admin settings: safety-keyword management. The concrete embodiment
 * of the config-driven principle — without this screen, keywords would
 * have to be hardcoded in the SURFACE step's rule engine.
 */
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSafetyKeywordAction, removeSafetyKeywordAction } from "@/server/actions/admin";
import { listSafetyKeywords } from "@/server/data/settings";
import { getSessionScope } from "@/server/data/scope";

const SEVERITY_BADGE: Record<string, string> = {
  LOW: "bg-secondary text-secondary-foreground",
  MEDIUM: "bg-chart-4/15 text-chart-4",
  HIGH: "bg-chart-3/15 text-chart-3",
  CRITICAL: "bg-destructive/10 text-destructive",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { error } = await searchParams;
  const scope = await getSessionScope();
  const keywords = scope ? await listSafetyKeywords(scope) : [];

  return (
    <DashboardShell
      title="Settings"
      userName={session.user.name}
      roleLabel="Org Admin"
      nav={[
        { label: "Cohorts", href: "/admin/cohorts" },
        { label: "Settings", href: "/admin/settings" },
      ]}
    >
      {error && (
        <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="mt-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safety Keywords</CardTitle>
            <p className="text-muted-foreground text-sm">
              The SURFACE step flags any approved capture summary that contains one of these — config, not
              code.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {keywords.length === 0 ? (
              <p className="text-muted-foreground text-sm">No safety keywords configured yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {keywords.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span>&quot;{k.keyword}&quot;</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_BADGE[k.severity]}`}>
                        {k.severity}
                      </span>
                    </span>
                    <form action={removeSafetyKeywordAction}>
                      <input type="hidden" name="id" value={k.id} />
                      <Button type="submit" variant="outline" size="sm">
                        remove
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={addSafetyKeywordAction} className="flex flex-wrap items-end gap-2 border-t pt-4">
              <div className="flex min-w-40 flex-1 flex-col gap-1">
                <Label htmlFor="keyword" className="text-xs">
                  Keyword
                </Label>
                <Input id="keyword" name="keyword" required placeholder="e.g. hopeless" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="severity" className="text-xs">
                  Severity
                </Label>
                <select
                  id="severity"
                  name="severity"
                  defaultValue="HIGH"
                  className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <Button type="submit">+ Add keyword</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
