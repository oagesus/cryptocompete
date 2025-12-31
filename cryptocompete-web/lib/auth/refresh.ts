import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.API_URL;

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

interface TokenRefreshResult {
  response: NextResponse;
  isAuthenticated: boolean;
}

export async function handleTokenRefresh(request: NextRequest): Promise<TokenRefreshResult> {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return { response: NextResponse.next(), isAuthenticated: false };
  }

  if (accessToken && !isTokenExpired(accessToken)) {
    return { response: NextResponse.next(), isAuthenticated: true };
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
      return { response, isAuthenticated: false };
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

    return { response, isAuthenticated: true };
  } catch {
    return { response: NextResponse.next(), isAuthenticated: false };
  }
}