import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/c", "/docs", "/help", "/settings"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = pathname.replace(/^\/(fr|en|ja)/, "") || "/";

  const isProtected = protectedPrefixes.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  if (isProtected) {
    const sessionToken = request.cookies.get("better-auth.session_token");
    if (!sessionToken) {
      const locale = pathname.match(/^\/(fr|en|ja)/)?.[1] || "fr";
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url), 307);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
