'use client'

import { Target, TrendingUp } from 'lucide-react'
import type { CycleAnalysis } from '@/lib/types'

interface GoalCalculatorProps {
  cycleAnalysis: CycleAnalysis | null
  currentProfit: number
  targetProfit: number | undefined
}

export function GoalCalculator({
  cycleAnalysis,
  currentProfit,
  targetProfit,
}: GoalCalculatorProps) {
  if (!targetProfit || !cycleAnalysis) {
    return null
  }

  const profitRemaining = targetProfit - currentProfit
  const progress = Math.min((currentProfit / targetProfit) * 100, 100)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">Goal Calculator</h3>
        <Target className="w-4 h-4 text-green-400" />
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{currentProfit.toFixed(2)} UAH</span>
          <span>{targetProfit.toFixed(2)} UAH</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-500">Remaining</div>
          <div className="text-lg font-semibold text-gray-200">
            {profitRemaining.toFixed(2)} UAH
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Cycles Left</div>
          <div className="text-lg font-semibold text-blue-400">
            {cycleAnalysis.cyclesLeft}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Transactions Left</div>
          <div className="text-lg font-semibold text-yellow-400">
            {cycleAnalysis.txLeft}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-500">
          Based on avg profit/cycle:{' '}
          <span className="text-green-400">{cycleAnalysis.avgProfitPerCycle.toFixed(2)} UAH</span>
        </div>
      </div>
    </div>
  )
}
