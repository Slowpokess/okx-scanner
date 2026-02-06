'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'
import { useI18n } from '@/lib/i18n'
import type { Trade, TradeSide } from '@/lib/types'

interface TradeFormProps {
  onSave: (trade: Omit<Trade, 'id'>) => void
  currentMid?: number
}

export function TradeForm({ onSave, currentMid }: TradeFormProps) {
  const { t } = useI18n()
  const [side, setSide] = useState<TradeSide>('BUY')
  const [amountUSDT, setAmountUSDT] = useState('100')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (currentMid) {
      setPrice(currentMid.toString())
    }
  }, [currentMid])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!amountUSDT || !price) {
      alert('Please fill in amount and price')
      return
    }

    const trade: Omit<Trade, 'id'> = {
      datetime: Date.now(), // Автоматически текущее время
      side,
      amountUSDT: parseFloat(amountUSDT),
      price: parseFloat(price),
      notes: notes || undefined,
    }

    onSave(trade)

    // Reset form
    setAmountUSDT('100')
    setNotes('')
    if (currentMid) {
      setPrice(currentMid.toString())
    }
  }

  return (
    <Card title={t.journal.addTrade} className="mb-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.side}</label>
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as TradeSide)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="BUY">{t.common.buy}</option>
            <option value="SELL">{t.common.sell}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.amount}</label>
          <input
            type="number"
            step="1"
            min="0"
            value={amountUSDT}
            onChange={(e) => setAmountUSDT(e.target.value)}
            placeholder="100"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.price} (UAH)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="38.50"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.notes}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.journal.notes}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="lg:col-span-4 flex justify-end">
          <Button type="submit">
            <Save className="w-4 h-4 mr-1" />
            {t.journal.save}
          </Button>
        </div>
      </form>
    </Card>
  )
}
