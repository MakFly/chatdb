"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

function OrSeparator() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <hr className="flex-1 border-border" />
      <span>ou</span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

export default function LoginPage() {
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
        setError(authError.message || "Identifiants invalides");
        return;
      }

      router.push("/c");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Connexion</CardTitle>
        <CardDescription>Accédez à votre espace ChatDB</CardDescription>
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

        <OrSeparator />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground cursor-not-allowed opacity-50">
              Mot de passe oublié ?
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            Se connecter
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <a href="/register" className="text-primary underline underline-offset-4">
            S&apos;inscrire
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
