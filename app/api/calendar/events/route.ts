import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;
  if (!session || !accessToken) {
    return NextResponse.json({ error: 'no session or access token' }, { status: 401 });
  }

  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', now.toISOString());
  url.searchParams.set('timeMax', end.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const r = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: 'google calendar error', status: r.status, detail: text }, { status: 502 });
  }
  const data = await r.json();
  const events = (data.items || []).map((e: any) => ({
    id: e.id,
    title: e.summary,
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || '',
    htmlLink: e.htmlLink,
  }));
  return NextResponse.json({ events });
}
