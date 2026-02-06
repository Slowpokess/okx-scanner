'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DerivedTrade, EquityResult } from '@/lib/types'

interface EquityChartProps {
  trades: DerivedTrade[]
  equityResult: EquityResult
}

export function EquityChart({ trades, equityResult }: EquityChartProps) {
  // Build equity curve
  const data = trades.map((trade, index) => {
    const cumulativeTrades = trades.slice(0, index + 1)
    const uah = trades.slice(0, index + 1).reduce((sum, t) => {
      const notional = t.price * t.amountUSDT
      const fee = t.feeUAH || 0
      return t.side === 'BUY' ? sum - notional - fee : sum + notional - fee
    }, 0)
    const usdt = trades.slice(0, index + 1).reduce((sum, t) => {
      return t.side === 'BUY' ? sum + t.amountUSDT : sum - t.amountUSDT
    }, 0)
    const equity = uah + usdt * equityResult.currentMid

    return {
      index: index + 1,
      equity: equity,
      profit: equity - equityResult.profit, // Not exact, need startCapital
    }
  })

  // Calculate PnL per trade
  const pnlData = trades.map((trade, index) => {
    const cumulativeTrades = trades.slice(0, index + 1)
    const uah = cumulativeTrades.reduce((sum, t) => {
      const notional = t.price * t.amountUSDT
      const fee = t.feeUAH || 0
      return t.side === 'BUY' ? sum - notional - fee : sum + notional - fee
    }, 0)
    const usdt = cumulativeTrades.reduce((sum, t) => {
      return t.side === 'BUY' ? sum + t.amountUSDT : sum - t.amountUSDT
    }, 0)
    const equity = uah + usdt * equityResult.currentMid

    return {
      index: index + 1,
      pnl: equity - 10000, // Placeholder - should use startCapital
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equity Curve */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="index" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line type="monotone" dataKey="equity" stroke="#22c55e" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PnL per Trade */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-4">PnL per Trade</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pnlData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="index" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Bar dataKey="pnl" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
