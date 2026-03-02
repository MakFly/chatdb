"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@chat-assistant/shared/i18n/config";
import { Button } from "@/components/ui/button";

const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  ja: "🇯🇵",
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((l) => (
        <Button
          key={l}
          variant="ghost"
          size="sm"
          className={`px-2 text-sm ${l === locale ? "bg-accent" : "opacity-60 hover:opacity-100"}`}
          onClick={() => switchLocale(l)}
        >
          {LOCALE_FLAGS[l]}
        </Button>
      ))}
    </div>
  );
}
