import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some((cookieName) =>
    request.cookies.has(cookieName),
  );

  if (hasSession) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/budgets/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/chat/:path*",
    "/api/expenses/:path*",
    "/api/budgets/:path*",
    "/api/reports/:path*",
    "/api/chat/:path*",
    "/api/settings/:path*",
  ],
};
