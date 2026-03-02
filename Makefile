# ═══════════════════════════════════════════════════════════════════════════════
# Chat Assistant UI - Makefile
# ═══════════════════════════════════════════════════════════════════════════════

.DEFAULT_GOAL := help
SHELL := /bin/bash

# ─── Configuration ────────────────────────────────────────────────────────────
API_PORT ?= 3333
WEB_PORT ?= 3150
API_URL  ?= http://localhost:$(API_PORT)

.PHONY: help install dev dev-api dev-web clean
.PHONY: db-generate db-migrate db-push db-studio db-seed db-reset test test-api

# ═══════════════════════════════════════════════════════════════════════════════
# HELP
# ═══════════════════════════════════════════════════════════════════════════════

help: ## Afficher cette aide
	@printf "\n"
	@printf "\033[1;36m╔══════════════════════════════════════════════════════════════╗\033[0m\n"
	@printf "\033[1;36m║              Chat Assistant UI - Commandes                  ║\033[0m\n"
	@printf "\033[1;36m╚══════════════════════════════════════════════════════════════╝\033[0m\n"
	@printf "\n"
	@printf "\033[1m📦 Installation\033[0m\n"
	@printf "  \033[32m%-15s\033[0m %s\n" "install" "Installer les dépendances"
	@printf "  \033[32m%-15s\033[0m %s\n" "clean"   "Supprimer node_modules"
	@printf "\n"
	@printf "\033[1m🚀 Development\033[0m\n"
	@printf "  \033[32m%-15s\033[0m %s\n" "dev"      "Lancer API + Web en parallèle"
	@printf "  \033[32m%-15s\033[0m %s\n" "dev-api"  "Lancer uniquement l'API (port $(API_PORT))"
	@printf "  \033[32m%-15s\033[0m %s\n" "dev-web"  "Lancer uniquement le Web (port $(WEB_PORT))"
	@printf "\n"
	@printf "\033[1m🗄️  Base de données\033[0m\n"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-generate" "Générer les migrations (après modif schema)"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-migrate"  "Appliquer les migrations en DB"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-push"     "Push direct du schema (dev only)"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-studio"   "Ouvrir Drizzle Studio"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-seed"     "Peupler la base (données initiales)"
	@printf "  \033[32m%-15s\033[0m %s\n" "db-reset"    "Reset complet + seed"
	@printf "\n"
	@printf "\033[1m🧪 Tests\033[0m\n"
	@printf "  \033[32m%-15s\033[0m %s\n" "test"     "Lancer tous les tests"
	@printf "  \033[32m%-15s\033[0m %s\n" "test-api" "Tests de l'API"
	@printf "\n"
	@printf "\033[1m⚙️  Variables\033[0m\n"
	@printf "  \033[33m%-15s\033[0m %s\n" "API_PORT" "Port de l'API (défaut: 3333)"
	@printf "  \033[33m%-15s\033[0m %s\n" "WEB_PORT" "Port du Web (défaut: 3150)"
	@printf "\n"
	@printf "\033[1m💡 Exemples\033[0m\n"
	@printf "  \033[36mmake dev\033[0m\n"
	@printf "  \033[36mmake db-migrate && make db-seed\033[0m\n"
	@printf "  \033[36mAPI_PORT=3001 make dev\033[0m\n"
	@printf "\n"

# ═══════════════════════════════════════════════════════════════════════════════
# INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════════

install: ## Installer les dépendances
	@printf "\033[1;36m📦 Installation des dépendances...\033[0m\n"
	bun install
	@printf "\033[1;32m✓ Dépendances installées\033[0m\n"

clean: ## Supprimer node_modules
	@printf "\033[1;33m🧹 Nettoyage de node_modules...\033[0m\n"
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@printf "\033[1;32m✓ Nettoyage terminé\033[0m\n"

# ═══════════════════════════════════════════════════════════════════════════════
# DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════════════════

dev: ## Lancer API + Web en parallèle
	@printf "\033[1;36m🚀 Démarrage des serveurs\033[0m\n"
	@printf "  \033[35mAPI:\033[0m  http://localhost:$(API_PORT)\n"
	@printf "  \033[36mWeb:\033[0m  http://localhost:$(WEB_PORT)\n\n"
	@trap 'kill $$(jobs -p) 2>/dev/null; exit 0' INT TERM; \
		PORT=$(API_PORT) bun run --filter @chat-assistant/api dev 2>&1 | while IFS= read -r line; do printf "\033[35m[API]\033[0m %s\n" "$$line"; done & \
		PORT=$(WEB_PORT) NEXT_PUBLIC_API_URL=$(API_URL) bun run --filter @chat-assistant/web dev 2>&1 | while IFS= read -r line; do printf "\033[36m[WEB]\033[0m %s\n" "$$line"; done & \
		wait

dev-api: ## Lancer uniquement l'API
	@printf "\033[1;35m🔥 API sur le port $(API_PORT)\033[0m\n"
	PORT=$(API_PORT) bun run --filter @chat-assistant/api dev

dev-web: ## Lancer uniquement le Web
	@printf "\033[1;36m🌐 Web sur le port $(WEB_PORT)\033[0m\n"
	PORT=$(WEB_PORT) NEXT_PUBLIC_API_URL=$(API_URL) bun run --filter @chat-assistant/web dev

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

db-generate: ## Générer les migrations
	@printf "\033[1;36m📊 Génération des migrations...\033[0m\n"
	cd apps/api && bunx drizzle-kit generate
	@printf "\033[1;32m✓ Migrations générées\033[0m\n"

db-migrate: ## Appliquer les migrations
	@printf "\033[1;36m📊 Application des migrations...\033[0m\n"
	cd apps/api && bunx drizzle-kit migrate
	@printf "\033[1;32m✓ Migrations appliquées\033[0m\n"

db-push: ## Push direct du schema (dev only)
	@printf "\033[1;33m⚠️  Push du schema (sans migration)...\033[0m\n"
	cd apps/api && bunx drizzle-kit push
	@printf "\033[1;32m✓ Schema synchronisé\033[0m\n"

db-studio: ## Ouvrir Drizzle Studio
	@printf "\033[1;36m🔍 Ouverture de Drizzle Studio...\033[0m\n"
	cd apps/api && bunx drizzle-kit studio

db-seed: ## Peupler la base
	@printf "\033[1;36m🌱 Seeding de la base...\033[0m\n"
	bun run --filter @chat-assistant/api db:seed

db-reset: ## Reset complet + seed
	@printf "\033[1;33m⚠️  Reset de la base...\033[0m\n"
	bun run --filter @chat-assistant/api db:reset
	@printf "\033[1;32m✓ Base réinitialisée\033[0m\n"

# ═══════════════════════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════════════════════

test: ## Lancer tous les tests
	@printf "\033[1;36m🧪 Lancement des tests...\033[0m\n"
	bun run --filter '*' test

test-api: ## Tests de l'API
	@printf "\033[1;36m🧪 Tests de l'API...\033[0m\n"
	bun run --filter @chat-assistant/api test
