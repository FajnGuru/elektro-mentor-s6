import { guard, readBody, str, generateWithFallback, fail } from '../_lib/gemini.js';

const RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);

// POST { prompt, aspectRatio? } -> { mimeType, data (base64), model }
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const body = readBody(req);
  const prompt = str(body?.prompt, 6000);
  const aspectRatio = RATIOS.has(body?.aspectRatio) ? body.aspectRatio : '16:9';
  if (!prompt.trim()) return res.status(400).json({ error: 'Chybí zadání obrázku.' });
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
  };
  try {
    const { model, data } = await generateWithFallback('image', payload, { keyKind: 'image', maxTries: 2 });
    const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
    if (!part) return res.status(502).json({ error: 'Obrázek nebyl v odpovědi nalezen.', model });
    res.status(200).json({ mimeType: part.inlineData.mimeType || 'image/png', data: part.inlineData.data, model });
  } catch (e) {
    fail(res, e);
  }
}
