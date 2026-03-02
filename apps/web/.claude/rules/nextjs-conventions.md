# Next.js Conventions — Chat Assistant Web

## Auth Guard
- Use `proxy.ts` (Next.js middleware) for auth redirects, NOT client-side guards
- Check `better-auth.session_token` cookie

## State Management
- **Zustand** for app state (never React Context for app state)
- React Context only for UI library state (SidebarProvider, FormField, etc.)
- Stores in `lib/stores/`

## Rendering
- Server Components by default
- Server Components by default
- `"use client"` only for interactive leaf components
- Use `loading.tsx` for route-level loading skeletons

## Package Manager
- Only `bun`
