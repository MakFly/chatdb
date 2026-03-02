import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <Button asChild>
        <Link href="/">Retour à l'accueil</Link>
      </Button>
    </div>
  )
}
