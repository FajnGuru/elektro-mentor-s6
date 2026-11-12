import { guard, getKey, listModels, fail } from '../_lib/gemini.js';

// GET -> vybrané modely podle schopnosti (bez klíčů). Slouží k diagnostice a kontrole nasazení.
export default async function handler(req, res) {
  if (!guard(req, res, 'GET')) return;
  const key = getKey('text');
  const imageKey = getKey('image');
  if (!key) return res.status(503).json({ ok: false, error: 'Na serveru chybí Gemini API klíč (Vercel env GEMINI_API_KEY).', code: 'missing_key' });
  try {
    const m = await listModels(key);
    const mi = imageKey && imageKey !== key ? await listModels(imageKey) : m;
    res.status(200).json({
      ok: true,
      text: m.text.slice(0, 3),
      image: mi.image.slice(0, 3),
      tts: m.tts.slice(0, 3),
      separateImageKey: Boolean(imageKey && imageKey !== key),
    });
  } catch (e) {
    fail(res, e);
  }
}
