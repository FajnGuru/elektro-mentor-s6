import { guard, readBody, str, generateWithFallback, fail } from '../_lib/gemini.js';

// POST { text, voice? } -> binární PCM16 (audio/L16), hlavička X-Sample-Rate, X-Model.
// Binárně (ne base64), aby se delší úsek vešel do limitu odpovědi 4,5 MB. Klient dlouhý text dělí na části.
const VOICES = new Set(['Orus', 'Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Zephyr', 'Leda']);

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const body = readBody(req);
  const text = str(body?.text, 1200);
  const voiceName = VOICES.has(body?.voice) ? body.voice : 'Orus';
  if (!text.trim()) return res.status(400).json({ error: 'Chybí text.' });
  const payload = {
    contents: [{ parts: [{ text: `Přečti v češtině klidným, přátelským a srozumitelným hlasem zkušeného mentora tento odstavec: ${text}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  };
  try {
    const { model, data } = await generateWithFallback('tts', payload, { maxTries: 2 });
    const part = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
    const mime = part?.inlineData?.mimeType || '';
    if (!part || !mime.startsWith('audio/')) return res.status(502).json({ error: 'Neplatná audio odpověď.', model });
    const rate = (mime.match(/rate=(\d+)/) || [])[1] || '24000';
    const buf = Buffer.from(part.inlineData.data, 'base64');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Sample-Rate', rate);
    res.setHeader('X-Model', model);
    res.status(200).send(buf);
  } catch (e) {
    fail(res, e);
  }
}
