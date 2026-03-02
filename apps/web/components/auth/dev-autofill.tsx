"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRound } from "lucide-react";

interface DevUser {
  id: string;
  name: string;
  email: string;
}

interface DevAutofillProps {
  onSelect: (email: string, password: string) => void;
}

const DEFAULT_PASSWORD = "password123";

export function DevAutofill({ onSelect }: DevAutofillProps) {
  const [users, setUsers] = React.useState<DevUser[]>([]);

  React.useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${apiUrl}/api/dev/users`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers)
      .catch(() => {});
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        onValueChange={(email) => {
          onSelect(email, DEFAULT_PASSWORD);
        }}
      >
        <SelectTrigger className="w-full text-muted-foreground">
          <UserRound className="size-4" />
          <SelectValue placeholder="Autofill (dev)" />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.email}>
              {u.name} — {u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
