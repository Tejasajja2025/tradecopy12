import { NextRequest, NextResponse } from 'next/server';
import {
  getForexRate,
  getAllForexRates,
  MAJOR_FOREX_PAIRS,
} from '@/lib/forex-service';

/**
 * GET /api/forex
 * Get all major forex rates or specific pair
 * Query params: pair (optional, e.g., EURUSD)
 */
export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair');

  try {
    if (pair) {
      if (pair.length !== 6) {
        return NextResponse.json(
          { success: false, error: 'Invalid pair format. Use XXXYYY format' },
          { status: 400 }
        );
      }

      const from = pair.substring(0, 3).toUpperCase();
      const to = pair.substring(3, 6).toUpperCase();

      const rate = await getForexRate(from, to);
      if (!rate) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch rate' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        rate,
        serverTime: new Date().toISOString(),
      });
    }

    const rates = await getAllForexRates();
    return NextResponse.json({
      success: true,
      count: rates.length,
      rates,
      pairs: MAJOR_FOREX_PAIRS,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Forex API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
