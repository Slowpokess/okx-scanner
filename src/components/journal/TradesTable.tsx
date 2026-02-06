'use client'

import { Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { DerivedTrade } from '@/lib/types'

interface TradesTableProps {
  trades: DerivedTrade[]
  onDelete: (id: number) => void
}

export function TradesTable({ trades, onDelete }: TradesTableProps) {
  const { t } = useI18n()

  if (trades.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500">{t.journal.noTrades}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200">{t.journal.title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.datetime}</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.side}</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.price}</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.amount}</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.notional}</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">{t.journal.notes}</th>
              <th className="px-4 py-2 text-right text-gray-400 font-medium">{t.journal.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-400">
                  {new Date(trade.datetime).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      trade.side === 'BUY'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-green-900/30 text-green-400'
                    }`}
                  >
                    {trade.side === 'BUY' ? t.common.buy : t.common.sell}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{trade.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-300">
                  {trade.amountUSDT.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {trade.notionalUAH.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                  {trade.notes || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => trade.id && onDelete(trade.id)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
