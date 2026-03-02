"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";
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
import { DevAutofill } from "@/components/auth/dev-autofill";

function OrSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <hr className="flex-1 border-border" />
      <span>{label}</span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || t("login.invalidCredentials"));
        return;
      }

      router.push("/c");
    } catch {
      setError(t("login.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {process.env.NODE_ENV === "development" && (
          <DevAutofill
            onSelect={(email, password) => {
              setEmail(email);
              setPassword(password);
            }}
          />
        )}

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
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("login.password")}</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground cursor-not-allowed opacity-50">
              {t("login.forgotPassword")}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            {t("login.submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="text-primary underline underline-offset-4">
            {t("login.register")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
