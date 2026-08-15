/**
 * Org Admin cohort roster: create cohorts, see who's in each one. Assigning
 * users into a cohort and wiring up circle memberships happens on the
 * per-cohort detail screen (/admin/cohorts/[cohortId]) — kept separate so
 * this list stays scannable as the roster grows.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCohortAction } from "@/server/actions/care-circle";
import { listCohorts } from "@/server/data/cohorts";
import { getSessionScope } from "@/server/data/scope";

export default async function CohortsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const scope = await getSessionScope();
  const cohorts = scope ? await listCohorts(scope) : [];

  return (
    <DashboardShell title="Cohorts" userName={session.user.name} roleLabel="Org Admin">
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          {cohorts.length === 0 && (
            <p className="text-muted-foreground text-sm">No cohorts yet — create the first one.</p>
          )}
          {cohorts.map((cohort) => (
            <Card key={cohort.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <Link href={`/admin/cohorts/${cohort.id}`} className="hover:underline">
                    {cohort.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Lead: {cohort.lead?.user.name ?? "Unassigned"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {cohort.memberProfiles.length} member{cohort.memberProfiles.length === 1 ? "" : "s"} ·{" "}
                  {cohort.supportPartners.length} partner{cohort.supportPartners.length === 1 ? "" : "s"}
                </p>
                <Link
                  href={`/admin/cohorts/${cohort.id}`}
                  className="text-primary mt-3 inline-block text-sm underline-offset-4 hover:underline"
                >
                  Manage &rarr;
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">New cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCohortAction} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="e.g. Rehab-North" required />
              </div>
              <Button type="submit">Create cohort</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
