import Dexie, { Table } from 'dexie'
import type { Trade, SnapshotData, Settings } from './types'

export class OKXDatabase extends Dexie {
  trades!: Table<Trade>
  snapshots!: Table<SnapshotData>
  settings!: Table<Settings>

  constructor() {
    super('OKXP2PScannerDB')
    this.version(1).stores({
      trades: '++id, datetime, side',
      snapshots: '++id, ts',
      settings: '++id',
    })
  }
}

export const db = new OKXDatabase()

// ==================== Helper Functions ====================

export async function getAllTrades(): Promise<Trade[]> {
  return await db.trades.orderBy('datetime').toArray()
}

export async function addTrade(trade: Trade): Promise<number> {
  return await db.trades.add(trade)
}

export async function updateTrade(id: number, trade: Partial<Trade>): Promise<void> {
  await db.trades.update(id, trade)
}

export async function deleteTrade(id: number): Promise<void> {
  await db.trades.delete(id)
}

export async function getLatestSnapshot(): Promise<SnapshotData | undefined> {
  return await db.snapshots.orderBy('ts').last()
}

export async function addSnapshot(snapshot: SnapshotData): Promise<number> {
  return await db.snapshots.add(snapshot)
}

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.toArray()
  if (settings.length === 0) {
    const defaultSettings: Settings = {
      startCapitalUAH: 0,
      startCapitalUSDT: 0
    }
    const id = await db.settings.add(defaultSettings)
    return { ...defaultSettings, id }
  }

  // Migrate old settings format
  const setting = settings[0]
  const needsMigration = 'startCapital' in setting || 'startCapitalCurrency' in setting

  if (needsMigration) {
    const oldSettings = setting as any
    const newSettings: Settings = {
      id: setting.id,
      startCapitalUAH: oldSettings.startCapitalCurrency === 'USDT'
        ? 0
        : (oldSettings.startCapital || 0),
      startCapitalUSDT: oldSettings.startCapitalCurrency === 'USDT'
        ? (oldSettings.startCapital || 0)
        : 0,
      targetProfit: oldSettings.targetProfit,
    }
    await db.settings.update(setting.id!, newSettings)
    return newSettings
  }

  return setting
}

export async function updateSettings(settings: Settings): Promise<void> {
  if (settings.id) {
    await db.settings.update(settings.id, settings)
  } else {
    await db.settings.add(settings)
  }
}

export async function clearAllData(): Promise<void> {
  await db.trades.clear()
  await db.snapshots.clear()
  await db.settings.clear()
}
