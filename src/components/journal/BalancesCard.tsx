'use client'

import { Wallet, TrendingUp, DollarSign } from 'lucide-react'
import type { Balances, EquityResult, Settings } from '@/lib/types'

interface BalancesCardProps {
  balances: Balances
  equityResult: EquityResult
  settings: Settings | null
}

export function BalancesCard({
  balances,
  equityResult,
  settings,
}: BalancesCardProps) {
  const isProfitable = equityResult.profit > 0

  const startCapitalUAH = settings?.startCapitalUAH || 0
  const startCapitalUSDT = settings?.startCapitalUSDT || 0
  const currentMid = equityResult.currentMid

  // Calculate start capital in UAH equivalent
  const startCapitalInUAH = startCapitalUAH + (startCapitalUSDT * currentMid)

  return (
    <div className="space-y-4 mb-6">
      {/* Start Capital */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Start Capital</span>
          <Wallet className="w-4 h-4 text-blue-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">UAH</div>
            <div className="text-lg font-semibold text-gray-200">
              {startCapitalUAH.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">USDT</div>
            <div className="text-lg font-semibold text-blue-400">
              {startCapitalUSDT.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Total: {startCapitalInUAH.toFixed(2)} UAH
        </div>
      </div>

      {/* Current Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* UAH Balance */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">UAH Balance</span>
            <Wallet className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-200">
            {balances.uah.toFixed(2)}
          </div>
        </div>

        {/* USDT Balance */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">USDT Balance</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {balances.usdt.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            @ {currentMid.toFixed(2)} = {(balances.usdt * currentMid).toFixed(2)} UAH
          </div>
        </div>

        {/* Equity */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Equity</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {equityResult.equity.toFixed(2)} UAH
          </div>
          <div
            className={`text-sm mt-1 ${
              isProfitable ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isProfitable ? '+' : ''}{equityResult.profit.toFixed(2)} UAH
          </div>
        </div>
      </div>
    </div>
  )
}
