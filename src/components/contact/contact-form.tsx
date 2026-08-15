"use client";

/**
 * Client-side-only contact form: on submit it swaps to a confirmation
 * card. No backend yet — nothing is actually sent. Wire this to a real
 * submission handler (Server Action or API route) once one exists.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const t = useTranslations("contact");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card className="bg-success/10 border-success/20">
        <CardContent className="py-10 text-center">
          <div className="text-success text-lg font-semibold">{t("thankYouTitle")}</div>
          <p className="text-success/80 mt-2 text-sm">{t("thankYouBody")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="sr-only">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input id="name" name="name" placeholder={t("namePlaceholder")} autoComplete="name" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="org">{t("orgLabel")}</Label>
            <Input id="org" name="org" placeholder={t("orgPlaceholder")} autoComplete="organization" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="message">{t("messageLabel")}</Label>
            <textarea
              id="message"
              name="message"
              placeholder={t("messagePlaceholder")}
              rows={5}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border px-3 py-2 text-sm focus-visible:ring-3 focus-visible:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
            <p className="text-muted-foreground mt-4 text-center text-xs">
              {t("directTitle")}{" "}
              <a
                href={`mailto:${t("directEmail")}`}
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t("directEmail")}
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
