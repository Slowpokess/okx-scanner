'use client'

import { Wallet, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import type { Balances, EquityResult, FeeSummary } from '@/lib/types'

interface BalancesCardProps {
  balances: Balances
  equityResult: EquityResult
  feeSummary: FeeSummary
}

export function BalancesCard({
  balances,
  equityResult,
  feeSummary,
}: BalancesCardProps) {
  const isProfitable = equityResult.profit > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          @ {equityResult.currentMid.toFixed(2)} = {(balances.usdt * equityResult.currentMid).toFixed(2)} UAH
        </div>
      </div>

      {/* Equity */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Equity (MTM)</span>
          <TrendingUp className="w-4 h-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-green-400">
          {equityResult.equity.toFixed(2)}
        </div>
      </div>

      {/* Profit */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Profit</span>
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div
          className={`text-2xl font-bold ${
            isProfitable ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isProfitable ? '+' : ''}
          {equityResult.profit.toFixed(2)}
        </div>
      </div>

      {/* Fee Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Fees & Slippage</span>
          <AlertCircle className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Total Fees</div>
            <div className="text-lg font-semibold text-gray-300">
              {feeSummary.totalFeesUAH.toFixed(2)} UAH
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Slippage</div>
            <div className="text-lg font-semibold text-gray-300">
              {feeSummary.totalSlippageUAH.toFixed(2)} UAH
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Avg Slippage</div>
            <div
              className={`text-lg font-semibold ${
                feeSummary.averageSlippagePct > 0 ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {feeSummary.averageSlippagePct > 0 ? '+' : ''}
              {feeSummary.averageSlippagePct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Total Impact */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Total Impact</span>
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>
        <div className="text-lg font-semibold text-red-400">
          {(feeSummary.totalFeesUAH + feeSummary.totalSlippageUAH).toFixed(2)} UAH
          <span className="text-sm text-gray-500 ml-2">
            (fees + slippage)
          </span>
        </div>
      </div>
    </div>
  )
}
