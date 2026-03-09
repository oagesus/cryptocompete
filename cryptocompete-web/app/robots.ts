import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/account/", "/upgrade/", "/auth/change-", "/auth/set-password", "/auth/check-email", "/auth/verify"],
    },
    sitemap: "https://cryptocompete.net/sitemap.xml",
  };
}
