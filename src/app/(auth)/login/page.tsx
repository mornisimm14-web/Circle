/**
 * Shared login screen for every role (Member/Partner/Lead/Admin). Submits
 * to loginAction (Auth.js Credentials); on success proxy.ts redirects to
 * the signed-in user's role home. On failure, Auth.js redirects back
 * here with ?error=CredentialsSignin, which we render as a message.
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/server/actions/login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("login");
  const { error } = await searchParams;

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
          <form action={loginAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-center text-xs">
                {t("invalidCredentials")}
              </p>
            )}
            <Button type="submit" className="mt-2">
              {t("submit")}
            </Button>
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
