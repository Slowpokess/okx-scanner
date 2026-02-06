// ==================== OKX API Types ====================

export type Side = 'buy' | 'sell'

export interface OKXOffer {
  price: number
  minLimit: number
  maxLimit: number
  available: number
  paymentMethods: string[]
  merchantName: string
  merchantOrders?: number
  merchantCompletionRate?: number
  terms?: string
}

export interface OKXResponse {
  side: Side
  fiat: string
  crypto: string
  items: OKXOffer[]
  ts: number
  stale?: boolean
  source?: string
}

export interface SummaryResponse {
  ts: number
  fiat: string
  crypto: string
  bestAsk: number
  bestBid: number
  mid: number
  spreadPct: number
  buyTop10: OKXOffer[]
  sellTop10: OKXOffer[]
  stale?: boolean
}

// ==================== Journal Types ====================

export type TradeSide = 'BUY' | 'SELL'

export interface Trade {
  id?: number
  datetime: number
  side: TradeSide
  amountUSDT: number
  price: number  // Курс UAH/USDT
  notes?: string
}

export interface DerivedTrade extends Trade {
  notionalUAH: number
  cumulativePnL?: number
}

export interface SnapshotData {
  id?: number
  ts: number
  bestAsk: number
  bestBid: number
  mid: number
  spreadPct: number
  buyTop10: OKXOffer[]
  sellTop10: OKXOffer[]
}

export type Currency = 'UAH' | 'USDT'

export interface Settings {
  id?: number
  startCapitalUAH: number
  startCapitalUSDT: number
  targetProfit?: number
}

export interface Balances {
  uah: number
  usdt: number
}

export interface EquityResult {
  equity: number
  profit: number
  currentMid: number
}

export interface TransactionSummary {
  totalBuyUSDT: number
  totalSellUSDT: number
  totalBuyUAH: number
  totalSellUAH: number
  profitUSDT: number
  profitUAH: number
  averageBuyPrice: number
  averageSellPrice: number
  averageSpread: number
  transactionCount: number
}
