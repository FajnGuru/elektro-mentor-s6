// Sdílená serverová logika pro Gemini proxy (Vercel Functions).
// Klíče se čtou JEN tady ze serverových env (GEMINI_API_KEY, GEMINI_IMAGE_API_KEY) – nikdy nejdou do prohlížeče.
// Modely se nenačítají natvrdo: seznam z Gemini Models API, výběr nejnovější verze podle schopnosti, fallback na starší.

const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODELS_TTL_MS = 60 * 60 * 1000; // seznam modelů cachovat 1 h v instanci funkce
const MAX_BODY_BYTES = 64 * 1024;

const cache = new Map(); // klíč (hash prefixu) -> { at, models }

function isPlaceholder(v) {
  return !v || /^(DOPLNIT|TODO|CHANGEME|placeholder)$/i.test(String(v).trim());
}

export function getKey(kind = 'text') {
  const main = process.env.GEMINI_API_KEY;
  const image = process.env.GEMINI_IMAGE_API_KEY;
  // Dočasná serverová záloha na původní proměnnou (čte se jen na serveru, do bundlu se nedostane).
  const legacy = process.env.VITE_GEMINI_API_KEY;
  const pick = (...vals) => vals.find((v) => !isPlaceholder(v)) || '';
  return kind === 'image' ? pick(image, main, legacy) : pick(main, legacy);
}

// --- Ochrana proti zneužití ---------------------------------------------------
function allowedOrigin(origin) {
  if (!origin) return true; // stejný origin bez hlavičky / server-to-server kontrola
  try {
    const u = new URL(origin);
    const h = u.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return true;
    if (h === 'elektro-mentor-s6.vercel.app') return true;
    if (h.endsWith('.vercel.app') && h.startsWith('elektro-mentor-s6')) return true; // preview nasazení
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return extra.includes(u.origin);
  } catch {
    return false;
  }
}

export function guard(req, res, method = 'POST') {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== method) {
    res.setHeader('Allow', method);
    res.status(405).json({ error: 'Metoda není povolena.' });
    return false;
  }
  if (!allowedOrigin(req.headers.origin)) {
    res.status(403).json({ error: 'Nepovolený původ požadavku.' });
    return false;
  }
  const len = Number(req.headers['content-length'] || 0);
  if (len > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'Požadavek je příliš velký.' });
    return false;
  }
  return true;
}

export function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > MAX_BODY_BYTES) return null;
    try { b = JSON.parse(b); } catch { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

export function str(v, max) {
  if (typeof v !== 'string') return '';
  return v.slice(0, max);
}

// --- Výběr modelů ------------------------------------------------------------
function parseVersion(id) {
  const m = id.match(/^gemini-(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function capabilityOf(id) {
  if (/tts/.test(id)) return 'tts';
  if (/image/.test(id)) return 'image';
  if (/(embedding|aqa|live|native-audio|audio|robotics|computer-use|veo|imagen|lyria|learnlm|gemma|deep-research)/.test(id)) return null;
  return 'text';
}

function score(id, cap) {
  let s = parseVersion(id) * 1000;
  // varianta: pro text i obrázky upřednostnit rychlé „flash“, pak pro, nakonec lite
  if (/flash-lite/.test(id)) s += 100;
  else if (/flash/.test(id)) s += 300;
  else if (/pro/.test(id)) s += 200;
  if (/-latest$/.test(id)) s -= 5;
  if (/exp/.test(id)) s -= 50;
  if (/preview/.test(id)) s -= 1; // při stejné verzi stabilní před preview
  const d = id.match(/-(\d{2})-(\d{4})$/); // datované varianty (např. -09-2025) mírně níž než alias
  if (d) s -= 2;
  return s;
}

export async function listModels(apiKey) {
  const ck = apiKey.slice(-6);
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < MODELS_TTL_MS) return hit.models;
  const out = [];
  let pageToken = '';
  for (let i = 0; i < 5; i++) {
    const url = `${API}/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await fetch(url, { headers: { 'x-goog-api-key': apiKey } });
    if (!r.ok) throw Object.assign(new Error(`models HTTP ${r.status}`), { status: r.status });
    const j = await r.json();
    for (const m of j.models || []) {
      const id = String(m.name || '').replace(/^models\//, '');
      if (!id.startsWith('gemini-')) continue;
      if (!(m.supportedGenerationMethods || []).includes('generateContent')) continue;
      out.push(id);
    }
    pageToken = j.nextPageToken || '';
    if (!pageToken) break;
  }
  const models = { text: [], image: [], tts: [] };
  for (const id of out) {
    const cap = capabilityOf(id);
    if (cap) models[cap].push(id);
  }
  for (const cap of Object.keys(models)) {
    models[cap].sort((a, b) => score(b, cap) - score(a, cap));
  }
  cache.set(ck, { at: Date.now(), models });
  return models;
}

// Zavolá generateContent na nejlepší model dané schopnosti; při 404/429/5xx/400-nepodporováno zkusí další (starší).
export async function generateWithFallback(cap, payload, { keyKind, maxTries = 3, timeoutMs = 55000 } = {}) {
  const apiKey = getKey(keyKind || cap);
  if (!apiKey) {
    const e = new Error('Na serveru chybí Gemini API klíč (Vercel env GEMINI_API_KEY).');
    e.status = 503;
    e.code = 'missing_key';
    throw e;
  }
  const models = (await listModels(apiKey))[cap] || [];
  if (!models.length) throw Object.assign(new Error(`Žádný dostupný model pro „${cap}“.`), { status: 503 });
  const started = Date.now();
  let lastErr;
  for (const model of models.slice(0, maxTries)) {
    const left = timeoutMs - (Date.now() - started);
    if (left < 3000) break;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), left);
    try {
      const r = await fetch(`${API}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (r.ok) return { model, data: await r.json() };
      lastErr = Object.assign(new Error(`Gemini HTTP ${r.status}`), { status: r.status });
      if (r.status === 401 || r.status === 403) break; // špatný klíč – další model nepomůže
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr || new Error('Gemini nevrátil odpověď.');
}

export function fail(res, e) {
  const status = e?.status === 401 || e?.status === 403 ? 502 : e?.status === 429 ? 429 : e?.status === 503 ? 503 : 502;
  res.status(status).json({ error: e?.message || 'Chyba AI služby.', code: e?.code || undefined });
}
