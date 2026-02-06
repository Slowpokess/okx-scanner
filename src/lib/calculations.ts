import type {
  Trade,
  DerivedTrade,
  Balances,
  EquityResult,
  FeeSummary,
  CycleAnalysis,
  Settings,
} from './types'

// ==================== Trade Calculations ====================

export function calculateNotional(trade: Trade): number {
  return trade.price * trade.amountUSDT
}

export function calculateSlippage(trade: Trade): {
  slippageUAH: number
  slippagePct: number
} | null {
  if (!trade.snapshot) {
    return null
  }

  const { price, amountUSDT, snapshot } = trade
  const { bestAsk, bestBid } = snapshot

  let slippageUAH = 0
  let slippagePct = 0

  if (trade.side === 'BUY') {
    slippageUAH = (price - bestAsk) * amountUSDT
    slippagePct = bestAsk > 0 ? ((price - bestAsk) / bestAsk) * 100 : 0
  } else {
    slippageUAH = (bestBid - price) * amountUSDT
    slippagePct = bestBid > 0 ? ((bestBid - price) / bestBid) * 100 : 0
  }

  return { slippageUAH, slippagePct }
}

export function deriveTrade(trade: Trade): DerivedTrade {
  const notionalUAH = calculateNotional(trade)
  const slippage = calculateSlippage(trade)
  const feeImpactUAH = trade.feeUAH || 0

  return {
    ...trade,
    notionalUAH,
    slippageUAH: slippage?.slippageUAH,
    slippagePct: slippage?.slippagePct,
    feeImpactUAH,
  }
}

// ==================== Balance Calculations ====================

export function calculateBalances(
  trades: Trade[],
  startCapital: number
): Balances {
  let uah = startCapital
  let usdt = 0

  for (const trade of trades) {
    const notional = calculateNotional(trade)
    const fee = trade.feeUAH || 0

    if (trade.side === 'BUY') {
      uah -= notional + fee
      usdt += trade.amountUSDT
    } else {
      uah += notional - fee
      usdt -= trade.amountUSDT
    }
  }

  return { uah, usdt }
}

// ==================== Equity Calculations ====================

export function calculateEquity(
  trades: Trade[],
  startCapital: number,
  currentMid: number
): EquityResult {
  const { uah, usdt } = calculateBalances(trades, startCapital)
  const equity = uah + usdt * currentMid
  const profit = equity - startCapital

  return { equity, profit, currentMid }
}

// ==================== Fee Summary ====================

export function calculateFeeSummary(trades: Trade[]): FeeSummary {
  let totalFeesUAH = 0
  let totalSlippageUAH = 0
  let totalSlippagePct = 0
  let validSlippageCount = 0

  for (const trade of trades) {
    totalFeesUAH += trade.feeUAH || 0

    const slippage = calculateSlippage(trade)
    if (slippage) {
      totalSlippageUAH += slippage.slippageUAH
      totalSlippagePct += slippage.slippagePct
      validSlippageCount++
    }
  }

  const averageSlippagePct =
    validSlippageCount > 0 ? totalSlippagePct / validSlippageCount : 0

  return {
    totalFeesUAH,
    totalSlippageUAH,
    averageSlippagePct,
  }
}

// ==================== Cycle Analysis (FIFO) ====================

interface ClosedCycle {
  buyTrade: Trade
  sellTrade: Trade
  volume: number
  profitUAH: number
}

export function analyzeCycles(trades: Trade[]): {
  closedCycles: ClosedCycle[]
  avgProfitPerCycle: number
} {
  const buyTrades = trades.filter((t) => t.side === 'BUY')
  const sellTrades = trades.filter((t) => t.side === 'SELL')

  const closedCycles: ClosedCycle[] = []

  // Simple FIFO matching
  const buyQueue: Array<{ trade: Trade; remaining: number }> = []

  for (const buy of buyTrades) {
    buyQueue.push({ trade: buy, remaining: buy.amountUSDT })
  }

  for (const sell of sellTrades) {
    let remainingSell = sell.amountUSDT

    while (remainingSell > 0 && buyQueue.length > 0) {
      const buyEntry = buyQueue[0]

      const volume = Math.min(remainingSell, buyEntry.remaining)

      // Calculate profit for this cycle
      const buyNotional = buyEntry.trade.price * volume
      const sellNotional = sell.price * volume
      const profitUAH = sellNotional - buyNotional

      closedCycles.push({
        buyTrade: buyEntry.trade,
        sellTrade: sell,
        volume,
        profitUAH,
      })

      buyEntry.remaining -= volume
      remainingSell -= volume

      if (buyEntry.remaining < 0.0001) {
        buyQueue.shift()
      }
    }
  }

  const totalProfit = closedCycles.reduce((sum, c) => sum + c.profitUAH, 0)
  const avgProfitPerCycle =
    closedCycles.length > 0 ? totalProfit / closedCycles.length : 0

  return { closedCycles, avgProfitPerCycle }
}

export function calculateCyclesLeft(
  trades: Trade[],
  settings: Settings | null,
  currentProfit: number
): CycleAnalysis | null {
  if (!settings) return null
  const targetProfit = settings.targetProfit
  if (!targetProfit) {
    return null
  }

  const { avgProfitPerCycle } = analyzeCycles(trades)
  const profitPerCycle =
    avgProfitPerCycle > 0
      ? avgProfitPerCycle
      : settings.expectedProfitPerCycle || 0

  if (profitPerCycle <= 0) {
    return null
  }

  const profitRemaining = targetProfit - currentProfit
  const cyclesLeft = Math.ceil(profitRemaining / profitPerCycle)
  const txLeft = cyclesLeft * 2

  return { avgProfitPerCycle: profitPerCycle, cyclesLeft, txLeft }
}

// ==================== Analysis ====================

export interface AnalysisWarning {
  type: 'info' | 'warning' | 'danger'
  message: string
}

export function analyzeMarket(
  buyItems: Array<{ price: number; maxLimit: number; merchantCompletionRate?: number }>,
  sellItems: Array<{ price: number; maxLimit: number; merchantCompletionRate?: number }>,
  bestAsk: number,
  bestBid: number,
  spreadPct: number
): AnalysisWarning[] {
  const warnings: AnalysisWarning[] = []

  // Analyze buy side
  const lowLimitsBuy = buyItems.filter((item) => item.maxLimit < 5000).length
  if (lowLimitsBuy > 3) {
    warnings.push({
      type: 'warning',
      message: `Many buy offers have low limits (<5000 UAH)`,
    })
  }

  // Analyze sell side
  const lowLimitsSell = sellItems.filter((item) => item.maxLimit < 5000).length
  if (lowLimitsSell > 3) {
    warnings.push({
      type: 'warning',
      message: `Many sell offers have low limits (<5000 UAH)`,
    })
  }

  // Low completion rates
  const lowCompletionBuy = buyItems.filter(
    (item) => item.merchantCompletionRate && item.merchantCompletionRate < 90
  ).length
  if (lowCompletionBuy > 2) {
    warnings.push({
      type: 'danger',
      message: `${lowCompletionBuy} buy offers have low completion rate (<90%)`,
    })
  }

  // Spread analysis
  if (spreadPct > 3) {
    warnings.push({
      type: 'info',
      message: `Wide spread: ${spreadPct.toFixed(2)}%`,
    })
  }

  if (warnings.length === 0) {
    warnings.push({
      type: 'info',
      message: 'Market looks healthy',
    })
  }

  return warnings
}
