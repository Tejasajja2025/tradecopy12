import { NextRequest, NextResponse } from 'next/server';
import { getForexTimeSeries } from '@/lib/forex-service';

/**
 * GET /api/forex/chart
 * Get time series data for charting
 * Query params: pair (required), interval (intraday|daily, default: intraday)
 */
export async function GET(request: NextRequest) {
  const pair = request.nextUrl.searchParams.get('pair');
  const interval = (request.nextUrl.searchParams.get('interval') ||
    'intraday') as 'intraday' | 'daily';

  if (!pair || pair.length !== 6) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid pair parameter' },
      { status: 400 }
    );
  }

  try {
    const timeSeries = await getForexTimeSeries(pair.toUpperCase(), interval);

    return NextResponse.json({
      success: true,
      timeSeries,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Forex chart API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
