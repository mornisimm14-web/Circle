/**
 * Prep Card: what a Support Partner sees before a call with a Member —
 * an AI digest (transient, never persisted), their active goals, open
 * commitments, and recent context, plus the button that starts a new
 * Capture for this interaction.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startCaptureAction } from "@/server/actions/interactions";
import { getPrepDigest } from "@/server/data/interactions";
import { getSessionScope } from "@/server/data/scope";

export default async function PrepCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { memberId } = await params;
  const { error } = await searchParams;
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  const prep = await getPrepDigest(scope, memberId);
  if (!prep) notFound();

  return (
    <DashboardShell title={`Prep Card: ${prep.memberName}`} userName={session.user.name} roleLabel="Support Partner">
      {error && (
        <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="mt-8 flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Digest</CardTitle>
          </CardHeader>
          <CardContent>
            {prep.digest ? (
              <p className="text-foreground text-sm">{prep.digest}</p>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                AI digest isn&apos;t available right now — Anthropic API key isn&apos;t configured, or
                generation failed. The data below is still accurate.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active goals</CardTitle>
          </CardHeader>
          <CardContent>
            {prep.activeGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No goals on file yet.</p>
            ) : (
              <ul className="list-inside list-disc text-sm">
                {prep.activeGoals.map((goal, i) => (
                  <li key={i}>{goal}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open commitments</CardTitle>
          </CardHeader>
          <CardContent>
            {prep.openActionItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open commitments.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {prep.openActionItems.map((item) => (
                  <li key={item.id}>
                    ☐ {item.description}
                    {item.dueDate && <span className="text-muted-foreground"> — due {item.dueDate.toISOString().slice(0, 10)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent context</CardTitle>
          </CardHeader>
          <CardContent>
            {prep.recentContext.length === 0 ? (
              <p className="text-muted-foreground text-sm">No context entries yet.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {prep.recentContext.map((entry) => (
                  <li key={entry.id}>
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {entry.category}
                    </span>{" "}
                    {entry.content}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <form action={startCaptureAction}>
          <input type="hidden" name="memberId" value={memberId} />
          <Button type="submit" size="lg">
            Start Capture &rarr;
          </Button>
        </form>
      </div>
    </DashboardShell>
  );
}
