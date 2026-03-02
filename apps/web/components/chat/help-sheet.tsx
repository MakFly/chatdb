"use client";

import { HelpCircle, Database, MessageSquare, Keyboard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function HelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <HelpCircle className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Aide ChatDB</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 pt-4">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Database className="size-4" />
              Ce que ChatDB peut faire
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Interroger des bases de donnees</li>
              <li>Explorer les schemas</li>
              <li>Analyser les donnees</li>
              <li>Ecrire du SQL</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="size-4" />
              Exemples de questions
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>&laquo; Montre-moi le schema de ma base &raquo;</li>
              <li>&laquo; Quels sont les 10 meilleurs produits par revenu ? &raquo;</li>
              <li>&laquo; Trouve les utilisateurs inscrits la semaine derniere &raquo;</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Keyboard className="size-4" />
              Raccourcis
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Envoyer</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Nouvelle ligne</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Shift+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Arreter</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Escape</kbd>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4" />
              Limitations
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>SELECT uniquement</li>
              <li>Maximum 500 lignes</li>
              <li>Pas de DDL (CREATE, ALTER, DROP)</li>
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
