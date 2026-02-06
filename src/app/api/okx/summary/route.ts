import { NextRequest, NextResponse } from 'next/server'
import { fetchSummary } from '@/lib/okx'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fiat = searchParams.get('fiat') || 'UAH'
  const crypto = searchParams.get('crypto') || 'USDT'
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const data = await fetchSummary(fiat, crypto, limit)

    if (!data) {
      const hint = process.env.P2P_ARMY_API_KEY
        ? undefined
        : 'Set P2P_ARMY_API_KEY to enable fallback data source'
      return NextResponse.json(
        { error: 'Failed to fetch summary from OKX', hint },
        { status: 503 }
      )
    }

    // Cache headers
    const response = NextResponse.json(data)
    response.headers.set(
      'Cache-Control',
      's-maxage=10, stale-while-revalidate=20'
    )

    return response
  } catch (error) {
    console.error('[API] Summary fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
