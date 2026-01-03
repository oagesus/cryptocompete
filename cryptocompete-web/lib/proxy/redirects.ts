import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BYPASS_ROUTES = ["/auth/clear"];
const PUBLIC_ROUTES = ["/auth"];
const PROTECTED_ROUTES = ["/dashboard", "/account"];

export function handleAuthRedirects(
  request: NextRequest,
  isAuthenticated: boolean
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (BYPASS_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return null;
}