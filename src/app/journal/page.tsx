'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { TradeForm } from '@/components/journal/TradeForm'
import { TradesTable } from '@/components/journal/TradesTable'
import { BalancesCard } from '@/components/journal/BalancesCard'
import { TransactionSummaryCard } from '@/components/journal/TransactionSummaryCard'
import { SettingsPanel } from '@/components/journal/SettingsPanel'
import { Loading } from '@/components/Loading'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import {
  getAllTrades,
  addTrade,
  deleteTrade,
  getSettings,
} from '@/lib/db'
import { deriveTradesWithPnL, calculateBalances, calculateEquity, calculateTransactionSummary } from '@/lib/calculations'
import { fetchSummary } from '@/lib/okx'
import { useI18n } from '@/lib/i18n'
import type { Trade, Settings } from '@/lib/types'

function JournalContent() {
  const { t } = useI18n()
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
      alert(t.common.saveFailed)
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
        <Loading message={t.common.loading} />
      </div>
    )
  }

  const derivedTrades = deriveTradesWithPnL(trades, settings, currentMid)
  const balances = calculateBalances(trades, settings, currentMid)
  const equityResult = calculateEquity(trades, settings, currentMid)
  const summary = calculateTransactionSummary(trades)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-white">{t.journal.title}</h1>
            <nav className="flex gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-300">
                {t.nav.scanner}
              </Link>
              <Link href="/journal" className="text-green-400 font-medium">
                <BookOpen className="w-4 h-4 inline mr-1" />
                {t.nav.journal}
              </Link>
            </nav>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <SettingsPanel onRefresh={loadData} />

        <BalancesCard
          balances={balances}
          equityResult={equityResult}
          settings={settings}
        />

        <TransactionSummaryCard summary={summary} />

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

