"use client"

import * as React from "react"
import { ChevronRight, Database, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface GetSchemaOutput {
  tableCount: number
  tables: string[]
  columnCount: number
  columns: Array<{
    table_name: string
    column_name: string
    data_type: string
    is_nullable: string
    column_default: string | null
  }>
}

export function SchemaDisplay({ output }: { output: GetSchemaOutput }) {
  const [search, setSearch] = React.useState("")
  const [expandedTables, setExpandedTables] = React.useState<Set<string>>(
    new Set()
  )

  const grouped = React.useMemo(() => {
    const map: Record<string, GetSchemaOutput["columns"]> = {}
    for (const col of output.columns) {
      if (!map[col.table_name]) map[col.table_name] = []
      map[col.table_name].push(col)
    }
    return map
  }, [output.columns])

  const filteredTables = React.useMemo(() => {
    if (!search.trim()) return output.tables
    const q = search.toLowerCase()
    return output.tables.filter((t) => t.toLowerCase().includes(q))
  }, [output.tables, search])

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(tableName)) {
        next.delete(tableName)
      } else {
        next.add(tableName)
      }
      return next
    })
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {output.tableCount} table{output.tableCount !== 1 ? "s" : ""},{" "}
        {output.columnCount} colonne{output.columnCount !== 1 ? "s" : ""}
      </span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Database className="size-3.5" />
            Voir schéma DB
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Schéma de la base de données</DialogTitle>
            <DialogDescription>
              {output.tableCount} table{output.tableCount !== 1 ? "s" : ""},{" "}
              {output.columnCount} colonne{output.columnCount !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="overflow-auto flex-1 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Table</TableHead>
                  <TableHead className="w-24 text-right">Colonnes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((tableName) => {
                  const cols = grouped[tableName] ?? []
                  const isExpanded = expandedTables.has(tableName)
                  return (
                    <React.Fragment key={tableName}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleTable(tableName)}
                      >
                        <TableCell className="px-2">
                          <ChevronRight
                            className={`size-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tableName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {cols.length}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={3} className="bg-muted/30 p-0">
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-0 text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="px-4 py-1.5 text-left font-medium text-muted-foreground">
                                    Colonne
                                  </th>
                                  <th className="px-4 py-1.5 text-left font-medium text-muted-foreground">
                                    Type
                                  </th>
                                  <th className="px-4 py-1.5 text-left font-medium text-muted-foreground">
                                    Nullable
                                  </th>
                                  <th className="hidden sm:table-cell px-4 py-1.5 text-left font-medium text-muted-foreground">
                                    Défaut
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {cols.map((col, i) => (
                                  <tr
                                    key={col.column_name}
                                    className={
                                      i % 2 === 1 ? "bg-muted/20" : undefined
                                    }
                                  >
                                    <td className="px-4 py-1 font-mono">
                                      {col.column_name}
                                    </td>
                                    <td className="px-4 py-1 text-muted-foreground">
                                      {col.data_type}
                                    </td>
                                    <td className="px-4 py-1">
                                      {col.is_nullable === "YES"
                                        ? "oui"
                                        : "non"}
                                    </td>
                                    <td className="hidden sm:table-cell px-4 py-1 font-mono break-all">
                                      {col.column_default ?? "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredTables.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucune table trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
