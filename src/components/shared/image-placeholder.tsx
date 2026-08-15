/**
 * Diagonal-stripe placeholder for image bands that don't have real
 * photography yet. Renders a labeled slot so the layout reads correctly
 * pre-launch — swap the `<div>` for a real `<Image>` once photography
 * exists, keeping the same aspect ratio/rounded container.
 */
export function ImagePlaceholder({
  label,
  aspectRatio = "16/8",
  className = "",
}: {
  label: string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_10px,var(--border)_10px,var(--border)_20px)] flex items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio }}
    >
      <span className="bg-background text-muted-foreground rounded-md px-3 py-1.5 font-mono text-xs">
        image: {label}
      </span>
    </div>
  );
}
