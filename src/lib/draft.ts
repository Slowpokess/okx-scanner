import type { DraftTrade } from './types'

const DRAFT_KEY = 'okx_draft_trade'

export function saveDraftTrade(draft: DraftTrade): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function getDraftTrade(): DraftTrade | null {
  const data = sessionStorage.getItem(DRAFT_KEY)
  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function clearDraftTrade(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}
