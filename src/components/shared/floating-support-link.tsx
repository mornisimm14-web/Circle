/**
 * Persistent floating link shown on every public page, so starting a
 * conversation is never more than one click away. Links to /contact for
 * now — "Support Partner" is our own non-clinical role name, so this
 * makes no clinical claim.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function FloatingSupportLink() {
  const t = await getTranslations("floatingChat");

  return (
    <Link
      href="/contact"
      className="bg-secondary-foreground text-primary-foreground fixed end-6 bottom-6 z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 text-sm font-semibold shadow-lg transition-transform hover:scale-105"
    >
      <span className="bg-success inline-block size-2 rounded-full" aria-hidden />
      {t("label")}
    </Link>
  );
}
