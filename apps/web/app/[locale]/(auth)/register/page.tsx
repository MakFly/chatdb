"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/password-input";
import { SocialButtons } from "@/components/auth/social-buttons";
import { AlertCircle } from "lucide-react";

function OrSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <hr className="flex-1 border-border" />
      <span>{label}</span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await signUp.email({
        name,
        email,
        password,
      });

      if (authError) {
        setError(authError.message || t("register.registrationFailed"));
        return;
      }

      router.push("/c");
    } catch {
      setError(t("register.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <SocialButtons />

        <OrSeparator label={t("or")} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("register.name")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("register.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("register.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("register.password")}</Label>
            <PasswordInput
              id="password"
              placeholder={t("register.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            {t("register.submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("register.hasAccount")}{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            {t("register.login")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
