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
    const params = new URLSearchParams({
      side,
      fiat,
      crypto,
      paymentMethod: 'all',
      amount: '1000',
    })

    let lastError: unknown
    let data: any = null
    for (const baseUrl of OKX_BASE_URLS) {
      const url = `${baseUrl}/api/v5/dex/aggregate/quote/p2p-ticker`
      const requestUrl = `${url}?${params}`
      try {
        let response = await fetchWithTimeout(
          requestUrl,
          { headers: getOkxHeaders('minimal') },
          10000
        )

        if (!response.ok) {
          response = await fetchWithTimeout(
            requestUrl,
            { headers: getOkxHeaders('browser') },
            10000
          )
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        data = await response.json()
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!data) {
      throw lastError || new Error('OKX fetch failed')
    }

    const rawItems = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.list)
        ? data.data.list
        : Array.isArray(data?.data?.data)
          ? data.data.data
          : null

    if (data?.code && data.code !== '0') {
      throw new Error(`OKX error ${data.code}`)
    }

    if (!rawItems) {
      throw new Error('Invalid OKX response format')
    }

    // Normalize response
    const items: OKXOffer[] = rawItems.slice(0, limit).map((item: any) => ({
      price: parseFloat(item.avgPrice || item.price || '0'),
      minLimit: parseFloat(item.minLimit || '0'),
      maxLimit: parseFloat(item.maxLimit || '0'),
      available: parseFloat(item.availableAmount || item.available || '0'),
      paymentMethods: item.paymentMethods
        ? item.paymentMethods.split(',').map((m: string) => m.trim())
        : Array.isArray(item.paymentMethods)
          ? item.paymentMethods
          : [],
      merchantName: item.nickName || item.advertiserName || item.userName || 'Unknown',
      merchantOrders: item.recentCompletedOrderCount
        ? parseInt(item.recentCompletedOrderCount)
        : undefined,
      merchantCompletionRate: item.recentCompletionRate
        ? parseFloat(item.recentCompletionRate)
        : undefined,
      terms: item.advertisedPayMethod || item.terms || '',
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

    const bestAsk = buyData.items[0]?.price || 0
    const bestBid = sellData.items[0]?.price || 0
    const mid = (bestAsk + bestBid) / 2
    const spreadPct = bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0

    return {
      ts: Date.now(),
      fiat,
      crypto,
      bestAsk,
      bestBid,
      mid,
      spreadPct,
      buyTop10: buyData.items,
      sellTop10: sellData.items,
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
