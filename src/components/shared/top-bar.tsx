/**
 * Public top bar shown on unauthenticated screens: a slim announcement
 * bar, then the sticky header (logo + nav grouped left, "Let's talk" +
 * Login/Sign up grouped right). The authenticated app shell (org name,
 * user name, role badge, logout) is a separate component introduced
 * once auth exists.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";

const NAV_LINKS = [
  { href: "/", key: "home" } as const,
  { href: "/about", key: "about" } as const,
  { href: "/contact", key: "contact" } as const,
];

export async function TopBar() {
  const t = await getTranslations();

  return (
    <>
      <div className="bg-secondary-foreground px-4 py-2.5 text-center sm:px-6 lg:px-8">
        <span className="text-primary-foreground/90 text-sm">{t("nav.announcement")} </span>
        <Link
          href="/contact"
          className="text-primary-foreground text-sm font-semibold underline underline-offset-2"
        >
          {t("nav.announcementCta")}
        </Link>
      </div>

      <header className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark size={28} />
              <span className="text-primary font-serif text-2xl font-semibold tracking-wide">
                {t("common.appName")}
              </span>
            </Link>

            <nav className="hidden items-center gap-8 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground/70 hover:text-foreground text-[15px] font-medium transition-colors"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="hidden rounded-none sm:inline-flex"
              nativeButton={false}
              render={<Link href="/contact">{t("landing.letsTalk")}</Link>}
            />
            <span className="bg-border hidden h-6 w-px sm:block" aria-hidden />
            <Button
              variant="secondary"
              className="rounded-full"
              nativeButton={false}
              render={<Link href="/login">{t("nav.signIn")}</Link>}
            />
            <Button
              className="rounded-full"
              nativeButton={false}
              render={<Link href="/signup">{t("nav.signUp")}</Link>}
            />
          </div>
        </div>
      </header>
    </>
  );
}
