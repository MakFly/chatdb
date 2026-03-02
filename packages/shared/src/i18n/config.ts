export const locales = ["fr", "en", "ja"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
