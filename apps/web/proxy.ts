import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("better-auth.session_token");

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/c", "/c/:path*", "/docs/:path*", "/help/:path*", "/settings"],
};
