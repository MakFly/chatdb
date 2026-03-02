"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.generic");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
