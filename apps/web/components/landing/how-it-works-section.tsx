const steps = [
  {
    number: 1,
    title: "Créez un compte",
    description: "Inscription gratuite en quelques secondes.",
  },
  {
    number: 2,
    title: "Connectez votre base",
    description: "PostgreSQL, MySQL, SQLite, MariaDB — ajoutez votre connexion.",
  },
  {
    number: 3,
    title: "Posez vos questions",
    description: "L'IA traduit et exécute vos requêtes en temps réel.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Comment ça marche
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
