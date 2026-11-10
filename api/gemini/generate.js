import { guard, readBody, str, generateWithFallback, fail } from '../_lib/gemini.js';

// POST { prompt, system? } -> { text, model }
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const body = readBody(req);
  const prompt = str(body?.prompt, 8000);
  const system = str(body?.system, 4000);
  if (!prompt.trim()) return res.status(400).json({ error: 'Chybí dotaz.' });
  const payload = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  if (system) payload.systemInstruction = { parts: [{ text: system }] };
  try {
    const { model, data } = await generateWithFallback('text', payload);
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!text) return res.status(502).json({ error: 'Prázdná odpověď od modelu.', model });
    res.status(200).json({ text, model });
  } catch (e) {
    fail(res, e);
  }
}
