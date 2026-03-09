import type { MetadataRoute } from "next";

const BASE_URL = "https://cryptocompete.net";
const API_URL = process.env.API_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/trade`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/trade/buy`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/leaderboard`,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/trade/notify`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/auth/login`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/auth/register`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/auth/forgot-password`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/imprint`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  let cryptoRoutes: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${API_URL}/api/cryptocurrencies/all`, {
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      cryptoRoutes = data.cryptocurrencies.map(
        (crypto: { symbol: string }) => ({
          url: `${BASE_URL}/trade/buy/${crypto.symbol.toLowerCase()}`,
          changeFrequency: "daily" as const,
          priority: 0.7,
        })
      );
    }
  } catch {}

  return [...staticRoutes, ...cryptoRoutes];
}
