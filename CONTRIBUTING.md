# Contributing to ChatDB

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/chatdb.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feat/your-feature`

## Development

```bash
bun run dev          # Start all services
bun run dev:web      # Frontend only
bun run dev:api      # Backend only
```

## Conventions

- **Package manager**: Bun only (`bun`, `bunx`, `bun add`)
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Database migrations**: `bunx drizzle-kit generate` then `bunx drizzle-kit migrate`

## Pull Requests

1. Ensure your code builds: `cd apps/web && bunx next build`
2. Write clear commit messages
3. Open a PR against `main` with a description of your changes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
