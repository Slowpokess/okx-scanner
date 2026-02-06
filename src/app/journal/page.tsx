'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { TradeForm } from '@/components/journal/TradeForm'
import { TradesTable } from '@/components/journal/TradesTable'
import { BalancesCard } from '@/components/journal/BalancesCard'
import { EquityChart } from '@/components/journal/EquityChart'
import { SettingsPanel } from '@/components/journal/SettingsPanel'
import { GoalCalculator } from '@/components/journal/GoalCalculator'
import { Loading } from '@/components/Loading'
import {
  getAllTrades,
  addTrade,
  deleteTrade,
  getSettings,
  updateSettings,
} from '@/lib/db'
import { deriveTrade, calculateBalances, calculateEquity, calculateFeeSummary, calculateCyclesLeft } from '@/lib/calculations'
import { fetchSummary } from '@/lib/okx'
import type { Trade, Settings } from '@/lib/types'

function JournalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDraft = searchParams.get('draft') === '1'

  const [trades, setTrades] = useState<Trade[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentMid, setCurrentMid] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tradesData, settingsData, summary] = await Promise.all([
        getAllTrades(),
        getSettings(),
        fetchSummary('UAH', 'USDT', 10),
      ])

      setTrades(tradesData)
      setSettings(settingsData)
      setCurrentMid(summary?.mid || 0)
    } catch (err) {
      console.error('Load data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTrade = async (trade: Omit<Trade, 'id'>) => {
    try {
      await addTrade(trade as Trade)
      await loadData()
    } catch (err) {
      console.error('Save trade error:', err)
      alert('Failed to save trade')
    }
  }

  const handleDeleteTrade = async (id: number) => {
    if (!confirm('Delete this trade?')) return
    try {
      await deleteTrade(id)
      await loadData()
    } catch (err) {
      console.error('Delete trade error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-200 flex items-center justify-center">
        <Loading message="Loading journal..." />
      </div>
    )
  }

  const derivedTrades = trades.map(deriveTrade)
  const balances = calculateBalances(trades, settings?.startCapital || 0)
  const equityResult = calculateEquity(trades, settings?.startCapital || 0, currentMid)
  const feeSummary = calculateFeeSummary(trades)
  const cycleAnalysis = calculateCyclesLeft(trades, settings, equityResult.profit)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-white">OKX P2P Journal</h1>
            <nav className="flex gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-300">
                Scanner
              </Link>
              <Link href="/journal" className="text-green-400 font-medium">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Journal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SettingsPanel onRefresh={loadData} />

        <BalancesCard
          balances={balances}
          equityResult={equityResult}
          feeSummary={feeSummary}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <EquityChart trades={derivedTrades} equityResult={equityResult} />
          </div>
          <div>
            <GoalCalculator
              cycleAnalysis={cycleAnalysis}
              currentProfit={equityResult.profit}
              targetProfit={settings?.targetProfit}
            />
          </div>
        </div>

        <TradeForm onSave={handleSaveTrade} currentMid={currentMid} />

        <TradesTable trades={derivedTrades} onDelete={handleDeleteTrade} />
      </main>
    </div>
  )
}

export default function JournalPage() {
  return (
    <Suspense fallback={<Loading message="Loading journal..." />}>
      <JournalContent />
    </Suspense>
  )
}
