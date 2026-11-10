// Banka otázek „Příprava § 6“ po okruzích (src/data/okruhy/<cat>.json).
// Převod do tvaru, který používá kvíz v App.tsx (correctIndex, category, mentorAnalogy, ruleReference).
import zakony from '../data/okruhy/zakony.json';
import normy from '../data/okruhy/normy.json';
import bezpecnost from '../data/okruhy/bezpecnost.json';
import revize from '../data/okruhy/revize.json';

export type OkruhStav = 'navrh' | 'overeno' | 'sporne';

export const OKRUHY = [
  { cat: 'zakony', label: 'Zákony a NV', data: zakony },
  { cat: 'normy', label: 'ČSN normy a sítě', data: normy },
  { cat: 'bezpecnost', label: 'Bezpečnost a první pomoc', data: bezpecnost },
  { cat: 'revize', label: 'Revize a měření', data: revize }
] as const;

export const STAV_LABEL: Record<OkruhStav, string> = {
  overeno: 'Ověřeno',
  navrh: 'Návrh – neověřeno',
  sporne: 'k ověření v ČSN'
};

// Deterministické zamíchání možností (v datech je správná vždy první) – stejné pořadí při každém načtení.
function seededShuffle<T>(arr: T[], seed: string): { items: T[]; order: number[] } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const order = arr.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { items: order.map((i) => arr[i]), order };
}

export const formatZdroj = (z: any): string =>
  z && z.predpis ? [z.predpis, z.clanek].filter(Boolean).join(', ') : '';

export const P6_QUESTIONS = OKRUHY.flatMap(({ cat, label, data }) =>
  (data as any[]).map((q) => {
    const { items, order } = seededShuffle(q.options as string[], q.id);
    return {
      id: q.id as string,
      isP6: true,
      cat,
      okruhLabel: label,
      category: q.categoryName as string,
      question: q.question as string,
      options: items,
      correctIndex: order.indexOf(q.correct),
      explanation: (q.explanation || '') as string,
      analogie: q.analogie as null | { autor: string; text: string },
      zdroj: q.zdroj as null | { predpis: string; clanek: string | null; url: string | null },
      overeni: q.overeni as { stav: OkruhStav; kdo: string | null; datum: string; poznamka?: string },
      // pro existující funkce (AI rozbor, AI obrázek)
      mentorAnalogy: (q.analogie?.text || q.explanation || '') as string,
      ruleReference: formatZdroj(q.zdroj) || 'zdroj zatím neuveden'
    };
  })
);
