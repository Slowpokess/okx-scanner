'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { OKXOffer, Side } from '@/lib/types'
import { Tooltip } from '../Tooltip'
import { Badge } from '../Badge'

interface OfferTableProps {
  offers: OKXOffer[]
  side: Side
  onCreateTrade: (offer: OKXOffer, side: Side) => void
}

export function OfferTable({ offers, side, onCreateTrade }: OfferTableProps) {
  const isBuy = side === 'buy'
  const title = isBuy ? 'Купить USDT' : 'Продать USDT'
  const priceColor = isBuy ? 'text-red-400' : 'text-green-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">#</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Price</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Available</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Payment</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Merchant</th>
              <th className="px-4 py-2 text-left text-gray-400 font-medium">Orders</th>
              <th className="px-4 py-2 text-right text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {offers.map((offer, index) => (
              <tr key={index} className="hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                <td className={`px-4 py-3 font-semibold ${priceColor}`}>
                  {offer.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">{offer.available.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {offer.paymentMethods.slice(0, 2).map((method) => (
                      <span
                        key={method}
                        className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                      >
                        {method}
                      </span>
                    ))}
                    {offer.paymentMethods.length > 2 && (
                      <Tooltip
                        content={offer.paymentMethods.slice(2).join(', ')}
                      >
                        <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-500 rounded cursor-help">
                          +{offer.paymentMethods.length - 2}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300">{offer.merchantName}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {offer.merchantOrders !== undefined && (
                      <span className="text-xs text-gray-400">
                        {offer.merchantOrders} orders
                      </span>
                    )}
                    {offer.merchantCompletionRate !== undefined && (
                      <span
                        className={`text-xs ${
                          offer.merchantCompletionRate >= 95
                            ? 'text-green-400'
                            : offer.merchantCompletionRate >= 90
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {offer.merchantCompletionRate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onCreateTrade(offer, side)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1 ml-auto"
                  >
                    <Plus className="w-3 h-3" />
                    Trade
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
