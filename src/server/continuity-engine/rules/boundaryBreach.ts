/**
 * Detects attempts to move the relationship off-platform — phone numbers,
 * emails, or explicit "contact me outside the app" language in a capture
 * summary. This is a core product principle (see docs/plan.md's framing
 * of preventing "escape" from the platform), not an incidental check, so
 * it stays a hard deterministic rule rather than something left to the
 * LLM's judgment alone.
 */

const PHONE_PATTERN = /(\+?\d[\d\-.\s()]{7,}\d)/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const OFF_PLATFORM_PHRASES = [
  "whatsapp",
  "text me",
  "call me directly",
  "my number is",
  "outside the app",
  "outside the platform",
  "off the app",
  "off the platform",
  "instagram",
  "let's meet in person",
  "personal email",
];

export type BoundaryBreachMatch = { rationale: string };

export function checkBoundaryBreach(text: string): BoundaryBreachMatch[] {
  const matches: BoundaryBreachMatch[] = [];
  const lowerText = text.toLowerCase();

  if (PHONE_PATTERN.test(text)) {
    matches.push({ rationale: "Text appears to contain a phone number." });
  }
  if (EMAIL_PATTERN.test(text)) {
    matches.push({ rationale: "Text appears to contain an email address." });
  }
  for (const phrase of OFF_PLATFORM_PHRASES) {
    if (lowerText.includes(phrase)) {
      matches.push({ rationale: `Text contains the phrase "${phrase}", suggesting off-platform contact.` });
    }
  }

  return matches;
}
