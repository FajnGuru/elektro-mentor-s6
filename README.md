# elektro-mentor-s6
ElektroMentor § 6 — interaktivní webová aplikace / HTML demo pro cvičný kvíz elektrotechniků (NV č. 194/2022 Sb. + ČSN). Multi-bot spolupráce.

## Okruhy otázek § 6 (banka „Příprava § 6“)

- Data: `src/data/okruhy/<cat>.json` (jeden soubor na okruh: `zakony`, `normy`, `bezpecnost`, `revize`), převzato z FajnGuru/neuroquest `src/data/otazky-priprava6.json` (18 unikátních otázek) + opravy 4 sporných otázek (Notion, 2026-11-10).
- Schéma: `{id, cat, categoryName, question, options[], correct, explanation, analogie:{autor,text}|null, zdroj:{predpis,clanek,url}|null, overeni:{stav,kdo,datum,poznamka}, obtiznost, puvod}`; `overeni.stav` = `overeno | navrh | sporne`.
- V kvízu: přepínač **Okruhy § 6** + výběr okruhu. **Zkouška nanečisto** jen `overeno`; `navrh` a `sporne` jen v **Tréninku s Mentorem** se štítkem („Návrh – neověřeno“, „k ověření v ČSN“). Po odpovědi vysvětlení, zdroj a Analogie Mistra Karla s 🔊 (cleanTtsText, nativní most v APK).
- Validace: `npm test` (`scripts/validate-okruhy.mjs`) – schéma, právě jedna správná odpověď, duplicity, desetinné čárky u jednotek, zrušené předpisy (vyhl. 50/1978, 73/2010) jako zdroj, čísla v analogii. Spouští se automaticky před `vite build`.
