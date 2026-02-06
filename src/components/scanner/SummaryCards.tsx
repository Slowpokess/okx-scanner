'use client'

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import type { SummaryResponse } from '@/lib/types'
import { Badge } from '../Badge'
import { useI18n } from '@/lib/i18n'

interface SummaryCardsProps {
  summary: SummaryResponse
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { t } = useI18n()

  // Simple inline analysis
  const warnings = []
  if (summary.spreadPct > 3) {
    warnings.push({
      type: 'info' as const,
      message: t.scanner.wideSpread.replace('{spread}', summary.spreadPct.toFixed(2))
    })
  }
  if (summary.spreadPct < 0) {
    warnings.push({
      type: 'warning' as const,
      message: t.scanner.arbitrage
    })
  }

  const avgBuy =
    summary.buyTop10.reduce((sum, item) => sum + item.price, 0) / summary.buyTop10.length
  const avgSell =
    summary.sellTop10.reduce((sum, item) => sum + item.price, 0) / summary.sellTop10.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Best Ask */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{t.scanner.bestAsk}</span>
          <TrendingUp className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-2xl font-bold text-red-400">{summary.bestAsk.toFixed(2)}</div>
        <div className="text-xs text-gray-500 mt-1">{t.scanner.avg}: {avgBuy.toFixed(2)}</div>
      </div>

      {/* Best Bid */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{t.scanner.bestBid}</span>
          <TrendingDown className="w-4 h-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-green-400">{summary.bestBid.toFixed(2)}</div>
        <div className="text-xs text-gray-500 mt-1">{t.scanner.avg}: {avgSell.toFixed(2)}</div>
      </div>

      {/* Mid */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{t.scanner.midPrice}</span>
          <Minus className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-blue-400">{summary.mid.toFixed(2)}</div>
      </div>

      {/* Spread */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{t.scanner.spread}</span>
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="text-2xl font-bold text-yellow-400">
          {summary.spreadPct.toFixed(2)}%
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {summary.bestAsk - summary.bestBid > 0 ? (
            <span className="text-yellow-400">
              {summary.bestAsk - summary.bestBid > 1
                ? `${(summary.bestAsk - summary.bestBid).toFixed(2)} UAH`
                : t.scanner.narrow}
            </span>
          ) : (
            <span className="text-red-400">{t.scanner.arbitrage}</span>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">{t.scanner.analysis}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {warnings.map((warning, i) => (
              <Badge key={i} variant={warning.type}>
                {warning.message}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
