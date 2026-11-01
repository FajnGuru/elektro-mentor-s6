// Převod Markdown/HTML na čistý text pro TTS (systémový hlas, Gemini TTS, nativní Android most).
export function cleanTtsText(input: unknown): string {
  let t = String(input ?? '');
  t = t.replace(/```[\s\S]*?```/g, ' ');            // bloky kódu
  t = t.replace(/<[^>]+>/g, ' ');                    // HTML tagy
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');    // obrázky
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');     // odkazy
  t = t.replace(/^\s*#{1,6}\s*/gm, '');              // nadpisy
  t = t.replace(/^\s*>\s?/gm, '');                   // citace
  t = t.replace(/^\s*([-*+•]|\d+[.)])\s+/gm, '');    // odrážky / číslování
  t = t.replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' '); // oddělovač tabulky
  t = t.replace(/\|/g, ', ');                        // svislítka tabulek
  t = t.replace(/^\s*([-*_]\s*){3,}$/gm, ' ');       // vodorovná čára
  t = t.replace(/[*_~`#]+/g, '');                    // zbylé značky
  t = t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, ''); // emoji
  t = t.replace(/\s*,\s*,+/g, ',').replace(/^[\s,]+|[\s,]+$/gm, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
