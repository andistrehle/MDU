// ============================================================
// GitHub-Actions-Ausweis (OIDC) prüfen — für den Bazis-Bot (13.11.2026)
// ============================================================
// Ein Workflow mit `permissions: id-token: write` bekommt von GitHub ein
// signiertes JWT (RS256), das u. a. Repo, Branch und Workflow-Datei nennt.
// Wir prüfen Signatur (Schlüssel von GitHub), Aussteller, Zielgruppe, Ablauf
// und den genauen Workflow auf main. So braucht der Bot KEIN gemeinsames
// Geheimnis — und Forks des öffentlichen Repos kommen nicht durch (anderes Repo).
// ============================================================

import 'server-only';
import { createPublicKey, verify, type JsonWebKey } from 'node:crypto';

const ISS = 'https://token.actions.githubusercontent.com';
export const OIDC_ZIELGRUPPE = 'mdudarts';
const REPO = 'andistrehle/mdu';

type Jwk = JsonWebKey & { kid?: string };
let schluessel: { t: number; keys: Jwk[] } | null = null;

async function jwks(neu = false): Promise<Jwk[]> {
  if (!neu && schluessel && Date.now() - schluessel.t < 3600_000) return schluessel.keys;
  const r = await fetch(`${ISS}/.well-known/jwks`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`JWKS ${r.status}`);
  const keys = ((await r.json()) as { keys: Jwk[] }).keys ?? [];
  schluessel = { t: Date.now(), keys };
  return keys;
}

const b64 = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

/** true, wenn das Token von genau diesem Workflow (Datei) auf main dieses Repos stammt. */
export async function pruefeWorkflowToken(token: string, workflowDatei: string): Promise<boolean> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return false;
    const kopf = JSON.parse(b64(h).toString('utf8')) as { alg?: string; kid?: string };
    if (kopf.alg !== 'RS256' || !kopf.kid) return false;
    let jwk = (await jwks()).find(k => k.kid === kopf.kid);
    if (!jwk) jwk = (await jwks(true)).find(k => k.kid === kopf.kid);
    if (!jwk) return false;
    const echt = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), b64(s));
    if (!echt) return false;
    const c = JSON.parse(b64(p).toString('utf8')) as Record<string, unknown>;
    const jetzt = Date.now() / 1000;
    const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
    return c.iss === ISS
      && aud.includes(OIDC_ZIELGRUPPE)
      && typeof c.exp === 'number' && c.exp > jetzt
      && (typeof c.nbf !== 'number' || c.nbf <= jetzt + 60)
      && String(c.repository ?? '').toLowerCase() === REPO
      && c.ref === 'refs/heads/main'
      && String(c.workflow_ref ?? '').toLowerCase().startsWith(`${REPO}/.github/workflows/${workflowDatei}@refs/heads/main`);
  } catch {
    return false;
  }
}
