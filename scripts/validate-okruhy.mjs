// Validace banky otázek (src/data/okruhy/*.json). Spouští se před každým buildem (npm run build).
// Kontroluje: schéma, právě jednu správnou odpověď, duplicity, desetinné čárky, zrušené předpisy.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'okruhy');
const CATS = ['zakony', 'normy', 'bezpecnost', 'revize'];
const STAVY = ['navrh', 'overeno', 'sporne'];
// Zrušené předpisy – nesmí být citovány jako platný zdroj. V textu otázky smí zaznít jen jako „nahrazený/zrušený“.
const FORBIDDEN = [/50\s*\/\s*1978/, /73\s*\/\s*2010/];
const HISTORY_CONTEXT = /nahradil|nahrazen|zrušen|historick|dříve/i;
// Desetinná tečka u čísla s jednotkou (0.5 MΩ, 1.5 mm², 0.4 s) – v češtině má být čárka.
const DECIMAL_DOT = /\d+\.\d+\s*(MΩ|kΩ|Ω|mA|kA|A|kV|V|kW|W|ms|s|mm²|mm2|mm|m|%|Hz)(?![\p{L}])/u;
const ALLOWED_KEYS = new Set(['id', 'cat', 'categoryName', 'question', 'options', 'correct', 'explanation', 'analogie', 'zdroj', 'overeni', 'obtiznost', 'puvod']);

const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const seenIds = new Set();
const seenQ = new Map();
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').replace(/[„“"'.,?!:;()]/g, '').trim();
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
if (!files.length) errors.push('Žádný soubor okruhu v src/data/okruhy');
let total = 0;
const perStav = { navrh: 0, overeno: 0, sporne: 0 };

for (const file of files) {
  const raw = readFileSync(join(DIR, file), 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) errors.push(`${file}: soubor má BOM`);
  let data;
  try { data = JSON.parse(raw); } catch (e) { errors.push(`${file}: neplatný JSON (${e.message})`); continue; }
  if (!Array.isArray(data)) { errors.push(`${file}: musí být pole otázek`); continue; }
  const fileCat = file.replace(/\.json$/, '');
  for (const q of data) {
    total++;
    const id = q?.id || `${file}#${total}`;
    for (const k of Object.keys(q || {})) if (!ALLOWED_KEYS.has(k)) err(id, `neznámé pole „${k}“`);
    if (!/^p6-[0-9a-f]{8}$/.test(String(q.id || ''))) err(id, 'id musí mít tvar p6-<8 hex>');
    if (seenIds.has(q.id)) err(id, 'duplicitní id'); seenIds.add(q.id);
    if (!CATS.includes(q.cat)) err(id, `neplatný cat „${q.cat}“`);
    if (q.cat !== fileCat) err(id, `cat „${q.cat}“ neodpovídá souboru ${file}`);
    if (!isStr(q.categoryName)) err(id, 'chybí categoryName');
    if (!isStr(q.question)) err(id, 'chybí question');
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(isStr)) err(id, 'options musí být pole ≥ 2 neprázdných textů');
    else {
      if (new Set(q.options.map((o) => String(o).toLowerCase().replace(/\s+/g, ' ').trim())).size !== q.options.length) err(id, 'duplicitní možnosti odpovědí');
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) err(id, 'correct musí být právě jeden platný index (0…n-1)');
    }
    const nq = norm(q.question || '');
    if (seenQ.has(nq)) err(id, `duplicitní otázka s ${seenQ.get(nq)}`); else seenQ.set(nq, q.id);
    if (q.explanation != null && typeof q.explanation !== 'string') err(id, 'explanation musí být text');
    if (q.analogie != null) {
      if (q.analogie.autor !== 'Mistr Karel' || !isStr(q.analogie.text)) err(id, 'analogie musí být {autor:"Mistr Karel", text}');
      // Analogie nesmí přidávat čísla, která nejsou v otázce/odpovědi/vysvětlení.
      const ctx = `${q.question} ${(q.options || []).join(' ')} ${q.explanation || ''}`;
      for (const n of String(q.analogie.text).match(/\d+(?:[,.]\d+)?/g) || []) if (!ctx.includes(n)) err(id, `analogie obsahuje číslo ${n}, které není v otázce ani odpovědi`);
    }
    if (q.zdroj != null) {
      if (!isStr(q.zdroj.predpis)) err(id, 'zdroj.predpis chybí');
      if (q.zdroj.url != null && !/^https?:\/\//.test(q.zdroj.url)) err(id, 'zdroj.url musí být http(s)');
    }
    const st = q.overeni?.stav;
    if (!STAVY.includes(st)) err(id, `overeni.stav musí být ${STAVY.join('|')}`);
    else perStav[st]++;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(q.overeni?.datum || ''))) err(id, 'overeni.datum musí být YYYY-MM-DD');
    if (st === 'overeno' && (!q.zdroj || !isStr(q.zdroj.predpis) || !isStr(q.zdroj.clanek))) err(id, 'ověřená otázka musí mít zdroj.predpis i zdroj.clanek');
    if (q.obtiznost != null && ![1, 2, 3].includes(q.obtiznost)) err(id, 'obtiznost musí být 1, 2, 3 nebo null');
    const texts = [q.question, ...(q.options || []), q.explanation || '', q.analogie?.text || ''];
    for (const t of texts) if (DECIMAL_DOT.test(t)) err(id, `desetinná tečka místo čárky: „${t.match(DECIMAL_DOT)[0]}“`);
    if (q.zdroj?.predpis && FORBIDDEN.some((r) => r.test(q.zdroj.predpis))) err(id, `zdroj cituje zrušený předpis: ${q.zdroj.predpis}`);
    const correctText = q.options?.[q.correct] || '';
    if (FORBIDDEN.some((r) => r.test(correctText))) err(id, 'správná odpověď cituje zrušený předpis');
    for (const t of [q.question, q.explanation || '']) if (FORBIDDEN.some((r) => r.test(t)) && !HISTORY_CONTEXT.test(t)) err(id, 'text cituje zrušený předpis bez uvedení, že je zrušený/nahrazený');
  }
}

if (errors.length) {
  console.error(`❌ Validace otázek selhala (${errors.length}):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`✅ Otázky OK: ${total} (ověřeno ${perStav.overeno}, návrh ${perStav.navrh}, sporné ${perStav.sporne}) v ${files.length} okruzích`);
