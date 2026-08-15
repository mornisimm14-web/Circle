/**
 * Shared footer for every public page: logo mark + wordmark on the
 * start side, copyright on the end side.
 */
import { LogoMark } from "@/components/shared/logo-mark";

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 sm:px-6 lg:px-8">
        <span className="text-primary flex items-center gap-2 font-serif text-lg font-semibold">
          <LogoMark size={20} />
          CIRCLE
        </span>
        <span className="text-muted-foreground text-sm">© {new Date().getFullYear()} CIRCLE</span>
      </div>
    </footer>
  );
}
