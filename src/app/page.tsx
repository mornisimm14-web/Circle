/**
 * Public landing page. Static-only for Sprint 0 — no DB, no auth, no
 * server actions. Visual system follows the CIRCLE design reference
 * (Newsreader/Inter, warm off-white palette, blue/green/orange/purple
 * accents) while keeping our own non-clinical, general-population copy.
 */
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopBar } from "@/components/shared/top-bar";
import { CareCircleIllustration } from "@/components/shared/care-circle-illustration";
import { ChatWidget } from "@/components/shared/chat-widget";
import { SiteFooter } from "@/components/shared/site-footer";

export default async function LandingPage() {
  const t = await getTranslations("landing");

  const values = [
    {
      title: t("value1Title"),
      body: t("value1Body"),
      icon: Users,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      title: t("value2Title"),
      body: t("value2Body"),
      icon: HeartHandshake,
      colorClass: "bg-success/10 text-success",
    },
    {
      title: t("value3Title"),
      body: t("value3Body"),
      icon: ShieldCheck,
      colorClass: "bg-chart-3/15 text-chart-3",
    },
    {
      title: t("value4Title"),
      body: t("value4Body"),
      icon: Sparkles,
      colorClass: "bg-chart-4/15 text-chart-4",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <main className="flex-1">
        <section>
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-0 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
            <div>
              <div className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">
                {t("eyebrow")}
              </div>
              <h1 className="text-foreground font-serif text-4xl leading-[1.12] font-medium text-balance sm:text-5xl">
                {t("heroHeadline")}
              </h1>
            </div>

            <div className="mx-auto w-full max-w-[300px] justify-self-center">
              <CareCircleIllustration />
            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="relative aspect-[16/8] overflow-hidden rounded-2xl">
                <Image
                  src="/images/hero-group.jpg"
                  alt={t("imageLabel")}
                  fill
                  priority
                  sizes="(min-width: 1024px) 1152px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="bg-card absolute bottom-6 start-6 max-w-sm rounded-2xl p-5 shadow-lg">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  &ldquo;{t("testimonialQuote")}&rdquo;
                  <span className="text-primary mt-2 block font-semibold">
                    {t("testimonialAttribution")}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-primary mt-6 flex flex-wrap items-center justify-between gap-8 rounded-2xl px-8 py-8 sm:px-10">
              <p className="text-primary-foreground max-w-xl text-lg font-medium text-balance">
                {t("ctaBarBody")}
              </p>
              <div className="flex flex-shrink-0 gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  className="text-primary bg-primary-foreground hover:bg-primary-foreground/90"
                  nativeButton={false}
                  render={<Link href="/contact">{t("letsTalk")}</Link>}
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                  nativeButton={false}
                  render={<Link href="/login">{t("getStarted")}</Link>}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-border mt-20 border-t">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-foreground text-center font-serif text-3xl font-medium tracking-tight">
              {t("aboutTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
              {t("aboutBody")}
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <Card key={value.title} className="border-border/80">
                  <CardHeader>
                    <div
                      className={`mb-2 flex size-10 items-center justify-center rounded-full ${value.colorClass}`}
                    >
                      <value.icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{value.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="from-primary to-primary/80 relative overflow-hidden bg-gradient-to-br">
          <div
            aria-hidden
            className="bg-success/20 absolute top-[-4rem] start-[-4rem] size-64 rounded-full blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-primary-foreground font-serif text-2xl font-medium tracking-tight text-balance sm:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="text-primary-foreground/85 mx-auto mt-4 max-w-xl text-balance">
              {t("ctaBody")}
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/contact">{t("letsTalk")}</Link>}
              />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <ChatWidget />
    </div>
  );
}
