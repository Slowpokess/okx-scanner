import type { OKXResponse, SummaryResponse, OKXOffer, Side } from './types'

// ==================== Cache & Circuit Breaker ====================

interface CacheEntry {
  data: OKXResponse
  timestamp: number
}

interface CircuitBreakerEntry {
  failures: number
  lastFailureTime: number
  lastGoodData?: OKXResponse
  openUntil: number
}

const cache = new Map<string, CacheEntry>()
const circuitBreaker = new Map<string, CircuitBreakerEntry>()
const lastFetchTime = new Map<string, number>()

const CACHE_TTL = 10000 // 10 seconds
const MIN_FETCH_INTERVAL = 3000 // 3 seconds
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 60 seconds

type DataSource = 'okx' | 'p2parmy'

function getCacheKey(
  source: DataSource,
  side: Side,
  fiat: string,
  crypto: string,
  limit: number
): string {
  return `${source}-${side}-${fiat}-${crypto}-${limit}`
}

// ==================== Headers ====================

function getOkxHeaders(mode: 'minimal' | 'browser'): HeadersInit {
  if (mode === 'minimal') {
    return {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  }

  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,uk;q=0.8',
    Referer: 'https://www.okx.com/',
    Origin: 'https://www.okx.com',
  }
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function extractRawItems(data: any, side: Side): any[] | null {
  if (!data) return null

  // New OKX API format: data.buy or data.sell
  if (data.data && typeof data.data === 'object') {
    if (Array.isArray(data.data[side])) {
      return data.data[side]
    }
  }

  // Legacy formats for compatibility
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.details)) return data.data.details
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data?.data?.list)) return data.data.list
  if (Array.isArray(data?.data?.orders)) return data.data.orders
  return null
}

// ==================== Fetch from OKX ====================

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const mergedOptions: RequestInit = { ...options, signal: controller.signal }

  return fetch(url, mergedOptions).finally(() => clearTimeout(timeoutId))
}

const OKX_BASE_URLS = (process.env.OKX_BASE_URLS || 'https://www.okx.com,https://okx.com')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const P2P_ARMY_BASE_URL = process.env.P2P_ARMY_BASE_URL || 'https://p2p.army/v1/api'
const P2P_ARMY_API_KEY = process.env.P2P_ARMY_API_KEY || ''
const P2P_SOURCE = (process.env.P2P_SOURCE || 'auto').toLowerCase()

function getSourceOrder(): DataSource[] {
  if (P2P_SOURCE === 'okx') return ['okx']
  if (P2P_SOURCE === 'p2parmy') return ['p2parmy']
  return ['okx', 'p2parmy']
}

