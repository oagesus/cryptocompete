import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:5000";

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000 - 10000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.next();
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  try {
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!refreshResponse.ok) {
      const response = NextResponse.next();
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    const setCookieHeaders = refreshResponse.headers.getSetCookie();
    const response = NextResponse.next();
    
    for (const cookie of setCookieHeaders) {
      const [cookiePart] = cookie.split(";");
      const [name, value] = cookiePart.split("=");
      
      if (name === "access_token" || name === "refresh_token") {
        response.cookies.set({
          name,
          value: decodeURIComponent(value),
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: name === "access_token" ? 300 : 2592000,
        });
      }

      if (name === "token_exp") {
        response.cookies.set({
          name,
          value: decodeURIComponent(value),
          httpOnly: false,
          sameSite: "lax",
          path: "/",
          maxAge: 300,
        });
      }
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};