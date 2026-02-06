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

export interface TradeSnapshot {
  snapshotTs: number
  bestBid: number
  bestAsk: number
  mid: number
  spreadPct: number
  stale?: boolean
}

export interface Trade {
  id?: number
  datetime: number
  side: TradeSide
  price: number
  amountUSDT: number
  feeUAH?: number
  comment: string
  snapshot: TradeSnapshot
}

export interface DerivedTrade extends Trade {
  notionalUAH: number
  slippageUAH?: number
  slippagePct?: number
  feeImpactUAH?: number
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

export interface Settings {
  id?: number
  startCapital: number
  targetProfit?: number
  expectedProfitPerCycle?: number
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

export interface FeeSummary {
  totalFeesUAH: number
  totalSlippageUAH: number
  averageSlippagePct: number
}

export interface CycleAnalysis {
  avgProfitPerCycle: number
  cyclesLeft: number
  txLeft: number
}

// ==================== Draft Trade ====================

export interface DraftTrade {
  side: TradeSide
  price: number
  datetime: number
  comment: string
  snapshot: TradeSnapshot
}
