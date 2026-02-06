'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'
import type { Trade, TradeSide, DraftTrade } from '@/lib/types'
import { getDraftTrade, clearDraftTrade } from '@/lib/draft'

interface TradeFormProps {
  onSave: (trade: Omit<Trade, 'id'>) => void
  onCancel?: () => void
  currentMid?: number
}

export function TradeForm({ onSave, onCancel, currentMid }: TradeFormProps) {
  const [side, setSide] = useState<TradeSide>('BUY')
  const [price, setPrice] = useState('')
  const [amountUSDT, setAmountUSDT] = useState('')
  const [feeUAH, setFeeUAH] = useState('')
  const [comment, setComment] = useState('')

  // Load draft on mount
  useEffect(() => {
    const draft = getDraftTrade()
    if (draft) {
      setSide(draft.side)
      setPrice(draft.price.toString())
      setComment(draft.comment)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!price || !amountUSDT) {
      alert('Please fill in price and amount')
      return
    }

    const draft = getDraftTrade()

    const trade: Omit<Trade, 'id'> = {
      datetime: Date.now(),
      side,
      price: parseFloat(price),
      amountUSDT: parseFloat(amountUSDT),
      feeUAH: feeUAH ? parseFloat(feeUAH) : undefined,
      comment,
      snapshot: draft?.snapshot || {
        snapshotTs: Date.now(),
        bestBid: currentMid || 0,
        bestAsk: currentMid || 0,
        mid: currentMid || 0,
        spreadPct: 0,
        stale: true,
      },
    }

    onSave(trade)
    clearDraftTrade()

    // Reset form
    setPrice('')
    setAmountUSDT('')
    setFeeUAH('')
    setComment('')
  }

  return (
    <Card title="Add Trade" className="mb-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Side</label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as TradeSide)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Price (UAH)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount (USDT)</label>
          <input
            type="number"
            step="0.01"
            value={amountUSDT}
            onChange={(e) => setAmountUSDT(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Fee (UAH)</label>
          <input
            type="number"
            step="0.01"
            value={feeUAH}
            onChange={(e) => setFeeUAH(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm text-gray-400 mb-1">Comment</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Merchant, payment method, notes..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="lg:col-span-6 flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          <Button type="submit">
            <Save className="w-4 h-4 mr-1" />
            Save Trade
          </Button>
        </div>
      </form>
    </Card>
  )
}
