'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '../Button'
import type { DerivedTrade } from '@/lib/types'

interface TradesTableProps {
  trades: DerivedTrade[]
  onDelete: (id: number) => void
}

export function TradesTable({ trades, onDelete }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500">No trades yet. Add your first trade above.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200">Trades</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Date</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Side</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Price</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Amount</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Notional</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Fees</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Slippage</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Comment</th>
              <th className="px-4 py-2 text-right text-gray-400 font-medium">Actions</th>
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
                    {trade.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{trade.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-300">
                  {trade.amountUSDT.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {trade.notionalUAH.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {trade.feeImpactUAH ? trade.feeImpactUAH.toFixed(2) : '—'}
                </td>
                <td className="px-4 py-3">
                  {trade.slippageUAH !== undefined ? (
                    <div className="flex flex-col">
                      <span
                        className={`text-xs ${
                          trade.slippageUAH > 0 ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {trade.slippageUAH.toFixed(2)} UAH
                      </span>
                      {trade.slippagePct !== undefined && (
                        <span
                          className={`text-xs ${
                            trade.slippagePct > 0 ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {trade.slippagePct > 0 ? '+' : ''}
                          {trade.slippagePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 max-w-[200px] truncate">
                  {trade.comment}
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
