/**
 * Shared login screen for every role (Member/Partner/Lead/Admin). In
 * Sprint 0 this is a static form only — no auth wiring yet. Sprint 1
 * connects it to Auth.js and adds the role-based redirect via proxy.ts.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage() {
  const t = await getTranslations("login");

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
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled className="mt-2">
              {t("submit")}
            </Button>
            <p className="text-muted-foreground text-center text-xs">{t("comingSoon")}</p>
            <p className="text-muted-foreground text-center text-xs">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                {t("signUp")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground fixed start-6 top-6 text-sm underline-offset-4 hover:underline"
      >
        &larr; {t("backToHome")}
      </Link>
    </div>
  );
}
