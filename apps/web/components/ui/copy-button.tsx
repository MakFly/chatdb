"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className ?? "absolute right-2 top-2 size-7 text-zinc-500 hover:text-zinc-300"}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
    </Button>
  )
}
