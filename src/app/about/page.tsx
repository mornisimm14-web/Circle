/**
 * Public "About" page — why CIRCLE exists, the four roles that use the
 * platform, and the human-in-the-loop AI boundary. Visual system follows
 * the CIRCLE design reference; copy stays non-clinical/general-population.
 */
import { getTranslations } from "next-intl/server";
import { Building2, HeartHandshake, ShieldCheck, Sparkles, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/shared/top-bar";
import { LogoMark } from "@/components/shared/logo-mark";
import { ImagePlaceholder } from "@/components/shared/image-placeholder";
import { FloatingSupportLink } from "@/components/shared/floating-support-link";
import { SiteFooter } from "@/components/shared/site-footer";

export default async function AboutPage() {
  const t = await getTranslations("about");

  const roles = [
    {
      title: t("roleMemberTitle"),
      body: t("roleMemberBody"),
      icon: User,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      title: t("rolePartnerTitle"),
      body: t("rolePartnerBody"),
      icon: HeartHandshake,
      colorClass: "bg-success/10 text-success",
    },
    {
      title: t("roleLeadTitle"),
      body: t("roleLeadBody"),
      icon: ShieldCheck,
      colorClass: "bg-chart-3/15 text-chart-3",
    },
    {
      title: t("roleAdminTitle"),
      body: t("roleAdminBody"),
      icon: Building2,
      colorClass: "bg-chart-4/15 text-chart-4",
    },
  ];

  const numbered = [
    { n: "01", title: t("numbered1Title"), body: t("numbered1Body") },
    { n: "02", title: t("numbered2Title"), body: t("numbered2Body") },
    { n: "03", title: t("numbered3Title"), body: t("numbered3Body") },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
          <div className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">
            {t("eyebrow")}
          </div>
          <h1 className="text-foreground max-w-3xl font-serif text-4xl leading-tight font-medium text-balance sm:text-5xl">
            {t("heroTitle")}
          </h1>

          <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1fr_1fr_auto]">
            <p className="text-muted-foreground leading-relaxed">{t("bodyLeft")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("bodyRight")}</p>
            <LogoMark size={72} />
          </div>

          <ImagePlaceholder label={t("imageLabel")} aspectRatio="16/6" className="mt-16" />

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {numbered.map((item) => (
              <div key={item.n}>
                <div className="text-primary font-serif text-4xl font-medium">{item.n}</div>
                <div className="mt-2 text-lg font-semibold">{item.title}</div>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-border border-t">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-foreground font-serif text-2xl font-medium tracking-tight">
              {t("missionTitle")}
            </h2>
            <p className="text-muted-foreground mt-4">{t("missionBody")}</p>
          </div>
        </section>

        <section className="border-border bg-muted/40 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-foreground text-center font-serif text-2xl font-medium tracking-tight">
              {t("rolesTitle")}
            </h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {roles.map((role) => (
                <Card key={role.title} className="border-border/80">
                  <CardHeader>
                    <div
                      className={`mb-2 flex size-10 items-center justify-center rounded-full ${role.colorClass}`}
                    >
                      <role.icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{role.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-border border-t">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="bg-success/10 text-success mb-4 flex size-10 items-center justify-center rounded-full">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <h2 className="text-foreground font-serif text-2xl font-medium tracking-tight">
              {t("aiTitle")}
            </h2>
            <p className="text-muted-foreground mt-4">{t("aiBody")}</p>
          </div>
        </section>
      </main>

      <SiteFooter />

      <FloatingSupportLink />
    </div>
  );
}
