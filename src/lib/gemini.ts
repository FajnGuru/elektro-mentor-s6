// Klient pro serverové Gemini funkce (/api/gemini/*). Žádné klíče ani názvy modelů v prohlížeči.

// Přibalená offline kopie v APK (appassets.androidplatform.net) ani file:// nemá serverové API.
export function aiAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  if (!/^https?:$/.test(protocol)) return false;
  if (hostname === 'appassets.androidplatform.net') return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return true;
}

export class AiError extends Error {
  status: number;
  code?: string;
  constructor(msg: string, status = 0, code?: string) {
    super(msg);
    this.status = status;
    this.code = code;
  }
}

async function post(path: string, body: unknown): Promise<Response> {
  if (!aiAvailable()) throw new AiError('AI funkce jsou dostupné jen online (ne v offline verzi).', 0, 'offline');
  const res = await fetch(`/api/gemini/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
      code = j?.code;
    } catch { /* ne-JSON odpověď */ }
    throw new AiError(msg, res.status, code);
  }
  return res;
}

// Chyby, u kterých nemá smysl zkoušet znovu (chybí klíč, offline, špatný požadavek).
export function isFinalError(e: unknown): boolean {
  const err = e as AiError;
  return err?.code === 'missing_key' || err?.code === 'offline' || err?.status === 400 || err?.status === 403 || err?.status === 405 || err?.status === 413;
}

export async function aiGenerate(prompt: string, system?: string): Promise<string> {
  const res = await post('generate', { prompt, system });
  const j = await res.json();
  return j.text as string;
}

export async function aiImage(prompt: string, aspectRatio = '16:9'): Promise<{ mimeType: string; data: string }> {
  const res = await post('image', { prompt, aspectRatio });
  const j = await res.json();
  return { mimeType: j.mimeType, data: j.data };
}

// Rozdělí text na části do ~900 znaků podle vět (limit odpovědi serverové funkce).
export function splitForTts(text: string, max = 900): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t ? [t] : [];
  const sentences = t.match(/[^.!?…]+[.!?…]+["“”»)]*\s*|[^.!?…]+$/g) || [t];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) { out.push(cur.trim()); cur = ''; }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

// Vrátí PCM16 + vzorkovací frekvenci pro jeden úsek textu.
export async function aiTtsChunk(text: string, voice = 'Orus'): Promise<{ pcm: Int16Array; sampleRate: number }> {
  const res = await post('tts', { text, voice });
  const sampleRate = parseInt(res.headers.get('X-Sample-Rate') || '24000', 10) || 24000;
  const buf = await res.arrayBuffer();
  return { pcm: new Int16Array(buf, 0, Math.floor(buf.byteLength / 2)), sampleRate };
}
