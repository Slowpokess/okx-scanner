# OKX P2P UAH/USDT Scanner + Journal

Fully functional web application for scanning OKX P2P offers and tracking trades with detailed analytics.

## Features

### Scanner (`/`)
- Real-time OKX P2P offer scanning for UAH/USDT
- Auto-refresh with configurable intervals (20s, 1m, 5m)
- Anti-ban protection with jitter and rate limiting
- Top-10 buy and sell offers with merchant details
- Market analysis with spread calculation
- Save snapshots to IndexedDB
- Create trades directly from offers with pre-filled data

### Journal (`/journal`)
- Trade tracking with full details (price, amount, fees, comments)
- Automatic balance calculation (UAH and USDT)
- Equity curve and PnL charts (Recharts)
- Slippage and fees breakdown per trade
- FIFO cycle analysis for profit calculations
- Goal calculator with progress tracking
- Export/Import (JSON and CSV)
- Start capital and target profit settings

## Project Structure

```
okx-p2p-scanner/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── okx/
│   │   │       ├── p2p/
│   │   │       │   └── route.ts       # P2P offers endpoint
│   │   │       └── summary/
│   │   │           └── route.ts       # Summary endpoint
│   │   ├── journal/
│   │   │   └── page.tsx              # Journal page
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Scanner page
│   ├── components/
│   │   ├── scanner/
│   │   │   ├── ScannerHeader.tsx     # Auto-refresh controls
│   │   │   ├── SummaryCards.tsx      # Price/spread cards
│   │   │   └── OfferTable.tsx        # Offers table
│   │   ├── journal/
│   │   │   ├── TradeForm.tsx         # Add trade form
│   │   │   ├── TradesTable.tsx       # Trades list
│   │   │   ├── BalancesCard.tsx      # Balance summary
│   │   │   ├── EquityChart.tsx       # Charts
│   │   │   ├── SettingsPanel.tsx     # Settings & export
│   │   │   └── GoalCalculator.tsx    # Goal tracking
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Loading.tsx
│   │   ├── Toast.tsx
│   │   └── Tooltip.tsx
│   └── lib/
│       ├── calculations.ts           # All calculations
│       ├── db.ts                     # Dexie database
│       ├── draft.ts                  # Draft trade storage
│       ├── okx.ts                    # OKX API client
│       ├── storage.ts                # IndexedDB wrapper
│       └── types.ts                  # TypeScript types
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Installation

```bash
# Install dependencies
npm install
```

## Local Development

```bash
# Run on port 3111
npm run dev
```

Open [http://localhost:3111](http://localhost:3111) in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel will automatically detect Next.js
4. Deploy - no configuration needed

The app uses Edge Runtime for API routes, so it works seamlessly on Vercel.

## API Routes

### GET `/api/okx/p2p?side=buy|sell&fiat=UAH&crypto=USDT&limit=10`

Returns P2P offers with caching and anti-ban protection.

### GET `/api/okx/summary?fiat=UAH&crypto=USDT&limit=10`

Returns market summary with best bid/ask, spread, and top offers.

## Data Sources

By default the app tries OKX first, and can optionally fall back to P2P.Army if you provide an API key.

Environment variables:
- `P2P_SOURCE`: `auto` (default), `okx`, or `p2parmy`
- `P2P_ARMY_API_KEY`: API key for P2P.Army fallback
- `P2P_ARMY_BASE_URL`: Optional override (default `https://p2p.army/v1/api`)
- `OKX_BASE_URLS`: Comma-separated list (default `https://www.okx.com,https://okx.com`)

## Anti-Ban Features

- **Rate Limiting**: Max 1 request per 3 seconds per query
- **Server Cache**: 10-second in-memory cache
- **Circuit Breaker**: Opens after 5 consecutive errors (60s timeout)
- **Stale Fallback**: Returns cached data on errors with `stale: true`
- **Client Jitter**: Random 100-600ms delay on auto-refresh

## Data Storage

- **IndexedDB** (via Dexie): trades, snapshots, settings
- **SessionStorage**: draft trades for quick journal entry
- All data stays in your browser - no backend needed

## Tech Stack

- **Next.js 14** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Dark terminal theme
- **Dexie** - IndexedDB wrapper
- **Recharts** - Charts
- **Lucide React** - Icons

## License

MIT
