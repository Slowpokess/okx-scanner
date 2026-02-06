'use client'

import { useState, useEffect } from 'react'
import { Settings, Target, Upload, Download, Trash2 } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'
import { getSettings, updateSettings, clearAllData } from '@/lib/db'
import type { Settings as SettingsType, Trade, SnapshotData } from '@/lib/types'

interface SettingsPanelProps {
  onRefresh: () => void
}

export function SettingsPanel({ onRefresh }: SettingsPanelProps) {
  const [startCapital, setStartCapital] = useState('0')
  const [targetProfit, setTargetProfit] = useState('')
  const [expectedProfitPerCycle, setExpectedProfitPerCycle] = useState('')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const settings = await getSettings()
    setStartCapital(settings.startCapital.toString())
    setTargetProfit(settings.targetProfit?.toString() || '')
    setExpectedProfitPerCycle(settings.expectedProfitPerCycle?.toString() || '')
  }

  const handleSave = async () => {
    const settings: SettingsType = {
      startCapital: parseFloat(startCapital) || 0,
      targetProfit: targetProfit ? parseFloat(targetProfit) : undefined,
      expectedProfitPerCycle: expectedProfitPerCycle
        ? parseFloat(expectedProfitPerCycle)
        : undefined,
    }
    await updateSettings(settings)
    onRefresh()
    alert('Settings saved')
  }

  const handleExportJSON = async () => {
    const trades = await (await import('@/lib/db')).getAllTrades()
    const snapshots = await (await import('@/lib/db')).getLatestSnapshot()
    const settings = await getSettings()

    const data = { trades, snapshots: snapshots ? [snapshots] : [], settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `okx-journal-${Date.now()}.json`
    a.click()
  }

  const handleExportCSV = async () => {
    const trades = await (await import('@/lib/db')).getAllTrades()

    if (trades.length === 0) {
      alert('No trades to export')
      return
    }

    const headers = [
      'datetime',
      'side',
      'price',
      'amountUSDT',
      'feeUAH',
      'comment',
      'snapshotTs',
      'bestBid',
      'bestAsk',
      'mid',
      'spreadPct',
      'stale',
    ]

    const rows = trades.map((t) => [
      new Date(t.datetime).toISOString(),
      t.side,
      t.price,
      t.amountUSDT,
      t.feeUAH || '',
      `"${t.comment}"`,
      t.snapshot?.snapshotTs || '',
      t.snapshot?.bestBid || '',
      t.snapshot?.bestAsk || '',
      t.snapshot?.mid || '',
      t.snapshot?.spreadPct || '',
      t.snapshot?.stale ? 'true' : 'false',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `okx-trades-${Date.now()}.csv`
    a.click()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const data = JSON.parse(text)

    if (data.trades) {
      const db = (await import('@/lib/db')).db
      await db.trades.clear()
      await db.trades.bulkAdd(data.trades)
    }

    if (data.settings) {
      await updateSettings(data.settings)
    }

    onRefresh()
    alert('Import complete')
  }

  const handleClearAll = async () => {
    if (
      !confirm('Are you sure you want to delete all data? This cannot be undone.')
    ) {
      return
    }

    await clearAllData()
    onRefresh()
    alert('All data cleared')
  }

  return (
    <Card title="Settings" className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Start Capital (UAH)</label>
          <input
            type="number"
            value={startCapital}
            onChange={(e) => setStartCapital(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Target Profit (UAH)</label>
          <input
            type="number"
            value={targetProfit}
            onChange={(e) => setTargetProfit(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Expected Profit/Cycle</label>
          <input
            type="number"
            value={expectedProfitPerCycle}
            onChange={(e) => setExpectedProfitPerCycle(e.target.value)}
            placeholder="If no history"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-end">
          <Button onClick={handleSave} className="w-full">
            <Settings className="w-4 h-4 mr-1" />
            Save Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
        <Button variant="secondary" size="sm" onClick={handleExportJSON}>
          <Download className="w-4 h-4 mr-1" />
          Export JSON
        </Button>

        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1" />
          Export CSV
        </Button>

        <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
          <Upload className="w-4 h-4 mr-1" />
          Import
        </Button>

        {showImport && (
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm"
          />
        )}

        <Button variant="danger" size="sm" onClick={handleClearAll} className="ml-auto">
          <Trash2 className="w-4 h-4 mr-1" />
          Clear All Data
        </Button>
      </div>
    </Card>
  )
}
