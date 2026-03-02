import { Bot, Check } from "lucide-react";

const features = [
  "Interrogez vos données en SQL naturel",
  "Connectez PostgreSQL, MySQL, SQLite",
  "Historique et partage de vos requêtes",
  "Sécurité et confidentialité garanties",
];

function AuthBranding() {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background p-10">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-5" />
        </div>
        <span className="text-xl font-bold">ChatDB</span>
      </div>

      <div className="space-y-6">
        <blockquote className="text-2xl font-semibold leading-snug">
          &ldquo;Interrogez vos bases de données en langage naturel.&rdquo;
        </blockquote>

        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm">
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/20">
                <Check className="size-3 text-primary" />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} ChatDB. Tous droits réservés.
      </p>
    </div>
  );
}

export { AuthBranding };
