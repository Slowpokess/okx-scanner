'use client'

import { useState, useEffect } from 'react'
import { Settings, Upload, Download, Trash2 } from 'lucide-react'
import { Button } from '../Button'
import { Card } from '../Card'
import { getSettings, updateSettings, clearAllData } from '@/lib/db'
import { useI18n } from '@/lib/i18n'
import type { Settings as SettingsType } from '@/lib/types'

interface SettingsPanelProps {
  onRefresh: () => void
}

export function SettingsPanel({ onRefresh }: SettingsPanelProps) {
  const { t } = useI18n()
  const [startCapitalUAH, setStartCapitalUAH] = useState('0')
  const [startCapitalUSDT, setStartCapitalUSDT] = useState('0')
  const [targetProfit, setTargetProfit] = useState('')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const settings = await getSettings()
    setStartCapitalUAH(settings.startCapitalUAH.toString())
    setStartCapitalUSDT(settings.startCapitalUSDT.toString())
    setTargetProfit(settings.targetProfit?.toString() || '')
  }

  const handleSave = async () => {
    const settings: SettingsType = {
      startCapitalUAH: parseFloat(startCapitalUAH) || 0,
      startCapitalUSDT: parseFloat(startCapitalUSDT) || 0,
      targetProfit: targetProfit ? parseFloat(targetProfit) : undefined,
    }
    await updateSettings(settings)
    onRefresh()
    alert(t.common.settingsSaved)
  }

  const handleExportJSON = async () => {
    const { getAllTrades } = await import('@/lib/db')
    const trades = await getAllTrades()
    const settings = await getSettings()

    const data = { trades, settings }
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
    const { getAllTrades } = await import('@/lib/db')
    const trades = await getAllTrades()

    if (trades.length === 0) {
      alert(t.common.noTradesExport)
      return
    }

    const headers = ['datetime', 'side', 'price', 'amountUSDT', 'notionalUAH', 'notes']
    const rows = trades.map((t) => [
      new Date(t.datetime).toISOString(),
      t.side,
      t.price,
      t.amountUSDT,
      (t.price * t.amountUSDT).toFixed(2),
      `"${t.notes || ''}"`,
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
    alert(t.common.importComplete)
  }

  const handleClearAll = async () => {
    if (!confirm(t.common.confirmDelete)) {
      return
    }

    await clearAllData()
    onRefresh()
    alert(t.common.dataCleared)
  }

  return (
    <Card title={t.journal.settings} className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.uahBalance}</label>
          <input
            type="number"
            value={startCapitalUAH}
            onChange={(e) => setStartCapitalUAH(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.usdtBalance}</label>
          <input
            type="number"
            value={startCapitalUSDT}
            onChange={(e) => setStartCapitalUSDT(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">{t.journal.targetProfit}</label>
          <input
            type="number"
            value={targetProfit}
            onChange={(e) => setTargetProfit(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-end">
          <Button onClick={handleSave} className="w-full">
            <Settings className="w-4 h-4 mr-1" />
            {t.journal.saveSettings}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
        <Button variant="secondary" size="sm" onClick={handleExportJSON}>
          <Download className="w-4 h-4 mr-1" />
          {t.journal.exportJson}
        </Button>

        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1" />
          {t.journal.exportCsv}
        </Button>

        <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
          <Upload className="w-4 h-4 mr-1" />
          {t.journal.import}
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
          {t.journal.clearAll}
        </Button>
      </div>
    </Card>
  )
}
