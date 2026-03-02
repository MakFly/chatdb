"use client"

import { Button } from "@/components/ui/button"

export default function ChatError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Quelque chose s'est mal passé</h1>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  )
}
