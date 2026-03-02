"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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

function OrSeparator() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <hr className="flex-1 border-border" />
      <span>ou</span>
      <hr className="flex-1 border-border" />
    </div>
  );
}

export default function RegisterPage() {
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
        setError(authError.message || "Échec de l'inscription");
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
        <CardTitle className="text-xl">Créer un compte</CardTitle>
        <CardDescription>Commencez à interroger vos données</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              type="text"
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Min. 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            Créer mon compte
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <a href="/login" className="text-primary underline underline-offset-4">
            Se connecter
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
