import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "@chat-assistant/shared/i18n/config";

export const routing = defineRouting({ locales, defaultLocale });
