// ============================================================
// Route Handler: Admin → Statistik → Web-App (nur Super-Admin)
// ============================================================
// Installationen (Migration 0064) und Push-Geräte (Migration 0056) gezählt —
// keine einzelnen Geräte, nur Summen.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Inst = { plattform: string; erst_am: string; zuletzt_am: string; tage: number };

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ error: 'Nur für den Betreiber.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB fehlt' }, { status: 500 });
  const [inst, push] = await Promise.all([
    supabaseAdmin.from('app_installationen').select('plattform, erst_am, zuletzt_am, tage'),
    supabaseAdmin.from('push_subscriptions').select('user_id, endpoint, created_at, last_ok_at'),
  ]);
  if (inst.error) return NextResponse.json({ error: /app_installationen/.test(inst.error.message) ? 'Migration 0064 fehlt noch.' : inst.error.message }, { status: 500 });
  const i = (inst.data ?? []) as Inst[];
  const tageHer = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  const jePlattform: Record<string, number> = {};
  for (const x of i) jePlattform[x.plattform] = (jePlattform[x.plattform] ?? 0) + 1;
  const neuJeTag: Record<string, number> = {};
  for (const x of i) { const t = x.erst_am.slice(0, 10); neuJeTag[t] = (neuJeTag[t] ?? 0) + 1; }
  const p = (push.data ?? []) as { user_id: string; endpoint: string; created_at: string; last_ok_at: string | null }[];
  return NextResponse.json({
    installationen: {
      gesamt: i.length,
      aktiv7: i.filter(x => x.zuletzt_am >= tageHer(7)).length,
      aktiv30: i.filter(x => x.zuletzt_am >= tageHer(30)).length,
      jePlattform, neuJeTag,
    },
    push: {
      geraete: p.length, personen: new Set(p.map(x => x.user_id)).size,
      iphone: p.filter(x => x.endpoint.includes('push.apple.com')).length,
      zugestellt: p.filter(x => x.last_ok_at).length,
    },
  });
}
