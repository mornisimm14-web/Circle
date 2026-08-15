/**
 * CIRCLE's placeholder logo mark (circle + triangle). Used in the top
 * bar, footer, and About page. Swap for the real brand mark once one
 * exists — every usage goes through this one component.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="var(--primary)" />
      <path d="M 50 26 L 72 66 L 28 66 Z" fill="var(--primary-foreground)" />
    </svg>
  );
}
