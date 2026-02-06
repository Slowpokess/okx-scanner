'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '../Button'

interface ScannerHeaderProps {
  onUpdate: () => void
  isAutoUpdate: boolean
  setIsAutoUpdate: (value: boolean) => void
  lastUpdate: number | null
  isStale: boolean
  onSaveSnapshot: () => void
}

export function ScannerHeader({
  onUpdate,
  isAutoUpdate,
  setIsAutoUpdate,
  lastUpdate,
  isStale,
  onSaveSnapshot,
}: ScannerHeaderProps) {
  const [updateInterval, setUpdateInterval] = useState('20')
  const [timeUntilUpdate, setTimeUntilUpdate] = useState(0)

  useEffect(() => {
    if (!isAutoUpdate) return

    const intervalMs = parseInt(updateInterval) * 1000
    const timer = setInterval(() => {
      setTimeUntilUpdate((prev) => {
        if (prev <= 1000) {
          // Add jitter (100-600ms)
          const jitter = Math.floor(Math.random() * 500) + 100
          setTimeout(onUpdate, jitter)
          return intervalMs
        }
        return prev - 1000
      })
    }, 1000)

    setTimeUntilUpdate(intervalMs)

    return () => clearInterval(timer)
  }, [isAutoUpdate, updateInterval, onUpdate])

  const getTimeSinceLastUpdate = () => {
    if (!lastUpdate) return null
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s ago`
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">OKX P2P Scanner</h1>
        {isStale && (
          <span className="px-2 py-1 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded">
            Data may be stale
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {lastUpdate && (
          <span className="text-sm text-gray-500">
            Last updated: {getTimeSinceLastUpdate()}
          </span>
        )}

        {isAutoUpdate && timeUntilUpdate > 0 && (
          <span className="text-sm text-gray-400">
            Next in {Math.ceil(timeUntilUpdate / 1000)}s
          </span>
        )}

        <select
          value={updateInterval}
          onChange={(e) => setUpdateInterval(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="20">20s</option>
          <option value="60">1m</option>
          <option value="300">5m</option>
        </select>

        <Button
          variant={isAutoUpdate ? 'danger' : 'primary'}
          size="sm"
          onClick={() => setIsAutoUpdate(!isAutoUpdate)}
        >
          {isAutoUpdate ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
          {isAutoUpdate ? 'Stop' : 'Start'}
        </Button>

        <Button variant="secondary" size="sm" onClick={onUpdate}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Refresh
        </Button>

        <Button variant="secondary" size="sm" onClick={onSaveSnapshot}>
          Save Snapshot
        </Button>
      </div>
    </div>
  )
}
