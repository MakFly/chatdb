import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  { criteria: "Open-source", chatdb: true, alternatives: false },
  { criteria: "Self-hosted", chatdb: true, alternatives: false },
  { criteria: "Multi-LLM", chatdb: true, alternatives: false },
  { criteria: "Multi-DB", chatdb: true, alternatives: false },
  { criteria: "RBAC", chatdb: true, alternatives: true },
  { criteria: "Données chez vous", chatdb: true, alternatives: false },
];

export function ComparisonSection() {
  return (
    <section id="comparatif" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Pourquoi ChatDB ?
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Critère</TableHead>
              <TableHead className="text-center">ChatDB</TableHead>
              <TableHead className="text-center">Alternatives SaaS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.criteria}>
                <TableCell className="font-medium">{row.criteria}</TableCell>
                <TableCell className="text-center">
                  {row.chatdb ? (
                    <Check className="mx-auto size-4 text-green-500" />
                  ) : (
                    <X className="mx-auto size-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {row.alternatives ? (
                    <Check className="mx-auto size-4 text-green-500" />
                  ) : (
                    <X className="mx-auto size-4 text-muted-foreground" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
