# --- Base ---
FROM oven/bun:1 AS base
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile

# --- Build Web ---
FROM base AS build-web
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && bunx next build

# --- API Runtime ---
FROM base AS api
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY package.json ./
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]

# --- Web Runtime ---
FROM base AS web
COPY --from=build-web /app/apps/web/.next/standalone ./
COPY --from=build-web /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build-web /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["bun", "apps/web/server.js"]