async function fetchFromOKXSource(
  side: Side,
  fiat: string,
  crypto: string,
  limit: number
): Promise<OKXResponse | null> {
  const key = getCacheKey('okx', side, fiat, crypto, limit)
  const now = Date.now()

  // Check circuit breaker
  const cb = circuitBreaker.get(key)
  if (cb && cb.openUntil > now) {
    console.log(`[OKX] Circuit breaker open for ${key}, returning stale data`)
    return cb.lastGoodData
      ? { ...cb.lastGoodData, stale: true, source: 'circuit-breaker' }
      : null
  }

  // Rate limiting check
  const lastFetch = lastFetchTime.get(key) || 0
  const timeSinceLastFetch = now - lastFetch
  if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
    console.log(`[OKX] Rate limited for ${key}, returning cache if available`)
    const cached = cache.get(key)
    if (cached && now - cached.timestamp < CACHE_TTL * 3) {
      return { ...cached.data, stale: true, source: 'rate-limit' }
    }
    // Wait for rate limit
    await new Promise((resolve) => setTimeout(resolve, MIN_FETCH_INTERVAL - timeSinceLastFetch))
  }

  // Check cache first
  const cached = cache.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    // Build URL for OKX C2C P2P API
    const params = new URLSearchParams({
      side,
      baseCurrency: crypto.toLowerCase(),
      quoteCurrency: fiat.toLowerCase(),
      paymentMethod: 'all',
      userType: 'all',
      limit: limit.toString(),
      showTrade: 'false',
      showFollow: 'false',
      showAlreadyTraded: 'false',
      isAbleFilter: 'false',
      t: now.toString(),
    })

    let lastError: unknown
    let data: any = null

    // Try multiple base URLs
    const baseUrls = [
      ...OKX_BASE_URLS,
      'https://www.okex.me',
      'https://www.okex.com',
    ]

    for (const baseUrl of baseUrls) {
      const url = `${baseUrl}/v3/c2c/tradingOrders/books`
      const requestUrl = `${url}?${params}`
      const referer = side === 'buy'
        ? `https://www.okx.com/p2p-markets/${fiat.toLowerCase()}/buy-${crypto.toLowerCase()}`
        : `https://www.okx.com/p2p-markets/${fiat.toLowerCase()}/sell-${crypto.toLowerCase()}`

      try {
        const response = await fetchWithTimeout(
          requestUrl,
          {
            headers: {
              ...getOkxHeaders('browser'),
              Referer: referer,
            },
          },
          10000
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        data = await response.json()
        console.log(`[OKX] Raw response from ${baseUrl}:`, JSON.stringify(data, null, 2).substring(0, 2000))
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!data) {
      throw lastError || new Error('OKX fetch failed')
    }

    // Check for OKX API error
    if (data?.code && data.code !== '0') {
      throw new Error(`OKX error ${data.code}: ${data.msg || ''}`)
    }

    // Parse response - OKX C2C API format
    const rawItems = extractRawItems(data, side)

    if (!rawItems) {
      console.error(`[OKX] Could not extract items from response. Data structure:`, JSON.stringify(data, null, 2).substring(0, 1000))
      throw new Error('Invalid OKX response format')
    }

    // Normalize response
    const items: OKXOffer[] = rawItems.slice(0, limit).map((item: any) => ({
      price: parseNumber(item.price ?? item.unitPrice ?? item.priceStr),
      minLimit: parseNumber(item.minSingleTransAmount ?? item.minAmount ?? item.minSingleTransAmountStr),
      maxLimit: parseNumber(item.maxSingleTransAmount ?? item.maxAmount ?? item.maxSingleTransAmountStr),
      available: parseNumber(item.availableAmount ?? item.available ?? item.remainingAmount ?? item.remainAmount),
      paymentMethods: Array.isArray(item.paymentMethods)
        ? item.paymentMethods.map((m: any) => m.paymentMethod || m.name || String(m))
        : [],
      merchantName: item.nickName || item.advertiserName || item.userName || 'Unknown',
      merchantOrders: item.recentCompletedOrderCount
        ? parseInt(item.recentCompletedOrderCount)
        : (item.recentOrderNum ? parseInt(item.recentOrderNum) : undefined),
      merchantCompletionRate: item.recentCompletionRate
        ? parseNumber(item.recentCompletionRate)
        : undefined,
      terms: item.advertisedPayMethod || item.payMethodTip || item.adNotice || item.terms || '',
    }))

    const result: OKXResponse = {
      side,
      fiat,
      crypto,
      items,
      ts: now,
      stale: false,
      source: 'okx-api',
    }

    // Update cache
    cache.set(key, { data: result, timestamp: now })
    lastFetchTime.set(key, Date.now())

    // Reset circuit breaker
    if (cb) {
      circuitBreaker.set(key, {
        failures: 0,
        lastFailureTime: 0,
        lastGoodData: result,
        openUntil: 0,
      })
    }

    return result
  } catch (error) {
    console.error(`[OKX] Fetch error for ${key}:`, error)

    // Update circuit breaker
    const currentCb = circuitBreaker.get(key) || {
      failures: 0,
      lastFailureTime: 0,
      openUntil: 0,
    }

    currentCb.failures++
    currentCb.lastFailureTime = now

    if (currentCb.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      currentCb.openUntil = now + CIRCUIT_BREAKER_TIMEOUT
      console.warn(`[OKX] Circuit breaker opened for ${key}`)
    }

    // Keep last good data
    if (cache.has(key)) {
      currentCb.lastGoodData = cache.get(key)!.data
    }

    circuitBreaker.set(key, currentCb)

    // Return stale data if available
    if (currentCb.lastGoodData) {
      return {
        ...currentCb.lastGoodData,
        stale: true,
        source: 'error-fallback',
      }
    }

    return null
  }
}

// ==================== Fetch from P2P.Army ====================

