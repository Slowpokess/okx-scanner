'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { ScannerHeader } from '@/components/scanner/ScannerHeader'
import { SummaryCards } from '@/components/scanner/SummaryCards'
import { OfferTable } from '@/components/scanner/OfferTable'
import { Loading } from '@/components/Loading'
import { Toast } from '@/components/Toast'
import { saveDraftTrade } from '@/lib/draft'
import { snapshotStorage } from '@/lib/storage'
import type { SummaryResponse, OKXOffer, Side } from '@/lib/types'

export default function ScannerPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAutoUpdate, setIsAutoUpdate] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  )

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/okx/summary?fiat=UAH&crypto=USDT&limit=10')
      const data = await response.json()
      if (!response.ok) {
        const message =
          typeof data?.error === 'string'
            ? `${data.error}${data?.hint ? ` (${data.hint})` : ''}`
            : 'Failed to fetch data'
        throw new Error(message)
      }

      const summaryData: SummaryResponse = data
      setSummary(summaryData)
      setLastUpdate(Date.now())
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch data from OKX')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateTrade = (offer: OKXOffer, side: Side) => {
    if (!summary) return

    const draft = {
      side: side === 'buy' ? ('BUY' as const) : ('SELL' as const),
      price: offer.price,
      datetime: Date.now(),
      comment: `${offer.merchantName} | ${offer.paymentMethods.join(', ')}${
        offer.terms ? ` | ${offer.terms}` : ''
      }`,
      snapshot: {
        snapshotTs: summary.ts,
        bestBid: summary.bestBid,
        bestAsk: summary.bestAsk,
        mid: summary.mid,
        spreadPct: summary.spreadPct,
        stale: summary.stale || false,
      },
    }

    saveDraftTrade(draft)
    router.push('/journal?draft=1')
  }

  const handleSaveSnapshot = async () => {
    if (!summary) return

    try {
      await snapshotStorage.addSnapshot({
        ts: summary.ts,
        bestAsk: summary.bestAsk,
        bestBid: summary.bestBid,
        mid: summary.mid,
        spreadPct: summary.spreadPct,
        buyTop10: summary.buyTop10,
        sellTop10: summary.sellTop10,
      })

      setToast({ message: 'Snapshot saved', type: 'success' })
    } catch (err) {
      console.error('Save snapshot error:', err)
      setToast({ message: 'Failed to save snapshot', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-white">OKX P2P Scanner</h1>
            <nav className="flex gap-4">
              <Link href="/" className="text-green-400 font-medium">
                Scanner
              </Link>
              <Link href="/journal" className="text-gray-500 hover:text-gray-300">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Journal
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <ScannerHeader
          onUpdate={fetchData}
          isAutoUpdate={isAutoUpdate}
          setIsAutoUpdate={setIsAutoUpdate}
          lastUpdate={lastUpdate}
          isStale={summary?.stale || false}
          onSaveSnapshot={handleSaveSnapshot}
        />

        {loading && !summary ? (
          <Loading message="Fetching OKX P2P data..." />
        ) : error ? (
          <div className="bg-gray-900 border border-red-900 rounded-lg p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Retry
            </button>
          </div>
        ) : summary ? (
          <>
            <SummaryCards summary={summary} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OfferTable
                offers={summary.buyTop10}
                side="buy"
                onCreateTrade={handleCreateTrade}
              />
              <OfferTable
                offers={summary.sellTop10}
                side="sell"
                onCreateTrade={handleCreateTrade}
              />
            </div>
          </>
        ) : null}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
