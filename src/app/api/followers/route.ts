import { NextResponse, NextRequest } from 'next/server';
import { query as sqlQuery, isDatabaseMock } from '@/lib/database';

const MOCK_FOLLOWERS = [
  { id: 'mock-1', followerKey: 'F-101', name: 'Alpha Demo', mt5Login: '500100', status: 'ACTIVE', lastSeen: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 'mock-2', followerKey: 'F-102', name: 'Beta Demo', mt5Login: '500101', status: 'ACTIVE', lastSeen: new Date().toISOString(), created_at: new Date().toISOString() },
];

function isDbConnectionError(error: any) {
  if (!error) return false;
  const message = String(error.message || error.sqlMessage || '');
  return (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    message.includes('ECONNREFUSED') ||
    message.includes('connect ECONNREFUSED') ||
    message.includes('Connection refused')
  );
}

export async function GET() {
  try {
    const [rows] = await sqlQuery(
      `SELECT id, follower_key AS followerKey, name, mt5_login AS mt5Login, status, last_seen AS lastSeen, created_at FROM follower_accounts ORDER BY created_at DESC`,
      []
    );
    const followers = Array.isArray(rows) ? rows : [];
    if (isDatabaseMock()) {
      return NextResponse.json({ success: true, count: MOCK_FOLLOWERS.length, followers: MOCK_FOLLOWERS });
    }
    return NextResponse.json({ success: true, count: followers.length, followers });
  } catch (err: any) {
    console.error('Followers GET failed', err);
    if (isDbConnectionError(err)) {
      return NextResponse.json({ success: true, count: MOCK_FOLLOWERS.length, followers: MOCK_FOLLOWERS });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const followerKey = (body.followerKey || body.key || '').toString().trim();
    const name = (body.name || '').toString().trim() || null;

    if (!followerKey) {
      return NextResponse.json({ success: false, error: 'Missing followerKey' }, { status: 400 });
    }

    try {
      const [result] = await sqlQuery(
        `INSERT INTO follower_accounts (follower_key, name, status) VALUES (?, ?, 'ACTIVE')`,
        [followerKey, name]
      );
      const insertInfo = (result as any);
      return NextResponse.json({ success: true, followerId: insertInfo.insertId, followerKey });
    } catch (sqlErr: any) {
      console.error('Followers insert failed', sqlErr);
      // duplicate key -> return success with existing
      if (sqlErr && sqlErr.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ success: true, followerKey, message: 'already exists' });
      }
      return NextResponse.json({ success: false, error: 'MySQL insert failed' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