async function fetchFromP2PArmy(
  side: Side,
  fiat: string,
  crypto: string,
  limit: number
): Promise<OKXResponse | null> {
  if (!P2P_ARMY_API_KEY) return null

  const key = getCacheKey('p2parmy', side, fiat, crypto, limit)
  const now = Date.now()

  const cb = circuitBreaker.get(key)
  if (cb && cb.openUntil > now) {
    console.log(`[P2PArmy] Circuit breaker open for ${key}, returning stale data`)
    return cb.lastGoodData
      ? { ...cb.lastGoodData, stale: true, source: 'circuit-breaker' }
      : null
  }

  const lastFetch = lastFetchTime.get(key) || 0
  const timeSinceLastFetch = now - lastFetch
  if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
    console.log(`[P2PArmy] Rate limited for ${key}, returning cache if available`)
    const cached = cache.get(key)
    if (cached && now - cached.timestamp < CACHE_TTL * 3) {
      return { ...cached.data, stale: true, source: 'rate-limit' }
    }
    await new Promise((resolve) => setTimeout(resolve, MIN_FETCH_INTERVAL - timeSinceLastFetch))
  }

  const cached = cache.get(key)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const response = await fetchWithTimeout(
      `${P2P_ARMY_BASE_URL}/get_p2p_order_book`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-APIKEY': P2P_ARMY_API_KEY,
        },
        body: JSON.stringify({
          market: 'okx',
          fiat,
          asset: crypto,
          side: side.toUpperCase(),
          limit,
        }),
      },
      10000
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    if (data?.status !== 1 || !Array.isArray(data?.ads)) {
      throw new Error('Invalid P2P.Army response')
    }

    const items: OKXOffer[] = data.ads.slice(0, limit).map((item: any) => ({
      price: parseFloat(item.price || '0'),
      minLimit: parseFloat(item.min_fiat || '0'),
      maxLimit: parseFloat(item.max_fiat || '0'),
      available: parseFloat(item.surplus_amount || '0'),
      paymentMethods: Array.isArray(item.payment_methods) ? item.payment_methods : [],
      merchantName: item.user_name || 'Unknown',
      merchantOrders: typeof item.user_orders === 'number' ? item.user_orders : undefined,
      merchantCompletionRate:
        typeof item.user_rate === 'number' ? item.user_rate : undefined,
      terms: item.text || '',
    }))

    const result: OKXResponse = {
      side,
      fiat,
      crypto,
      items,
      ts: now,
      stale: false,
      source: 'p2parmy',
    }

    cache.set(key, { data: result, timestamp: now })
    lastFetchTime.set(key, Date.now())

    if (cb) {
      circuitBreaker.set(key, {
        failures: 0,
        lastFailureTime: 0,
        lastGoodData: result,
        openUntil: 0,
      })
    }

    return result
  } catch (error) {
    console.error(`[P2PArmy] Fetch error for ${key}:`, error)

    const currentCb = circuitBreaker.get(key) || {
      failures: 0,
      lastFailureTime: 0,
      openUntil: 0,
    }

    currentCb.failures++
    currentCb.lastFailureTime = now

    if (currentCb.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      currentCb.openUntil = now + CIRCUIT_BREAKER_TIMEOUT
      console.warn(`[P2PArmy] Circuit breaker opened for ${key}`)
    }

    if (cache.has(key)) {
      currentCb.lastGoodData = cache.get(key)!.data
    }

    circuitBreaker.set(key, currentCb)

    if (currentCb.lastGoodData) {
      return {
        ...currentCb.lastGoodData,
        stale: true,
        source: 'error-fallback',
      }
    }

    return null
  }
}

async function fetchFromSources(
  side: Side,
  fiat: string,
  crypto: string,
  limit: number
): Promise<OKXResponse | null> {
  const sources = getSourceOrder()

  for (const source of sources) {
    if (source === 'okx') {
      const data = await fetchFromOKXSource(side, fiat, crypto, limit)
      if (data) return data
    }

    if (source === 'p2parmy') {
      if (!P2P_ARMY_API_KEY) continue
      const data = await fetchFromP2PArmy(side, fiat, crypto, limit)
      if (data) return data
    }
  }

  return null
}

// ==================== Summary ====================

export async function fetchSummary(
  fiat: string = 'UAH',
  crypto: string = 'USDT',
  limit: number = 10
): Promise<SummaryResponse | null> {
  try {
    const [buyData, sellData] = await Promise.all([
      fetchFromSources('buy', fiat, crypto, limit),
      fetchFromSources('sell', fiat, crypto, limit),
    ])

    if (!buyData || !sellData) {
      return null
    }

    // Sort to get best prices
    const buyItems = [...buyData.items].sort((a, b) => a.price - b.price)
    const sellItems = [...sellData.items].sort((a, b) => b.price - a.price)

    // Best prices:
    // - bestBuy: lowest price from buy side (best seller for you)
    // - bestSell: highest price from sell side (best buyer from you)
    const bestBuy = buyItems[0]?.price || 0
    const bestSell = sellItems[0]?.price || 0
    const mid = (bestBuy + bestSell) / 2

    // Spread: (bestSell - bestBuy) / bestBuy × 100
    // Shows how much you lose on a round trip
    const spreadPct = bestBuy > 0 ? ((bestSell - bestBuy) / bestBuy) * 100 : 0

    return {
      ts: Date.now(),
      fiat,
      crypto,
      bestAsk: bestBuy,  // Best BUY price (you buy USDT at this price)
      bestBid: bestSell, // Best SELL price (you sell USDT at this price)
      mid,
      spreadPct,
      buyTop10: buyItems,
      sellTop10: sellItems,
      stale: buyData.stale || sellData.stale,
    }
  } catch (error) {
    console.error('[OKX] Summary fetch error:', error)
    return null
  }
}

export async function fetchP2P(
  side: Side,
  fiat: string = 'UAH',
  crypto: string = 'USDT',
  limit: number = 10
): Promise<OKXResponse | null> {
  return fetchFromSources(side, fiat, crypto, limit)
}

export function resetCircuitBreaker() {
  console.log('[OKX] Resetting circuit breaker')
  circuitBreaker.clear()
  cache.clear()
  lastFetchTime.clear()
}
