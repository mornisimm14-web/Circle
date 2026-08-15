/**
 * Public "Contact" page, reached from the nav and every "Let's talk now"
 * CTA. The form itself is a client component (see ContactForm) since it
 * needs local submit/thank-you state; everything else here stays a
 * server-rendered shell.
 */
import { getTranslations } from "next-intl/server";
import { TopBar } from "@/components/shared/top-bar";
import { ContactForm } from "@/components/contact/contact-form";
import { FloatingSupportLink } from "@/components/shared/floating-support-link";
import { SiteFooter } from "@/components/shared/site-footer";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <main className="flex-1">
        <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-primary mb-4 text-center text-sm font-semibold tracking-wide uppercase">
            {t("eyebrow")}
          </div>
          <h1 className="text-foreground text-center font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-3 text-center">{t("subtitle")}</p>

          <div className="mt-10">
            <ContactForm />
          </div>
        </section>
      </main>

      <SiteFooter />

      <FloatingSupportLink />
    </div>
  );
}
