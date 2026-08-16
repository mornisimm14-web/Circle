/**
 * Capture screen: type notes or upload+transcribe audio, generate an AI
 * draft, edit it freely, then either Save draft (no status change) or
 * Approve & finalize (the only button that writes a ContextLedgerEntry).
 * Which section renders depends entirely on the Interaction's current
 * state — no client state, just server-rendered branches re-fetched after
 * each action.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/auth/auth.config";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  addActionItemAction,
  approveCaptureAction,
  generateDraftAction,
  removeActionItemAction,
  saveDraftAction,
  submitRawNotesAction,
  uploadAudioAction,
} from "@/server/actions/interactions";
import { getInteraction } from "@/server/data/interactions";
import { getSessionScope } from "@/server/data/scope";

export default async function CapturePage({
  params,
  searchParams,
}: {
  params: Promise<{ interactionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { interactionId } = await params;
  const { error } = await searchParams;
  const scope = await getSessionScope();
  if (!scope) redirect("/login");

  const interaction = await getInteraction(scope, interactionId);
  if (!interaction) notFound();

  const occurredAt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    interaction.occurredAt,
  );
  // Hoisted so TS narrows it once, rather than re-checking summary
  // (which doesn't narrow through the .map() closure below).
  const summary = interaction.summary;

  return (
    <DashboardShell
      title={`Capture: ${interaction.member.user.name} — ${occurredAt}`}
      userName={session.user.name}
      roleLabel="Support Partner"
    >
      {error && (
        <p className="bg-destructive/10 text-destructive mt-6 rounded-lg px-3 py-2 text-sm">
          {decodeURIComponent(error)}
        </p>
      )}

      <div className="mt-8 flex max-w-2xl flex-col gap-6">
        {!interaction.rawNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How was this interaction recorded?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <form action={submitRawNotesAction} className="flex flex-col gap-2">
                <input type="hidden" name="interactionId" value={interactionId} />
                <Label htmlFor="rawNotes">Type notes manually</Label>
                <textarea
                  id="rawNotes"
                  name="rawNotes"
                  rows={5}
                  required
                  className="border-input w-full rounded-lg border bg-transparent p-2 text-sm"
                  placeholder="What was discussed?"
                />
                <Button type="submit" className="self-start">
                  Save notes
                </Button>
              </form>

              <div className="border-border border-t pt-6">
                <form action={uploadAudioAction} className="flex flex-col gap-3">
                  <input type="hidden" name="interactionId" value={interactionId} />
                  <Label htmlFor="audioFile">Upload audio recording (mp3, m4a, or wav — 50MB max)</Label>
                  <input
                    id="audioFile"
                    name="audioFile"
                    type="file"
                    accept=".mp3,.m4a,.wav"
                    className="text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="consentConfirmed" required />I have appropriate consent to
                    record &amp; upload this
                  </label>
                  <Button type="submit" variant="outline" className="self-start">
                    Transcribe locally &rarr;
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {interaction.rawNotes && !summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Raw notes {interaction.captureMethod === "AUDIO_UPLOAD" ? "(transcribed)" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-foreground text-sm whitespace-pre-wrap">{interaction.rawNotes}</p>
              <form action={generateDraftAction}>
                <input type="hidden" name="interactionId" value={interactionId} />
                <Button type="submit">Generate draft with AI</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>AI Draft Summary</span>
                <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                  Status: {summary.status === "PENDING_APPROVAL" ? "PENDING" : "APPROVED"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {summary.status === "PENDING_APPROVAL" ? (
                <form action={saveDraftAction} className="flex flex-col gap-2">
                  <input type="hidden" name="interactionId" value={interactionId} />
                  <textarea
                    name="summary"
                    defaultValue={summary.content}
                    rows={4}
                    required
                    className="border-input w-full rounded-lg border bg-transparent p-2 text-sm"
                  />
                  <Button type="submit" variant="outline" size="sm" className="self-start">
                    Save draft
                  </Button>
                </form>
              ) : (
                <p className="text-foreground text-sm whitespace-pre-wrap">{summary.content}</p>
              )}

              <div>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  Suggested action items
                </p>
                <ul className="flex flex-col gap-2">
                  {interaction.actionItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {item.description}
                        {item.dueDate && (
                          <span className="text-muted-foreground"> — due {item.dueDate.toISOString().slice(0, 10)}</span>
                        )}
                      </span>
                      {summary.status === "PENDING_APPROVAL" && (
                        <form action={removeActionItemAction}>
                          <input type="hidden" name="interactionId" value={interactionId} />
                          <input type="hidden" name="actionItemId" value={item.id} />
                          <Button type="submit" variant="outline" size="sm">
                            remove
                          </Button>
                        </form>
                      )}
                    </li>
                  ))}
                  {interaction.actionItems.length === 0 && (
                    <li className="text-muted-foreground text-sm">No action items.</li>
                  )}
                </ul>

                {summary.status === "PENDING_APPROVAL" && (
                  <form action={addActionItemAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="interactionId" value={interactionId} />
                    <div className="flex flex-1 flex-col gap-1">
                      <Label htmlFor="description" className="text-xs">
                        Description
                      </Label>
                      <input
                        id="description"
                        name="description"
                        required
                        className="border-input h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="dueDate" className="text-xs">
                        Due date
                      </Label>
                      <input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
                      />
                    </div>
                    <Button type="submit" variant="outline" size="sm">
                      + Add manually
                    </Button>
                  </form>
                )}
              </div>

              {summary.status === "PENDING_APPROVAL" && (
                <form action={approveCaptureAction}>
                  <input type="hidden" name="interactionId" value={interactionId} />
                  <Button type="submit" size="lg">
                    ✓ Approve &amp; finalize
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
