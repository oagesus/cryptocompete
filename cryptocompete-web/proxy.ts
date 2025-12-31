import type { NextRequest } from "next/server";
import { handleAuthRedirects } from "./lib/proxy/redirects";
import { handleTokenRefresh } from "./lib/auth/refresh";

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await handleTokenRefresh(request);

  const redirect = handleAuthRedirects(request, isAuthenticated);
  if (redirect) return redirect;

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};