# Drizzle ORM — Règles Projet

## Migrations OBLIGATOIRES

**JAMAIS utiliser `drizzle-kit push` en dehors du prototypage initial.**

Pour tout changement de schema (`apps/api/src/db/schema.ts`) :

1. `bunx drizzle-kit generate` — Générer la migration SQL
2. `bunx drizzle-kit migrate` — Appliquer la migration
3. Vérifier le fichier SQL généré dans `apps/api/drizzle/`

## Scripts

```bash
bun run db:generate   # Générer migration après modif schema
bun run db:migrate    # Appliquer les migrations
bun run db:seed       # Seeder (idempotent, avec truncate)
bun run db:reset      # Migrate + seed
bun run db:studio     # UI Drizzle Studio
```

## Seed

Le seeder DOIT être **idempotent** :
- Truncate les tables avant insertion (CASCADE)
- Peut être relancé sans erreur de doublons
- Utiliser `TRUNCATE ... CASCADE` pour respecter les FK

## Conventions

- UUIDs pour toutes les PKs (`uuid().defaultRandom()`)
- `created_at` / `updated_at` avec `timestamp().defaultNow()`
- FKs avec `onDelete` explicite (cascade, set null, etc.)
- Slugs uniques pour les entités de référence (roles, providers)
