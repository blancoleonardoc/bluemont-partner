import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'no session' }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from('assessor_settings')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    session: { email, name: session!.user?.name, image: session!.user?.image },
    settings: data || null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: 'no session' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const payload: any = {
    email,
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    pix_key: body.pix_key ?? null,
    pix_key_type: body.pix_key_type ?? null,
    notifications_enabled: body.notifications_enabled ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseAdmin()
    .from('assessor_settings')
    .upsert(payload, { onConflict: 'email' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data });
}
