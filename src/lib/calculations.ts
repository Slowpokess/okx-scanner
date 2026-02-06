import type {
  Trade,
  DerivedTrade,
  Balances,
  EquityResult,
  Settings,
  TransactionSummary,
} from './types'

// ==================== Trade Calculations ====================

export function calculateNotional(trade: Trade): number {
  return trade.price * trade.amountUSDT
}

export function deriveTrade(trade: Trade): DerivedTrade {
  const notionalUAH = calculateNotional(trade)
  return {
    ...trade,
    notionalUAH,
  }
}

export function deriveTradesWithPnL(
  trades: Trade[],
  settings: Settings | null,
  currentMid: number
): DerivedTrade[] {
  const startCapitalInUAH = (settings?.startCapitalUAH || 0) +
    (settings?.startCapitalUSDT || 0) * currentMid

  let uah = settings?.startCapitalUAH || 0
  let usdt = settings?.startCapitalUSDT || 0

  return trades.map((trade) => {
    const notional = calculateNotional(trade)

    if (trade.side === 'BUY') {
      uah -= notional
      usdt += trade.amountUSDT
    } else {
      uah += notional
      usdt -= trade.amountUSDT
    }

    const equity = uah + usdt * currentMid
    const cumulativePnL = equity - startCapitalInUAH

    return {
      ...trade,
      notionalUAH: notional,
      cumulativePnL,
    }
  })
}

// ==================== Balance Calculations ====================

export function calculateBalances(
  trades: Trade[],
  settings: Settings | null,
  currentMid: number
): Balances {
  const startUAH = settings?.startCapitalUAH || 0
  const startUSDT = settings?.startCapitalUSDT || 0

  let uah = startUAH
  let usdt = startUSDT

  for (const trade of trades) {
    const notional = calculateNotional(trade)

    if (trade.side === 'BUY') {
      // Покупка USDT за UAH: -UAH, +USDT
      uah -= notional
      usdt += trade.amountUSDT
    } else {
      // Продажа USDT за UAH: +UAH, -USDT
      uah += notional
      usdt -= trade.amountUSDT
    }
  }

  return { uah, usdt }
}

// ==================== Equity Calculations ====================

export function calculateEquity(
  trades: Trade[],
  settings: Settings | null,
  currentMid: number
): EquityResult {
  const { uah, usdt } = calculateBalances(trades, settings, currentMid)

  const startCapitalInUAH = (settings?.startCapitalUAH || 0) +
    (settings?.startCapitalUSDT || 0) * currentMid

  const equity = uah + usdt * currentMid
  const profit = equity - startCapitalInUAH

  return { equity, profit, currentMid }
}

// ==================== Transaction Summary ====================

export function calculateTransactionSummary(trades: Trade[]): TransactionSummary {
  const buyTrades = trades.filter((t) => t.side === 'BUY')
  const sellTrades = trades.filter((t) => t.side === 'SELL')

  const totalBuyUSDT = buyTrades.reduce((sum, t) => sum + t.amountUSDT, 0)
  const totalSellUSDT = sellTrades.reduce((sum, t) => sum + t.amountUSDT, 0)

  const totalBuyUAH = buyTrades.reduce((sum, t) => sum + calculateNotional(t), 0)
  const totalSellUAH = sellTrades.reduce((sum, t) => sum + calculateNotional(t), 0)

  // Средние цены
  const averageBuyPrice = totalBuyUSDT > 0 ? totalBuyUAH / totalBuyUSDT : 0
  const averageSellPrice = totalSellUSDT > 0 ? totalSellUAH / totalSellUSDT : 0

  // Прибыль: разница между продажей и покупкой в USDT
  const profitUSDT = totalSellUSDT - totalBuyUSDT

  // Прибыль в UAH
  const profitUAH = totalSellUAH - totalBuyUAH

  // Средний спред
  const averageSpread = averageBuyPrice > 0 && averageSellPrice > 0
    ? ((averageSellPrice - averageBuyPrice) / averageBuyPrice) * 100
    : 0

  return {
    totalBuyUSDT,
    totalSellUSDT,
    totalBuyUAH,
    totalSellUAH,
    profitUSDT,
    profitUAH,
    averageBuyPrice,
    averageSellPrice,
    averageSpread,
    transactionCount: trades.length,
  }
}
