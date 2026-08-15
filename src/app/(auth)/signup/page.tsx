/**
 * Account creation screen, reached from the landing page's "Sign up"
 * button. Sprint 0: static form only, not wired to auth/DB yet — the
 * real RBAC-aware account creation flow lands alongside Auth.js.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignupPage() {
  const t = await getTranslations("signup");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-primary font-serif text-2xl font-semibold tracking-wide">
            {t("title")}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input id="name" name="name" placeholder={t("namePlaceholder")} autoComplete="name" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="org">{t("orgLabel")}</Label>
              <Input id="org" name="org" placeholder={t("orgPlaceholder")} autoComplete="organization" />
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled className="mt-2">
              {t("submit")}
            </Button>
            <p className="text-muted-foreground text-center text-xs">{t("comingSoon")}</p>
            <p className="text-muted-foreground text-center text-xs">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                {t("signIn")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground fixed top-6 start-6 text-sm underline-offset-4 hover:underline"
      >
        &larr; {t("backToHome")}
      </Link>
    </div>
  );
}
