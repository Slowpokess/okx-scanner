'use client'

import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react'
import { Card } from '../Card'
import type { TransactionSummary } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface TransactionSummaryCardProps {
  summary: TransactionSummary
}

export function TransactionSummaryCard({ summary }: TransactionSummaryCardProps) {
  const { t } = useI18n()

  const isProfitable = summary.profitUAH > 0

  return (
    <Card title="Transaction Summary" className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bought */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Bought</span>
            <TrendingUp className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400">
            {summary.totalBuyUSDT.toFixed(2)} USDT
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.totalBuyUAH.toFixed(2)} UAH
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Sold</span>
            <TrendingDown className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-xl font-bold text-green-400">
            {summary.totalSellUSDT.toFixed(2)} USDT
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.totalSellUAH.toFixed(2)} UAH
          </div>
        </div>

        {/* Profit */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Profit</span>
            {isProfitable ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div
            className={`text-xl font-bold ${
              isProfitable ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isProfitable ? '+' : ''}{summary.profitUAH.toFixed(2)} UAH
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {summary.profitUSDT > 0 ? '+' : ''}{summary.profitUSDT.toFixed(2)} USDT
          </div>
        </div>

        {/* Average Spread */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg Spread</span>
            <BarChart3 className="w-4 h-4 text-yellow-400" />
          </div>
          <div
            className={`text-xl font-bold ${
              summary.averageSpread > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {summary.averageSpread > 0 ? '+' : ''}{summary.averageSpread.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg buy: {summary.averageBuyPrice.toFixed(2)} / sell: {summary.averageSellPrice.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Total Transactions</div>
          <div className="text-lg font-semibold text-gray-200">
            {summary.transactionCount}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Avg Prices</div>
          <div className="text-sm text-gray-300">
            Buy: <span className="text-red-400">{summary.averageBuyPrice.toFixed(2)}</span> /
            Sell: <span className="text-green-400">{summary.averageSellPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
