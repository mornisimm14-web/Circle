/**
 * Manage a single cohort: assign any org User (Member/Support
 * Partner/Professional Lead) into it, and — for Members already in this
 * cohort — assign Support Partners into their Care Circle as PRIMARY or
 * SECONDARY. This is where assignPartnerToCircleAction's "one active
 * PRIMARY per circle" rule is actually exercised from the UI.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  assignPartnerToCircleAction,
  assignUserToCohortAction,
  deactivateMembershipAction,
} from "@/server/actions/care-circle";
import { getCohortDetail, listOrgUsers } from "@/server/data/cohorts";
import { getSessionScope } from "@/server/data/scope";

const ROLE_LABEL = {
  MEMBER: "Member",
  SUPPORT_PARTNER: "Support Partner",
  PROFESSIONAL_LEAD: "Professional Lead",
  ORG_ADMIN: "Org Admin",
};

export default async function CohortDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { cohortId } = await params;
  const { error } = await searchParams;
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  const [cohort, orgUsers] = await Promise.all([
    getCohortDetail(scope, cohortId),
    listOrgUsers(scope),
  ]);
  if (!cohort) notFound();

  const assignableUsers = orgUsers.filter((user) => user.role !== "ORG_ADMIN");

  return (
    <DashboardShell
      title={cohort.name}
      userName={session.user.name}
      roleLabel="Org Admin"
      nav={[
        { label: "Cohorts", href: "/admin/cohorts" },
        { label: "Settings", href: "/admin/settings" },
      ]}
    >
      {error && (
        <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <p className="text-muted-foreground mt-2 text-sm">
        Lead: {cohort.lead?.user.name ?? "Unassigned"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members &amp; their circles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {cohort.memberProfiles.length === 0 && (
                <p className="text-muted-foreground text-sm">No Members in this cohort yet.</p>
              )}
              {cohort.memberProfiles.map((memberProfile) => (
                <div key={memberProfile.id} className="border-border rounded-xl border p-4">
                  <p className="font-medium">{memberProfile.user.name}</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {memberProfile.careCircle?.memberships.length ? (
                      memberProfile.careCircle.memberships.map((membership) => (
                        <li key={membership.id} className="flex items-center justify-between text-sm">
                          <span>
                            {membership.roleInCircle === "PRIMARY" ? "Primary" : "Secondary"}:{" "}
                            {membership.supportPartner.user.name}
                          </span>
                          <form action={deactivateMembershipAction}>
                            <input type="hidden" name="membershipId" value={membership.id} />
                            <input type="hidden" name="cohortId" value={cohortId} />
                            <Button type="submit" variant="outline" size="sm">
                              Remove
                            </Button>
                          </form>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground text-sm">No Support Partner assigned yet.</li>
                    )}
                  </ul>

                  {memberProfile.careCircle && cohort.supportPartners.length > 0 && (
                    <form action={assignPartnerToCircleAction} className="mt-3 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="careCircleId" value={memberProfile.careCircle.id} />
                      <input type="hidden" name="cohortId" value={cohortId} />
                      <select
                        name="supportPartnerId"
                        required
                        className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
                      >
                        {cohort.supportPartners.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.user.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="roleInCircle"
                        required
                        className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="SECONDARY">Secondary</option>
                      </select>
                      <Button type="submit" variant="outline" size="sm">
                        Assign to circle
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support Partners in this cohort</CardTitle>
            </CardHeader>
            <CardContent>
              {cohort.supportPartners.length === 0 ? (
                <p className="text-muted-foreground text-sm">No Support Partners in this cohort yet.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {cohort.supportPartners.map((partner) => (
                    <li key={partner.id}>{partner.user.name}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Assign a user to this cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={assignUserToCohortAction} className="flex flex-col gap-3">
              <input type="hidden" name="cohortId" value={cohortId} />
              <select
                name="userId"
                required
                className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
              >
                <option value="">Select a user…</option>
                {assignableUsers.map((user) => {
                  const currentCohort =
                    user.memberProfile?.cohort?.name ??
                    user.supportPartnerProfile?.cohort?.name ??
                    user.professionalLeadProfile?.cohort?.name ??
                    null;
                  return (
                    <option key={user.id} value={user.id}>
                      {user.name} ({ROLE_LABEL[user.role]}
                      {currentCohort ? ` — currently: ${currentCohort}` : ""})
                    </option>
                  );
                })}
              </select>
              <Button type="submit">Assign</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
