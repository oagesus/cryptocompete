<h1 align="center">
  <a href="https://cryptocompete.net"><img src="cryptocompete-web/app/icon.svg" alt="CryptoCompete Logo" width="120" height="120" /></a>
  <br>
  CryptoCompete
</h1>

<p align="center">
  <strong>The ultimate crypto trading simulator for competitive traders</strong>
</p>

<p align="center">
  <a href="https://cryptocompete.net">Website</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="LICENSE">MIT License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/.NET-10-purple" alt=".NET 10" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-latest-336791" alt="PostgreSQL" />
</p>

---

CryptoCompete is an open-source cryptocurrency trading simulator where each user starts with **€10,000 in virtual funds** to trade real cryptocurrencies at live market prices. Build your portfolio, sharpen your strategies, and compete against traders worldwide on a global leaderboard — all without any financial risk.

> **Try it live at [cryptocompete.net](https://cryptocompete.net)**

## Features

- **Risk-Free Trading** — Start with €10,000 in virtual funds and trade real cryptocurrencies without financial risk.
- **Live Prices** — Real-time price updates so you always trade at current market rates.
- **Price History Charts** — Analyze interactive historical charts to spot trends and refine your strategy.
- **Price Alarms** — Set target prices and get notified by email when they're hit.
- **Global Leaderboard** — Compete against traders worldwide and climb the rankings.
- **Portfolio Analytics** — Track holdings, profit/loss, and overall performance at a glance.
- **Google Sign-In** — Log in with your Google account or register with email and password.

## Tech Stack

### Frontend

| Technology | Purpose |
|:-----------|:--------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) + [tweakcn](https://tweakcn.com/) | UI components, theming, and charts |
| [next-intl](https://next-intl.dev/) | Internationalization (en-US, de-DE) |

### Backend

| Technology | Purpose |
|:-----------|:--------|
| [ASP.NET Core 10](https://dotnet.microsoft.com/) | Web API framework |
| [Entity Framework Core 10](https://learn.microsoft.com/ef/core/) | ORM and data access |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [SignalR](https://learn.microsoft.com/aspnet/core/signalr/) | Real-time WebSocket communication |
| [JWT](https://jwt.io/) | Token-based authentication |
| [BCrypt](https://github.com/BcryptNet/bcrypt.net) | Password hashing |

### External Services

| Service | Purpose |
|:--------|:--------|
| [Binance API](https://developers.binance.com/) | Live prices and historical price charts |
| [CoinMarketCap API](https://coinmarketcap.com/api/) | Market cap and price change stats |
| [Frankfurter API](https://www.frankfurter.app/) | Currency exchange rates |
| [Google OAuth](https://developers.google.com/identity) | Google Sign-In |
| [PayPal](https://developer.paypal.com/) | Subscription billing |
| [Resend](https://resend.com/) | Transactional emails |

## Architecture

CryptoCompete follows a monorepo structure with a clear separation between the frontend and backend.

```
CryptoCompete/
├── cryptocompete-web/              # Next.js frontend
│   ├── app/                        # App Router pages & API routes
│   │   ├── auth/                   #   Authentication (login, register, etc.)
│   │   ├── dashboard/              #   Portfolio dashboard
│   │   ├── trade/                  #   Buy, sell & price alarms
│   │   ├── leaderboard/            #   Global rankings
│   │   └── account/                #   Settings, billing, profiles
│   ├── components/                 # React components & UI primitives
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utilities (auth, crypto, currency, etc.)
│   ├── messages/                   # i18n translation files
│   └── providers/                  # React context providers
│
└── cryptocompete-api/              # ASP.NET Core backend
    ├── Controllers/                # REST API endpoints
    ├── Services/                   # Business logic & background services
    ├── Models/                     # EF Core entity models
    ├── Hubs/                       # SignalR hubs (real-time prices)
    ├── Data/                       # Database context & configuration
    └── Migrations/                 # EF Core database migrations
```

## License

[MIT](LICENSE)
