import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldAlert,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Flame,
  HeartPulse,
  FileText,
  Users,
  Lock,
  Search,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Sliders,
  Check,
  Volume2,
  Square,
  Loader2,
  Image as ImageIcon,
  Wand2,
  ZoomIn,
  X,
  FolderOpen,
  Download,
  Trash2,
  Upload,
  Link2
} from 'lucide-react';
import {
  loadAllImages, putImage, deleteImage, requestPersist, storageEstimate,
  exportFileName, guessKey, blobToDataUrl, mimeOf, isImageName, fmtMB
} from './imageStore';

// ==========================================
// POMOCNÉ FUNKCE PRO GEMINI TTS (PCM16 -> WAV)
// ==========================================
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcmToWav(pcm16, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i++, offset += 2) {
    view.setInt16(offset, pcm16[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// ==========================================
// DATA: ANALOGIE A STUDIJNÍ KARTY (MISTR KAREL)
// ==========================================
const STUDY_TOPICS = [
  {
    id: 'hierarchie',
    category: 'Legislativa (NV č. 194/2022 Sb.)',
    title: 'Kdo je kdo: § 4, § 6, § 7 a § 8',
    icon: Users,
    badge: 'Základ u zkoušky',
    officialText:
      'Nařízení vlády č. 194/2022 Sb. dělí pracovníky na osoby poučené (§ 4) a osoby znalé (§ 5), mezi které patří Elektrotechnik (§ 6), Vedoucí elektrotechnik (§ 7) a Revizní technik (§ 8). Osvědčení se obnovuje každé 3 roky.',
    analogyTitle: 'Analogie: Autoškola a autoservis',
    analogyText:
      'Představte si elektriku jako provoz aut:\n• § 4 (Osoba poučená) je běžný řidič, co si umí dolít vodu do ostřikovačů a natankovat, ale nesmí rozebírat motor.\n• § 6 (Elektrotechnik – VY) je vyučený automechanik. Může sám opravovat auto, měnit brzdy i motor, ale řídí se dílenskou příručkou.\n• § 7 (Vedoucí elektrotechnik) je šéf servisu. Rozděluje práci mechanikům, hlídá bezpečnost celé dílny a řeší složité zakázky.\n• § 8 (Revizní technik) je technik na STK. Sám auta neopravuje, ale dává razítko, že je auto bezpečné pro provoz.',
    examTrap:
      'Chyták u zkoušky: Stará vyhláška č. 50/1978 Sb. měla § 5 jako samostatný stupeň pro začátečníky. V novém NV č. 194/2022 Sb. je § 5 jen souhrnný nadpis pro „Osoby znalé“ a vy jdete rovnou na § 6 (Elektrotechnik)!',
    keyPoints: [
      'Podmínkou pro § 6 je odborné elektrotechnické vzdělání (nebo příslušná profesní kvalifikace) a praxe.',
      'Písemný test vyžaduje minimálně 80 % správných odpovědí.',
      'Platnost přezkoušení je přesně 3 roky.'
    ]
  },
  {
    id: '5pravidel',
    category: 'Bezpečná práce (ČSN EN 50110-1)',
    title: '5 zlatých pravidel práce bez napětí',
    icon: Lock,
    badge: 'Nejdůležitější otázka',
    officialText:
      'Pro zajištění pracoviště pro práci bez napětí musíte dodržet přesné pořadí: 1. Úplné odpojení ze všech stran, 2. Zajištění proti opětovnému zapnutí, 3. Ověření beznapěťového stavu, 4. Uzemnění a zkratování, 5. Ochrana proti živým částem v okolí.',
    analogyTitle: 'Analogie: Oprava prasklého vodovodu v domě',
    analogyText:
      'Představte si, že měníte prasklou trubku s vařící vodou pod obřím tlakem:\n1. Úplné odpojení = Zavřete hlavní uzávěr vody ve sklepě.\n2. Zajištění proti zapnutí = Na kohout dáte visací zámek a cedulku „NEZAPÍNAT, OPRAVUJI!“, aby vám soused vodu nepustil, když máte rozřezanou trubku.\n3. Ověření beznapěťovosti = Otevřete kohoutek v koupelně a zkontrolujete, jestli voda opravdu neteče (přičemž víte, že kohoutek není ucpaný).\n4. Uzemnění a zkratování = Napojíte nouzový odtok rovnou do kanálu – kdyby ventil přece jen povolil, voda odteče do kanálu a neopaří vás.\n5. Ochrana okolí = Dáte plachtu kolem vedlejší horké trubky, abyste se o ni při práci s klíčem nespálili.',
    examTrap:
      'Chyták u zkoušky: Jak ověříte, že zkoušečka napětí nelže? Musíte ověřit její funkčnost TŘIKRÁT resp. PŘED a bezprostředně PO měření na části, o které víte, že je pod napětím (nebo zkušebním zdrojem). Kdyby se zkoušečka rozbila těsně před měřením, neukázala by nic a vy byste sáhli do živého!',
    keyPoints: [
      'Pořadí kroků 1 až 5 nesmíte nikdy přehodit!',
      'Samotné vypnutí tlačítkem STOP nebo stykačem nestačí jako bezpečné odpojení.',
      'Při měření beznapěťovosti před odpojením či zajištěním používáme OOPP (izolační rukavice, obličejový štít).'
    ]
  },
  {
    id: 'druhyprace',
    category: 'Provoz a práce (ČSN EN 50110-1)',
    title: 'Práce bez napětí, v blízkosti a pod napětím (PPN)',
    icon: ShieldAlert,
    badge: 'Časté u ústní zkoušky',
    officialText:
      'Práce na elektrickém zařízení se dělí na: 1. Práci bez napětí (zařízení je odpojené a zajištěné), 2. Práci v blízkosti živých částí (v ochranném prostoru kolem živých částí), 3. Práci pod napětím (PPN - dotyk živých částí nebo vniknutí do zóny PPN).',
    analogyTitle: 'Analogie: Úklid výběhu se lvem v ZOO',
    analogyText:
      'Živá část pod napětím je jako hladový lev:\n• Práce bez napětí = Lev je zavřený v jiné budově na petlici (5 pravidel) a vy v klidu zametáte prázdný výběh.\n• Práce v blízkosti (PBN) = Lev je ve výběhu, vy natíráte mříže zvenku. Když ale prostrčíte ruku moc blízko mříží (zóna přiblížení), může vás seknout drápem.\n• Práce pod napětím (PPN) = Jdete přímo do klece k živému lvu. To smíte jen se speciálním brněním (OOPP), výcvikem a jasným technologickým postupem!',
    examTrap:
      'Chyták u zkoušky: Smí elektrotechnik (§ 6) pracovat pod napětím (PPN)? ANO, ale pouze za stanovených podmínek, podle schválených pracovních postupů (MPBP) a s příslušným pokynem!',
    keyPoints: [
      'Zóna práce pod napětím (DL) je bezprostřední obálka kolem živé části.',
      'Zóna přiblížení (DV) je širší prostor kolem zóny DL – vstup do ní = práce v blízkosti.',
      'Při bouřce, husté mlze nebo špatné viditelnosti se práce pod napětím venku nesmí zahájit.'
    ]
  },
  {
    id: 'ochrana',
    category: 'Technické normy (ČSN 33 2000-4-41)',
    title: 'Základní ochrana, ochrana při poruše a chránič (RCD)',
    icon: Zap,
    badge: 'Technické jádro',
    officialText:
      'Ochrana před úrazem elektrickým proudem se skládá ze: 1. Základní ochrany (ochrana před dotykem živých částí, např. izolace, kryty IP2X/IPXXB) a 2. Ochrany při poruše (ochrana před dotykem neživých částí, např. automatické odpojení od zdroje). Doplňkovou ochranu tvoří proudový chránič (RCD) s IΔn ≤ 30 mA.',
    analogyTitle: 'Analogie: Zábradlí na mostě, airbag a vodoměr',
    analogyText:
      '• Základní ochrana (izolace kabelu, kryt zásuvky) je jako zábradlí na mostě – brání vám spadnout do řeky při běžné chůzi.\n• Ochrana při poruše (pospojování + jistič/chránič) je jako záchranná síť pod mostem – když praskne zábradlí (prodře se izolace a fáze se dotkne kovové pračky), síť okamžitě zareaguje a vypne proud.\n• Proudový chránič (RCD 30 mA) funguje jako extrémně přesný účetní u dveří: počítá každý elektron, který vteče dovnitř fází, a porovnává ho s těmi, které se vrací nulákem (N). Jakmile se 30 miliampérů „ztratí“ (protože tečou přes vaše tělo do země), do zlomku vteřiny vyrazí pojistku!',
    examTrap:
      'Chyták u zkoušky: Jistič chrání primárně KABELY před vyhořením (zkratem a přetížením – vypíná při desítkách ampérů). ČLOVĚKA při přímém dotyku zachrání proudový chránič (RCD), protože reaguje už na 30 mA (0,03 A)!',
    keyPoints: [
      'Zásuvkové obvody do 32 A pro laiky a venkovní mobilní zařízení do 32 A musí mít chránič ≤ 30 mA.',
      'Maximální doba odpojení v síti TN (230 V AC) pro koncové obvody do 63 A je 0,4 s.',
      'Bezpečné malé napětí SELV (neuzemněné) a PELV (uzemněné) je v normálních prostorech do 50 V AC / 120 V DC.'
    ]
  },
  {
    id: 'mpbp',
    category: 'Provozní dokumentace',
    title: 'MPBP a Příkaz „B“',
    icon: FileText,
    badge: 'Praxe a organizace',
    officialText:
      'Místní provozní bezpečnostní předpis (MPBP) stanovuje konkrétní pracovní postupy, rizika a zakázané činnosti pro dané pracoviště. Příkaz B je písemný příkaz k práci na zařízeních vysokého napětí (VN) nebo při zvlášť nebezpečných pracích.',
    analogyTitle: 'Analogie: Domácí řád vs. Letový plán pilota',
    analogyText:
      '• MPBP je jako pravidla vaší konkrétní dílny: zákon říká obecně „chovejte se bezpečně“, ale MPBP říká přesně: „V hale č. 3 se hlavní rozvaděč vypíná tímto červeným klíčem, který visí u mistra, a do transformátorovny nesmí nikdo bez přilby.“\n• Příkaz B je jako předletový checklist pilota stíhačky: než sáhnete do vysokého napětí, máte černé na bílém napsáno KDO je vedoucí práce, KDO a KDY zařízení vypnul, KDE jsou zkratovací soupravy a všichni to podepíší.',
    examTrap:
      'Chyták u zkoušky: Kdo vydává MPBP? Vydává ho ZAMĚSTNAVATEL (provozovatel zařízení), nikoliv stát nebo inspektorát práce.',
    keyPoints: [
      'MPBP musí obsahovat konkrétní pokyny a zakázané činnosti pro dané pracoviště.',
      'Každý pracovník musí být s MPBP prokazatelně (podpisem) seznámen.',
      'Revize vyhrazených elektrických zařízení smí provádět výhradně revizní technik (§ 8).'
    ]
  },
  {
    id: 'prvnipomoc',
    category: 'První pomoc a požární ochrana',
    title: 'První pomoc při úrazu proudem a hašení',
    icon: HeartPulse,
    badge: '100% v testu',
    officialText:
      'Při úrazu el. proudem je prvním krokem vyproštění postiženého z dosahu proudu (vypnutím zdroje, odsunutím izolovaným předmětem při zachování vlastní bezpečnosti). Při bezvědomí a zástavě dechu se zahajuje KPR v poměru 30 stlačení : 2 vdechy frekvencí 100–120/min do hloubky 5–6 cm. Zařízení pod napětím se nikdy nehasí vodou ani pěnou!',
    analogyTitle: 'Analogie: Záchranář s chladnou hlavou a rytmus „Stayin\' Alive“',
    analogyText:
      '• Vyproštění: Mrtvý zachránce nikomu nepomůže! Pokud se kolega drží živého drátu, jeho tělo je v tu chvíli v podstatě odhalený vodič. Když ho chytnete holou rukou, proud projde i vámi. První krok je VŽDY vypnout jistič/stopku.\n• Resuscitace (30 : 2): Srdce zasažené proudem často „kmitá“ (fibriluje) a nečerpá krev do mozku. Vaše ruce uprostřed hrudníku fungují jako náhradní mechanické čerpadlo. Tlačíte rytmem písničky „Stayin\' Alive“ od Bee Gees (cca 100–120× za minutu).\n• Hašení: Voda a pěna vedou proud jako drát. Stříknout vodním hasičákem do rozvaděče pod napětím je stejné jako strčit do něj kovovou tyč a držet ji v ruce. Použijte sněhový (CO2) nebo práškový přístroj!',
    examTrap:
      'Chyták u zkoušky: I když postižený po zásahu proudem vypadá úplně v pořádku a říká „nic mi není, jen mě to brnklo“, MUSÍ být vždy vyšetřen lékařem (kvůli riziku opožděné srdeční arytmie a vnitřního popálení)!',
    keyPoints: [
      'Poměr KPR u dospělého: 30 stlačení hrudníku ku 2 umělým vdechům (nebo nepřetržitá masáž 100–120/min).',
      'Zařízení pod napětím Nynější předpisy zakazují hasit vodním a pěnovým hasicím přístrojem.',
      'Vhodný hasicí přístroj pro rozvaděče a elektroniku je sněhový (CO2) nebo práškový (do 1000 V s dodržením bezpečné vzdálenosti).'
    ]
  }
];

// ==========================================
// DATA: KVÍZOVÉ OTÁZKY (10 Z VAŠEHO TESTU + 5 KLÍČOVÝCH DOPLŇKŮ)
// ==========================================
const QUIZ_QUESTIONS = [
  {
    id: 1,
    fromArtifact: true,
    category: 'Legislativa (§ 6)',
    question:
      'Jaké základní odborné vzdělání je vyžadováno pro získání osvědčení pro elektrotechnika podle § 6 nařízení vlády č. 194/2022 Sb.?',
    options: [
      'Odborné vzdělání elektrotechnického směřování (nebo příslušná profesní kvalifikace).',
      'Jakékoliv středoškolské vzdělání s maturitou a 1 měsíc zaškolení.',
      'Postačuje základní vzdělání a podpis čestného prohlášení.',
      'Výhradně vysokoškolské vzdělání v oboru silnoproudá elektrotechnika.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Vzpomeňte si na analogii s autoservisem: Na § 6 (Elektrotechnik) už nejste jen řidič (§ 4), ale mechanik. Musíte mít výuční list, maturitu nebo VŠ v oboru elektro (případně úplnou profesní kvalifikaci podle NSK).',
    ruleReference: '§ 6 odst. 1 NV č. 194/2022 Sb.'
  },
  {
    id: 2,
    fromArtifact: true,
    category: 'Bezpečná práce (ČSN EN 50110-1)',
    question:
      'Který z následujících kroků patří mezi pět zlatých pravidel bezpečné práce na elektrickém zařízení podle ČSN EN 50110-1?',
    options: [
      'Úplné odpojení a zajištění proti opětovnému zapnutí.',
      'Snížení napětí na polovinu pomocí autotransformátoru.',
      'Nahlášení zahájení práce místní hasičské stanici.',
      'Pouze vypnutí obvodu ovládacím tlačítkem STOP bez dalšího zajištění.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Jako u opravy prasklého vodovodu: První dvě zlatá pravidla jsou 1. Úplně zavřít hlavní ventil (úplné odpojení) a 2. Dát na něj zámek a cedulku (zajištění proti opětovnému zapnutí).',
    ruleReference: 'ČSN EN 50110-1 ed. 3, čl. 6.2'
  },
  {
    id: 3,
    fromArtifact: true,
    category: 'Požární ochrana',
    question:
      'Jaký typ hasicího přístroje se nesmí za žádných okolností použít k hašení zařízení pod elektrickým napětím?',
    options: [
      'Vodní hasicí přístroj (a pěnový).',
      'Sněhový hasicí přístroj (CO2).',
      'Práškový hasicí přístroj určený do 1000 V.',
      'Halotronový hasicí přístroj.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Voda obsahuje minerály a vede proud jako drát. Hasit rozvaděč pod napětím vodou je jako propojit živou fázi přímo se svýma rukama!',
    ruleReference: 'Pravidla PO a BOZP pro hašení el. zařízení'
  },
  {
    id: 4,
    fromArtifact: true,
    category: 'Legislativa (NV č. 194/2022 Sb.)',
    question:
      'Kdo je oprávněn provádět pravidelné revize elektrických vyhrazených zařízení?',
    options: [
      'Odborně způsobilá osoba pro revize – revizní technik (§ 8).',
      'Každý elektrotechnik s § 6 po třech letech praxe.',
      'Osoba poučená (§ 4) pod dohledem mistra.',
      'Majitel objektu nebo správce budovy.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Revize je jako technická kontrola (STK) u auta. Mechanik (§ 6) auto opraví a zapojí, ale úřední razítko o revizi smí dát pouze technik STK – tedy Revizní technik s § 8 a platným osvědčením od TIČR.',
    ruleReference: '§ 8 NV č. 194/2022 Sb. a zákon č. 250/2021 Sb.'
  },
  {
    id: 5,
    fromArtifact: true,
    category: 'Bezpečná práce (ČSN EN 50110-1)',
    question:
      'Kdy se provádí ověření beznapěťovosti na elektrickém zařízení při jeho zajišťování?',
    options: [
      'Bezprostředně po odpojení a zajištění proti opětovnému zapnutí (jako 3. krok).',
      'Až po namontování zkratovacích souprav a dokončení práce.',
      'Pouze den předem při plánování odstávky.',
      'Ověření není nutné, pokud zhasla kontrolka na rozvaděči.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      '3. zlaté pravidlo! Nejdřív vypnete (1), pak zamknete (2) a HNED POTOM zkoušečkou ověříte, že tam opravdu nic neteče (3). Teprve když máte jistotu, že je zařízení bez napětí, smíte ho uzemnit a zkratovat (4).',
    ruleReference: 'ČSN EN 50110-1 ed. 3, čl. 6.2.3'
  },
  {
    id: 6,
    fromArtifact: true,
    category: 'První pomoc',
    question:
      'Jaký je správný poměr stlačení hrudníku a umělých vdechů při laické kardiopulmonální resuscitaci (KPR) dospělého člověka?',
    options: [
      'Poměr 30 stlačení ku 2 vdechům.',
      'Poměr 15 stlačení ku 5 vdechům.',
      'Poměr 5 stlačení ku 1 vdechu.',
      'Poměr 60 stlačení ku 10 vdechům.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Zlaté pravidlo záchranářů: 30× stlačit střed hrudníku (rytmem „Stayin\' Alive“, 100–120/min, hloubka 5–6 cm) a 2× vdechnout. Pokud nemůžete dýchat z úst do úst, stlačujete nepřetržitě!',
    ruleReference: 'Zásady první pomoci při úrazu elektrickým proudem'
  },
  {
    id: 7,
    fromArtifact: true,
    category: 'Legislativa (§ 4)',
    question:
      'Jak se definuje osoba poučená ve smyslu nařízení vlády č. 194/2022 Sb.?',
    options: [
      'Osoba prokazatelně seznámená s předpisy a riziky pro činnost na daném elektrickém zařízení a vycvičená v poskytování první pomoci.',
      'Osoba s vysokoškolským elektrotechnickým vzděláním, která řídí tým.',
      'Osoba, která si sama doma přečetla návod k použití spotřebiče.',
      'Osoba oprávněná vydávat revizní zprávy pro hromosvody.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Osoba poučená (§ 4) nemá elektro školu, ale prošla školením a zácvikem na konkrétní úkon (např. údržbář nebo operátor stroje, který umí bezpečně nahodit jistič nebo vyměnit pojistku podle přesného postupu).',
    ruleReference: '§ 4 NV č. 194/2022 Sb.'
  },
  {
    id: 8,
    fromArtifact: true,
    category: 'Provozní dokumentace',
    question:
      'Co musí povinně obsahovat místní provozní bezpečnostní předpis (MPBP)?',
    options: [
      'Konkrétní pokyny, pracovní postupy, rizika a zakázané činnosti pro dané pracoviště.',
      'Pouze účetní rozvahu firmy a seznam dodavatelů materiálu.',
      'Jmenný seznam všech obyvatel v okruhu 5 kilometrů od trafostanice.',
      'Pouze zkopírovaný text ústavy bez vazby na konkrétní provoz.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'MPBP jsou „místní pravidla hry“ ušitá na míru vaší dílně nebo závodu. Říkají přesně, kde číhá jaké nebezpečí, kdo smí kam vstoupit a co je na daném pracovišti přísně zakázáno.',
    ruleReference: 'NV č. 194/2022 Sb. a ČSN EN 50110-1'
  },
  {
    id: 9,
    fromArtifact: true,
    category: 'OOPP a bezpečná práce',
    question:
      'Jaké ochranné pracovní pomůcky (OOPP) se povinně používají při zkoušce beznapěťovosti zkoušečkou na živých částech před zajištěním?',
    options: [
      'Izolační rukavice a ochrana obličeje / očí (obličejový štít, přilba).',
      'Pouze sluchátka proti hluku a reflexní vesta.',
      'Žádné pomůcky se nepoužívají, aby měl elektrikář lepší cit v prstech.',
      'Bavlněné zahradnické rukavice navlhčené vodou.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Když jdete měřit zkoušečkou, jestli je v rozvaděči napětí, musíte počítat s tím, že tam NAPĚTÍ JE a může přeskočit elektrický oblouk! Proto chráníte ruce (izolační rukavice) a oči/tvář (štít) před ošlehnutím obloukem.',
    ruleReference: 'ČSN EN 50110-1 a MPBP'
  },
  {
    id: 10,
    fromArtifact: true,
    category: 'Práce pod napětím (PPN)',
    question:
      'Může elektrotechnik podle § 6 NV č. 194/2022 Sb. pracovat na elektrickém zařízení pod napětím (PPN)?',
    options: [
      'Pouze za stanovených podmínek, podle schválených postupů a s příslušným pokynem.',
      'Nikdy a za žádných okolností, PPN je v celé ČR absolutně zakázána.',
      'Ano, kdykoliv se mu nechce hledat hlavní vypínač a spěchá domů.',
      'Pouze pokud drží jednu ruku v kapse a stojí na jedné noze.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Jako vstup do klece ke lvu: Elektrotechnik (§ 6) to smí udělat jen tehdy, když je k tomu vycvičen, má předepsané ochranné pomůcky, schválený technologický postup a jasný pokyn!',
    ruleReference: '§ 6 NV č. 194/2022 Sb. a ČSN EN 50110-1'
  },
  {
    id: 11,
    fromArtifact: false,
    category: 'Technické normy (ČSN 33 2000-4-41)',
    question:
      'Jaký je maximální jmenovitý vybavovací rozdílový proud (IΔn) proudového chrániče (RCD) pro doplňkovou ochranu zásuvkových obvodů do 32 A užívaných laiky?',
    options: [
      '30 mA (0,03 A)',
      '300 mA (0,3 A)',
      '500 mA (0,5 A)',
      '16 A'
    ],
    correctIndex: 0,
    mentorAnalogy:
      '30 mA je hranice, kdy proud procházející tělem ještě nezpůsobí smrtelnou zástavu srdce (fibrilaci komor), pokud chránič okamžitě vypne. Chrániče 300 mA slouží proti požáru, ale člověka před úrazem neochrání!',
    ruleReference: 'ČSN 33 2000-4-41 ed. 3, čl. 411.3.3'
  },
  {
    id: 12,
    fromArtifact: false,
    category: 'Značení vodičů (ČSN EN 60445)',
    question:
      'Jakou barvou je po celé své délce značen ochranný vodič (PE) a kombinovaný vodič (PEN)?',
    options: [
      'Kombinací zelené a žluté barvy (zeleno-žlutá).',
      'Světle modrou barvou po celé délce.',
      'Hnědou, černou nebo šedou barvou.',
      'Červenou barvou s bílým pruhem.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Zeleno-žlutá barva je v elektrotechnice „posvátná“ jako maják záchranky! Nesmí být nikdy použita pro fázový vodič. U vodiče PEN se navíc na koncích přidává modré označení (protože plní i funkci středního vodiče).',
    ruleReference: 'ČSN EN 60445 ed. 5'
  },
  {
    id: 13,
    fromArtifact: false,
    category: 'Technické normy (ČSN 33 2000-4-41)',
    question:
      'Jaká je v síti TN (230/400 V AC) maximální dovolená doba odpojení od zdroje při poruše pro koncové obvody nepřekračující 63 A?',
    options: [
      '0,4 sekundy',
      '5 sekund',
      '10 sekund',
      '1 minuta'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Když se fáze 230 V prodře na kovovou kostru míchačky nebo pračky, jistič či chránič musí zareagovat pod 0,4 vteřiny – to je rychleji než mrknutí oka! (5 sekund platí jen pro distribuční rozvodné obvody a obvody nad 63 A).',
    ruleReference: 'ČSN 33 2000-4-41 ed. 3, Tabulka 41.1'
  },
  {
    id: 14,
    fromArtifact: false,
    category: 'Legislativa (NV č. 194/2022 Sb.)',
    question:
      'Jaká je doba platnosti dokladu o odborné způsobilosti k výkonu činnosti na vyhrazených elektrických zařízeních (§ 6 a § 7)?',
    options: [
      '3 roky ode dne vykonání zkoušky.',
      '5 let ode dne vykonání zkoušky.',
      '1 rok ode dne vykonání zkoušky.',
      'Na dobu neurčitou (doživotně).'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Předpisy i normy se vyvíjejí a paměť bledne – proto každé 3 roky musíte na přezkoušení pro § 6 a § 7 (stejně jako to bývalo u staré vyhlášky 50).',
    ruleReference: 'Zákon č. 250/2021 Sb., § 19'
  },
  {
    id: 15,
    fromArtifact: false,
    category: 'Hodnoty bezpečného napětí',
    question:
      'Jaká je v normálních prostorech mezní hodnota bezpečného malého napětí (SELV / PELV) pro střídavý (AC) a stejnosměrný (DC) proud?',
    options: [
      'Do 50 V AC a 120 V DC.',
      'Do 230 V AC a 400 V DC.',
      'Do 1000 V AC a 1500 V DC.',
      'Do 12 V AC a 12 V DC.'
    ],
    correctIndex: 0,
    mentorAnalogy:
      'Pomůcka „50 a 120“: V suchém normálním prostoru je bezpečné malé napětí (SELV/PELV) do 50 V střídavých a 120 V stejnosměrných. Pozor: ve vlhkých či nebezpečných prostorech (např. vana) se tato hranice snižuje (např. na 25 V AC / 60 V DC nebo 12 V AC / 30 V DC)!',
    ruleReference: 'ČSN 33 2000-4-41 ed. 3, čl. 414'
  }
];

// ==========================================
// DATA: SCÉNÁŘE ÚSTNÍHO POHOVORU
// ==========================================
const ORAL_SCENARIOS = [
  {
    id: 'ustni-1',
    question:
      'Komisař se ptá: „Pane kolego, jdete vyměnit vadný stykač v průmyslovém rozvaděči 400 V. Popište mi přesně krok za krokem, jak rozvaděč zajistíte, než do něj sáhnete šroubovákem.“',
    keyKeywords: ['odpojení', 'zajištění', 'zámek', 'zkoušečka', 'beznapěťovost', 'uzemnění', 'zkratování'],
    mentorTip:
      'Komisař chce slyšet 5 zlatých pravidel v praxi + kontrolu zkoušečky před a po měření!',
    idealAnswer:
      '1. Nejprve rozvaděč úplně odpojím hlavním vypínačem nebo předřazeným jištěním ze všech možných směrů napájení.\n2. Vypínač mechanicky zajistím proti opětovnému zapnutí (uzamknu LOTO zámkem) a vyvěsím bezpečnostní tabulku „Nezapínat – na zařízení se pracuje“.\n3. Vezmu si předepsané OOPP (izolační rukavice, obličejový štít), ověřím správnou funkci dvoupólové zkoušečky na známém zdroji napětí, změřím beznapěťový stav na všech fázích proti sobě i proti PE/N a ihned poté znovu ověřím funkčnost zkoušečky.\n4. Pokud hrozí zavlečení napětí nebo jde o rozvod, kde je to předepsáno, provedu uzemnění a zkratování.\n5. Pokud jsou v sousedství rozvaděče části, které zůstaly pod napětím, zakryji je izolační přepážkou.'
  },
  {
    id: 'ustni-2',
    question:
      'Komisař se ptá: „Jaký je rozdíl mezi proudovým chráničem a jističem? Proč nám v koupelně na zásuvku nestačí jen obyčejný jistič 16 A?“',
    keyKeywords: ['zkrat', 'přetížení', '30 mA', 'rozdílový proud', 'unikající proud', 'doplňková ochrana'],
    mentorTip:
      'Vysvětlete rozdíl mezi ochranou vedení (jistič) a doplňkovou ochranou člověka (chránič 30 mA).',
    idealAnswer:
      'Jistič chrání elektrické vedení před nadproudem (přetížením a zkratem) – vypne až tehdy, když obvodem teče např. 16 A a více. Pro člověka je ale smrtelný už proud kolem 30 až 50 mA (0,03 A), což jistič vůbec nezaznamená.\nProudový chránič (RCD) porovnává proud tekoucí fázovým vodičem tam a středním vodičem (N) zpět. Pokud dojde k poruše izolace nebo se člověk dotkne živé části a část proudu (nad 30 mA) uniká přes tělo do země, chránič tento rozdíl okamžitě vyhodnotí a odpojí obvod v čase hluboko pod 0,4 s.'
  },
  {
    id: 'ustni-3',
    question:
      'Komisař se ptá: „Co uděláte jako první, když přijdete na dílnu a vidíte kolegu, který leží u přenosné vrtačky, drží se prodlužovačky a nereaguje?“',
    keyKeywords: ['vlastní bezpečnost', 'vypnout', 'vyprostit', 'dýchání', '155', '30:2', 'resuscitace'],
    mentorTip:
      'Nikdy nezačínejte větou „Hned k němu přiběhnu a chytnu ho“ – to je okamžité vyhození od zkoušky! První je VŽDY přerušení proudu a vlastní bezpečnost.',
    idealAnswer:
      '1. Dbám na vlastní bezpečnost – postiženého se nedotýkám holou rukou!\n2. Okamžitě přeruším přívod elektrického proudu (vytáhnu vidlici prodlužovačky ze zásuvky, vypnu jistič nebo hlavní vypínač STOP).\n3. Teprve když je mimo dosah proudu, zkontroluji vědomí (zatřesu rameny, oslovím ho) a zprůchodním dýchací cesty záklonem hlavy.\n4. Pokud nedýchá normálně, volám 155 (nebo zaúkoluji kolegu, ať volá 155 a přinese AED) a okamžitě zahajuji KPR: 30 stlačení středu hrudníku do hloubky 5–6 cm frekvencí 100–120/min a 2 vdechy.'
  }
];

// ==========================================
// INTERAKTIVNÍ MINI-TRENAŽÉR: 5 ZLATÝCH PRAVIDEL
// ==========================================
const GOLDEN_RULES_GAME = [
  { step: 1, text: 'Úplné odpojení (ze všech stran)', analogy: 'Zavřít hlavní ventil vody' },
  { step: 2, text: 'Zajištění proti opětovnému zapnutí', analogy: 'Zamknout ventil visacím zámkem + cedulka' },
  { step: 3, text: 'Ověření beznapěťového stavu', analogy: 'Zkusit pustit kohoutek, jestli neteče' },
  { step: 4, text: 'Uzemnění a zkratování', analogy: 'Napojit pojistný odtok přímo do kanálu' },
  { step: 5, text: 'Ochrana proti okolním živým částem', analogy: 'Zakrýt vedlejší horkou trubku plachtou' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'analogies' | 'simulator' | 'quiz' | 'oral'

  // Stav pro studijní karty
  const [selectedTopicId, setSelectedTopicId] = useState(STUDY_TOPICS[0].id);
  const [completedTopics, setCompletedTopics] = useState(['hierarchie']);

  // Stav pro trenažér 5 zlatých pravidel
  const [shuffledRules, setShuffledRules] = useState([]);
  const [selectedRulesOrder, setSelectedRulesOrder] = useState([]);
  const [rulesFeedback, setRulesFeedback] = useState(null);

  // Stav pro Kvíz
  const [quizMode, setQuizMode] = useState('mentor'); // 'mentor' (s vysvětlením hned) | 'exam' (ostrý test 80%)
  const [quizFilter, setQuizFilter] = useState('all'); // 'all' (15 otázek) | 'artifact' (10 původních přeskočených)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Stav pro Ústní zkoušku a AI Mentora
  const [activeOralIdx, setActiveOralIdx] = useState(0);
  const [showOralAnswer, setShowOralAnswer] = useState(false);
  const [userOralDraft, setUserOralDraft] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Stav pro TTS (Gemini + systémový)
  const [ttsPlayingId, setTtsPlayingId] = useState(null);
  const [ttsLoadingId, setTtsLoadingId] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const [ttsMode, setTtsMode] = useState('system'); // 'system' | 'gemini'
  const [ttsRate, setTtsRate] = useState(1.0);
  const [systemVoices, setSystemVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [miniPlayer, setMiniPlayer] = useState(null); // { text, id }
  const audioRef = React.useRef(null);
  const ttsCacheRef = React.useRef({});
  const utteranceRef = React.useRef(null);

  // Stav pro AI generování obrázků (gemini-3.1-flash-image) a hlubší AI rozbor v kvízu
  const [generatedImages, setGeneratedImages] = useState({});
  const [imageLoadingId, setImageLoadingId] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [quizAiExplanations, setQuizAiExplanations] = useState({});
  // Trvalá složka (IndexedDB, originální soubory) + import ze zařízení
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [assignKey, setAssignKey] = useState<string | null>(null);
  const [assignQuery, setAssignQuery] = useState('');
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const refreshStorage = () => { storageEstimate().then(setStorageInfo); };

  const labelForKey = (key: string): string | null => {
    if (key === 'custom-mentor-img') return 'AI Mentor – vlastní ilustrace';
    if (key.startsWith('topic-')) {
      const t = STUDY_TOPICS.find((x) => `topic-${x.id}` === key);
      return t ? `Tahák: ${t.title}` : null;
    }
    if (key.startsWith('quiz-img-')) {
      const q = QUIZ_QUESTIONS.find((x) => `quiz-img-${x.id}` === key);
      return q ? `Otázka ${q.id}: ${q.question.slice(0, 70)}${q.question.length > 70 ? '…' : ''}` : null;
    }
    return null;
  };

  const storedToEntry = (rec) => ({
    id: rec.key, url: URL.createObjectURL(rec.blob), title: rec.title, mode: rec.mode,
    createdAt: rec.createdAt, mime: rec.mime, fileName: rec.fileName, source: rec.source
  });

  // Načtení uložené složky při startu + žádost o trvalé úložiště
  useEffect(() => {
    requestPersist();
    loadAllImages()
      .then((recs) => {
        if (!recs || !recs.length) return;
        const loaded = {};
        recs.forEach((rec) => { loaded[rec.key] = storedToEntry(rec); });
        setGeneratedImages((prev) => ({ ...loaded, ...prev }));
      })
      .catch(() => {})
      .finally(refreshStorage);
  }, []);

  const saveRecord = async (key, blob, meta) => {
    try {
      await putImage({
        key, blob, mime: blob.type || meta.mime || 'application/octet-stream',
        fileName: meta.fileName || '', title: meta.title, mode: meta.mode,
        source: meta.source, createdAt: meta.createdAt
      });
    } catch (e) {
      setImportMsg('Uložení do zařízení selhalo (možná je plné úložiště).');
    }
    refreshStorage();
  };

  const nowLabel = () => new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Import obrázků (a ZIP) – ukládají se ORIGINÁLY beze změny
  const handleImportFiles = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const items: { name: string; blob: Blob }[] = [];
    for (const f of Array.from(fileList)) {
      if (/\.zip$/i.test(f.name) || f.type === 'application/zip' || f.type === 'application/x-zip-compressed') {
        try {
          const { unzipSync } = await import('fflate');
          const files = unzipSync(new Uint8Array(await f.arrayBuffer()));
          Object.entries(files).forEach(([name, data]) => {
            if (!name.endsWith('/') && isImageName(name) && !/(^|\/)__MACOSX\//.test(name))
              items.push({ name: name.replace(/^.*\//, ''), blob: new Blob([data], { type: mimeOf(name) }) });
          });
        } catch {
          setImportMsg(`ZIP „${f.name}“ se nepodařilo rozbalit.`);
        }
      } else if (f.type.startsWith('image/') || isImageName(f.name)) {
        items.push({ name: f.name, blob: f.type ? f : new Blob([f], { type: mimeOf(f.name) }) });
      }
    }
    if (!items.length) { setImportMsg('Nebyl vybrán žádný obrázek.'); return; }
    const quizIds = QUIZ_QUESTIONS.map((q) => q.id);
    const topicIds = STUDY_TOPICS.map((t) => t.id);
    let assigned = 0;
    const added = {};
    for (let i = 0; i < items.length; i++) {
      const { name, blob } = items[i];
      const g = guessKey(name, quizIds, topicIds);
      const key = g ? g.key : `import-${Date.now()}-${i}`;
      if (g) assigned++;
      const meta = {
        title: g?.titleHint || (g && labelForKey(g.key)) || name.replace(/\.[a-z0-9]+$/i, ''),
        mode: 'import', source: 'import', createdAt: nowLabel(), fileName: name, mime: blob.type
      };
      await saveRecord(key, blob, meta);
      added[key] = { id: key, url: URL.createObjectURL(blob), ...meta, mime: blob.type };
    }
    setGeneratedImages((prev) => ({ ...prev, ...added }));
    const un = items.length - assigned;
    setImportMsg(`Importováno ${items.length} obr.: ${assigned} přiřazeno automaticky podle názvu` +
      (un ? `, ${un} čeká na ruční přiřazení (tlačítko „Přiřadit“).` : '.'));
  };

  // Ruční přiřazení obrázku k otázce / pojmu
  const assignImage = async (oldKey: string, newKey: string) => {
    const item = generatedImages[oldKey];
    if (!item || oldKey === newKey) { setAssignKey(null); return; }
    const blob = await (await fetch(item.url)).blob();
    const title = item.source === 'import' ? (labelForKey(newKey) || item.title) : item.title;
    const meta = { ...item, title, source: item.source || 'ai' };
    await saveRecord(newKey, blob, meta);
    await deleteImage(oldKey).catch(() => {});
    setGeneratedImages((prev) => {
      const updated = { ...prev };
      delete updated[oldKey];
      updated[newKey] = { ...meta, id: newKey };
      return updated;
    });
    setAssignKey(null);
    setAssignQuery('');
  };

  const assignTargets = [
    ...STUDY_TOPICS.map((t) => ({ key: `topic-${t.id}`, label: `Tahák: ${t.title}` })),
    ...QUIZ_QUESTIONS.map((q) => ({ key: `quiz-img-${q.id}`, label: `Otázka ${q.id}: ${q.question}` })),
    { key: 'custom-mentor-img', label: 'AI Mentor – vlastní ilustrace' }
  ];
  const [quizAiLoadingId, setQuizAiLoadingId] = useState(null);

  // Android APK most (window.ElektroMentorAndroid) – v prohlížeči není, chování se nemění
  const getAndroidBridge = () =>
    typeof window !== 'undefined' && typeof (window as any).ElektroMentorAndroid?.speak === 'function'
      ? (window as any).ElektroMentorAndroid
      : null;

  // Pomocná funkce pro stažení obrázku přímo do zařízení
  const downloadImageToDevice = (imageUrl, title = 'ilustrace', fileNameOverride?: string) => {
    if (!imageUrl) return;
    const safeName = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50);

    const fileName = fileNameOverride || `elektromentor-p6-${safeName || 'obrazek'}.png`;
    const androidBridge = getAndroidBridge();
    if (androidBridge && typeof androidBridge.saveDataUrl === 'function' && imageUrl.startsWith('data:')) {
      androidBridge.saveDataUrl(imageUrl, fileName);
      return;
    }
    if (androidBridge && typeof androidBridge.saveDataUrl === 'function' && imageUrl.startsWith('blob:')) {
      fetch(imageUrl).then((res) => res.blob()).then(blobToDataUrl)
        .then((d) => androidBridge.saveDataUrl(d, fileName)).catch(() => {});
      return;
    }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileNameFor = (key, img) => {
    const mime = img.mime || (img.url?.startsWith('data:') ? img.url.slice(5, img.url.indexOf(';')) : 'image/png');
    return exportFileName(key, img.title, mime, img.fileName);
  };

  // Hromadné stažení všech uložených ilustrací ze složky
  const downloadAllImages = () => {
    // Názvy {klíč}__{titulek}.{přípona originálu} → jdou naimportovat zpět se správným přiřazením
    const entries = Object.entries(generatedImages);
    entries.forEach(([key, img], index) => {
      setTimeout(() => {
        downloadImageToDevice(img.url, img.title, fileNameFor(key, img));
      }, index * 300);
    });
  };

  // Odstranění jedné ilustrace ze složky
  const removeSavedImage = (key) => {
    setGeneratedImages((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    deleteImage(key).catch(() => {}).finally(refreshStorage);
  };

  // Zastavení audia při odmountování
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Android WebView nemá Web Speech API (speechSynthesis === undefined) – bez guardu React spadne a zůstane prázdná (černá) stránka.
    const synth = typeof window !== 'undefined' ? (window as any).speechSynthesis : undefined;
    if (!synth || typeof synth.getVoices !== 'function') return;
    const loadVoices = () => {
      const voices = synth.getVoices().filter(v => v.lang.startsWith('cs') || v.lang.startsWith('en'));
      setSystemVoices(voices);
      if (!selectedVoice && voices.length) {
        const cs = voices.find(v => v.lang.startsWith('cs'));
        setSelectedVoice(cs || voices[0]);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { synth.onvoiceschanged = null; };
  }, []);

  // Systémové TTS (Web Speech API)
  const playSystemTts = (id, textToRead) => {
    const androidBridge = getAndroidBridge();
    if (androidBridge) {
      // Android WebView: speechSynthesis nefunguje -> nativní TextToSpeech (cs-CZ) s rychlostí
      if (ttsPlayingId === id) {
        androidBridge.stop();
        setTtsPlayingId(null);
        setMiniPlayer(null);
        return;
      }
      (window as any).onNativeTtsDone = () => {
        setTtsPlayingId(null);
        setMiniPlayer(null);
      };
      if (androidBridge.speak(textToRead, Number(ttsRate) || 1.0)) {
        setTtsPlayingId(id);
        setMiniPlayer({ id, text: textToRead.slice(0, 80) + (textToRead.length > 80 ? '…' : '') });
      }
      return;
    }
    const synth = (window as any).speechSynthesis;
    if (!synth || typeof (window as any).SpeechSynthesisUtterance === 'undefined') {
      alert('Systémový hlas není v tomto prohlížeči dostupný. Přepni na Gemini TTS.');
      return;
    }
    if (ttsPlayingId === id && utteranceRef.current) {
      synth.cancel();
      setTtsPlayingId(null);
      setMiniPlayer(null);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(textToRead);
    u.lang = selectedVoice?.lang || 'cs-CZ';
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = ttsRate;
    u.onend = () => {
      setTtsPlayingId(null);
      setMiniPlayer(null);
    };
    u.onerror = () => {
      setTtsPlayingId(null);
      setMiniPlayer(null);
    };
    utteranceRef.current = u;
    setTtsPlayingId(id);
    setMiniPlayer({ id, text: textToRead.slice(0, 80) + (textToRead.length > 80 ? '…' : '') });
    synth.speak(u);
  };

  // Funkce pro přehrání / zastavení odstavce přes Gemini TTS
  const playTts = async (id, textToRead, e) => {
    if (e) {
      e.stopPropagation();
    }
    if (!textToRead || !textToRead.trim()) return;

    // Pokud tento odstavec právě hraje, zastavíme ho
    if (ttsPlayingId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setTtsPlayingId(null);
      return;
    }

    // Zastavíme případné předchozí přehrávání
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsError(null);

    // Pokud už máme audio v mezipaměti (cache), přehrajeme ho okamžitě
    const cacheKey = `${id}_${textToRead.slice(0, 60)}`;
    if (ttsCacheRef.current[cacheKey]) {
      const cachedAudio = new Audio(ttsCacheRef.current[cacheKey]);
      audioRef.current = cachedAudio;
      setTtsPlayingId(id);
      cachedAudio.onended = () => setTtsPlayingId(null);
      cachedAudio.onerror = () => setTtsPlayingId(null);
      cachedAudio.play();
      return;
    }

    setTtsLoadingId(id);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Přečti v češtině klidným, přátelským a srozumitelným hlasem zkušeného mentora tento odstavec: ${textToRead}`
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Orus' }
          }
        }
      },
      model: 'gemini-2.5-flash-preview-tts'
    };

    const delays = [1000, 2000, 4000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith('audio/')) {
          const rateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
          const pcmData = base64ToArrayBuffer(audioData);
          const pcm16 = new Int16Array(pcmData);
          const wavBlob = pcmToWav(pcm16, sampleRate);
          const audioUrl = URL.createObjectURL(wavBlob);

          ttsCacheRef.current[cacheKey] = audioUrl;

          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          setTtsLoadingId(null);
          setTtsPlayingId(id);

          audio.onended = () => setTtsPlayingId(null);
          audio.onerror = () => setTtsPlayingId(null);
          await audio.play();
          return;
        } else {
          throw new Error('Neplatná audio odpověď');
        }
      } catch (err) {
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    setTtsLoadingId(null);
    setTtsPlayingId(null);
    setTtsError('Předčítání se momentálně nepodařilo načíst. Zkuste to prosím znovu.');
  };

  // Funkce pro generování výukového obrázku / infografiky přes Gemini 3.1 Flash Image
  const generateVisualAid = async (id, title, analogyText, officialContext, mode = 'analogy') => {
    if (imageLoadingId) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setImageError('Jsi offline – AI obrázek teď nelze vygenerovat. Ve Složce ilustrací můžeš importovat a přiřadit vlastní obrázek.');
      return;
    }
    setImageLoadingId(id);
    setImageError(null);

    const styleInstruction =
      mode === 'technical'
        ? `Vytvoř přehledné, moderní výukové technické schéma a infografiku pro elektrikáře (zkouška § 6 NV č. 194/2022 Sb.) na téma: "${title}". Technický kontext: ${officialContext}. Použij jasné vizuální prvky, elektro symboly, barevné rozlišení a stručné české popisky.`
        : `Vytvoř názornou, zapamatovatelnou výukovou ilustraci (rozdělenou na 2 části: vlevo životní analogie, vpravo reálná elektrotechnická praxe) na téma: "${title}". Analogie Mistra Karla: ${analogyText}. Odborný kontext: ${officialContext}. Styl: čistá moderní edukační infografika s krátkými českými popisky pro snadné vizuální zapamatování u zkoušky.`;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const imageApiKey = import.meta.env.VITE_GEMINI_IMAGE_API_KEY || apiKey;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${imageApiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: styleInstruction }]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '16:9' }
      }
    };

    const delays = [1000, 2000, 4000];
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

        if (part && part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          const createdAtLabel = nowLabel();
          fetch(imageUrl).then((res) => res.blob())
            .then((blob) => saveRecord(id, blob, { title, mode, source: 'ai', createdAt: createdAtLabel, mime: mimeType }))
            .catch(() => {});
          setGeneratedImages((prev) => ({
            ...prev,
            [id]: {
              id,
              url: imageUrl,
              title,
              mode,
              createdAt: new Date().toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          }));
          setImageLoadingId(null);
          return;
        } else {
          throw new Error('Obrázek nebyl v odpovědi nalezen.');
        }
      } catch (err) {
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    setImageLoadingId(null);
    setImageError('Generování obrázku se momentálně nezdařilo. Zkuste to prosím znovu.');
  };

  // Funkce pro hlubší AI vysvětlení konkrétní kvízové otázky
  const explainQuizQuestionWithAi = async (questionObj) => {
    const qId = `q-ai-${questionObj.id}`;
    if (quizAiLoadingId) return;
    setQuizAiLoadingId(qId);

    const prompt = `Vysvětli mi prosím podrobněji tuto zkušební otázku pro § 6 NV č. 194/2022 Sb.:
Otázka: "${questionObj.question}"
Správná odpověď: "${questionObj.options[questionObj.correctIndex]}"
Ostatní (chybné) možnosti: ${questionObj.options
      .filter((_, i) => i !== questionObj.correctIndex)
      .join(' | ')}

Prosím o:
1. Vizuální představení situace v praxi (jak to vypadá na stavbě nebo v rozvaděči).
2. Proč jsou ostatní možnosti špatně nebo nebezpečné.
3. Jednoduchou mnemotechnickou pomůcku, jak si správnou odpověď vybavit do 3 vteřin u testu.`;

    const systemInstruction = `Jsi Mistr Karel, přátelský mentor pro zkoušky elektrotechniků (§ 6 NV č. 194/2022 Sb.). Odpovídej věcně, barvitě, pomocí praxe a analogií, v krátkých přehledných odstavcích.`;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const delays = [1000, 2000, 4000];
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setQuizAiExplanations((prev) => ({
            ...prev,
            [questionObj.id]: text
          }));
          setQuizAiLoadingId(null);
          return;
        }
      } catch (e) {
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    setQuizAiLoadingId(null);
  };

  // Komponenta tlačítka reproduktoru pro odstavec
  const TtsButton = ({ id, text, label = 'Přečíst odstavec', className = '' }) => {
    const isPlaying = ttsPlayingId === id;
    const isLoading = ttsLoadingId === id;

    const handleClick = (e) => {
      if (ttsMode === 'system') {
        playSystemTts(id, text);
      } else {
        playTts(id, text, e);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        title={isPlaying ? 'Zastavit předčítání' : `${label} (${ttsMode === 'system' ? 'systémový hlas' : 'Gemini TTS'})`}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all shrink-0 ${
          isPlaying
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 animate-pulse'
            : isLoading
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-wait'
            : 'bg-slate-800/90 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border-slate-700 hover:border-amber-500/40'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Square className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    );
  };

  // Inicializace zamíchání 5 zlatých pravidel
  useEffect(() => {
    resetGoldenRulesGame();
  }, []);

  const resetGoldenRulesGame = () => {
    const copy = [...GOLDEN_RULES_GAME].sort(() => Math.random() - 0.5);
    setShuffledRules(copy);
    setSelectedRulesOrder([]);
    setRulesFeedback(null);
  };

  const handleRuleClick = (rule) => {
    if (selectedRulesOrder.find((r) => r.step === rule.step)) return;
    const expectedStep = selectedRulesOrder.length + 1;

    if (rule.step === expectedStep) {
      const updated = [...selectedRulesOrder, rule];
      setSelectedRulesOrder(updated);
      if (updated.length === 5) {
        setRulesFeedback({
          type: 'success',
          message: 'Výborně! Pracoviště je 100% bezpečně zajištěno podle ČSN EN 50110-1. U zkoušky máte tuto otázku v kapse!'
        });
      } else {
        setRulesFeedback({
          type: 'info',
          message: `Správně! Krok ${rule.step} (${rule.text}) je hotový. Co musí následovat teď?`
        });
      }
    } else {
      setRulesFeedback({
        type: 'error',
        message: `Pozor, nebezpečná chyba! Chtěli jste udělat „${rule.text}“, ale jste teprve u kroku ${expectedStep}. Vzpomeňte si na analogii s vodovodem!`
      });
    }
  };

  // Filtrované otázky kvízu
  const activeQuestions =
    quizFilter === 'artifact'
      ? QUIZ_QUESTIONS.filter((q) => q.fromArtifact)
      : QUIZ_QUESTIONS;

  const currentQuestion = activeQuestions[currentQuestionIdx] || activeQuestions[0];

  const handleSelectQuizOption = (optionIdx) => {
    if (quizMode === 'mentor' && userAnswers[currentQuestion.id] !== undefined) {
      return; // V tréninkovém režimu už odpověděl
    }
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIdx
    }));
  };

  const resetQuiz = (newMode = quizMode, newFilter = quizFilter) => {
    setQuizMode(newMode);
    setQuizFilter(newFilter);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setQuizFinished(false);
  };

  // Výpočet skóre
  const answeredCount = activeQuestions.filter((q) => userAnswers[q.id] !== undefined).length;
  const correctCount = activeQuestions.filter((q) => userAnswers[q.id] === q.correctIndex).length;
  const scorePercent = Math.round((correctCount / activeQuestions.length) * 100);
  const passedExam = scorePercent >= 80;

  // Volání Gemini API pro AI Mentora (Mistra Karla)
  const askAiMentor = async (customPrompt) => {
    const queryText = customPrompt || aiQuestion;
    if (!queryText.trim()) return;

    setAiLoading(true);
    setAiError(null);

    const systemInstruction = `Jsi "Mistr Karel", zkušený vedoucí elektrotechnik (§ 7) a revizní technik (§ 8) v České republice, který připravuje uchazeče na zkoušku podle § 6 nařízení vlády č. 194/2022 Sb. (Zákon č. 250/2021 Sb. a platné normy ČSN EN 50110-1, ČSN 33 2000-4-41).
Tvým úkolem je vysvětlit jakýkoliv dotaz, pojem z příručky nebo zhodnotit odpověď studenta:
1. Nejprve uveď přesnou odbornou odpověď, kterou chce slyšet zkušební komise (stručně a jasně).
2. Poté přidej trefnou, zapamatovatelnou LIDSKOU ANALOGII z běžného života (např. auto, vodovod, kuchyně, doprava), aby si to student okamžitě představil.
3. Na závěr přidej "Tip Mistra Karla ke zkoušce" – na jaký chyták si dát v testu nebo u ústní zkoušky pozor.
Odpovídej česky, přátelsky, přehledně a strukturovaně.`;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: queryText }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    const delays = [1000, 2000, 4000];
    let lastError = null;

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setAiResponse(text);
          setAiLoading(false);
          return;
        } else {
          throw new Error('Prázdná odpověď od modelu');
        }
      } catch (err) {
        lastError = err;
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
        }
      }
    }

    setAiError(
      'Nepodařilo se spojit s AI Mentorem. Zkuste to prosím za malou chvíli znovu.'
    );
    setAiLoading(false);
  };

  const toggleTopicCompleted = (id) => {
    setCompletedTopics((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTopic =
    STUDY_TOPICS.find((t) => t.id === selectedTopicId) || STUDY_TOPICS[0];

  const savedImagesList = Object.entries(generatedImages);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* HORNÍ NAVIGAČNÍ LIŠTA */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                    ElektroMentor <span className="text-amber-400">§ 6</span>
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                    NV č. 194/2022 Sb.
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Průvodce zkouškou elektrotechnika s analogiemi Mistra Karla
                </p>
              </div>
            </div>

            {/* Mobilní tlačítko složky s uloženými ilustracemi */}
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              title="Otevřít složku uložených AI ilustrací"
              className="md:hidden relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              <span>Složka</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500 text-white font-bold">
                {savedImagesList.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-center">
            {/* Navigační záložky */}
            <nav className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
              {[
                { id: 'dashboard', label: 'Plán přípravy', icon: GraduationCap },
                { id: 'analogies', label: 'Tahák s analogiemi', icon: Lightbulb },
                { id: 'simulator', label: '5 zlatých pravidel', icon: Lock },
                { id: 'quiz', label: 'Cvičný Kvíz', icon: Award },
                { id: 'oral', label: 'Ústní & AI Mentor', icon: MessageSquare }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Desktopové tlačítko složky s uloženými ilustracemi */}
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              title="Otevřít složku uložených AI ilustrací a stáhnout je do zařízení"
              className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition shrink-0 shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              <span>Složka ilustrací</span>
              <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-indigo-500 text-white font-bold">
                {savedImagesList.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HLAVNÍ OBSAH */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* MODÁLNÍ OKNO: SLOŽKA VŠECH ULOŽENÝCH ILUSTRACÍ */}
        {isGalleryOpen && (
          <div
            onClick={() => setIsGalleryOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Hlavička složky */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/95">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Složka uložených AI ilustrací ({savedImagesList.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Všechny vygenerované vizuální taháky a schémata na jednom místě připravené ke stažení
                    </p>
                    {storageInfo && storageInfo.quota > 0 && (
                      <p className={`text-[11px] mt-0.5 ${storageInfo.quota - storageInfo.usage < 50 * 1048576 || storageInfo.usage / storageInfo.quota > 0.85 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
                        Úložiště v zařízení: {fmtMB(storageInfo.usage)} z {fmtMB(storageInfo.quota)}
                        {(storageInfo.quota - storageInfo.usage < 50 * 1048576 || storageInfo.usage / storageInfo.quota > 0.85) &&
                          ' – dochází místo, stáhni si zálohu („Stáhnout vše“) a odstraň nepotřebné obrázky.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="image/*,.zip,application/zip"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleImportFiles(e.target.files); e.target.value = ''; }}
                  />
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    title="Načíst obrázky (nebo ZIP) ze zařízení – uloží se originály"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20"
                  >
                    <Upload className="w-4 h-4" />
                    Importovat
                  </button>
                  {savedImagesList.length > 0 && (
                    <button
                      type="button"
                      onClick={downloadAllImages}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Stáhnout vše ({savedImagesList.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Obsah složky */}
              <div className="p-6 overflow-y-auto space-y-4">
                {importMsg && (
                  <div className="flex items-start justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200">
                    <span>{importMsg}</span>
                    <button type="button" onClick={() => setImportMsg(null)} className="text-indigo-300 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {assignKey && generatedImages[assignKey] && (
                  <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-white">
                        Přiřadit „{generatedImages[assignKey].title}“ k otázce nebo pojmu
                      </div>
                      <button type="button" onClick={() => setAssignKey(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={assignQuery}
                      onChange={(e) => setAssignQuery(e.target.value)}
                      placeholder="Hledat otázku nebo téma (číslo nebo text)…"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {assignTargets
                        .filter((t) => !assignQuery.trim() || t.label.toLowerCase().includes(assignQuery.trim().toLowerCase()))
                        .map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => assignImage(assignKey, t.key)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-indigo-500/20 border border-slate-800 text-xs text-slate-200"
                          >
                            {t.label.length > 120 ? t.label.slice(0, 120) + '…' : t.label}
                            {generatedImages[t.key] && <span className="ml-2 text-amber-400">(nahradí stávající)</span>}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {savedImagesList.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Vaše složka ilustrací je zatím prázdná
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Jakmile si u kterékoliv otázky v kvízu, v taháku s analogiemi nebo u AI Mentora necháte vygenerovat obrázek, automaticky se vám sem uloží a budete si ho moci kdykoliv stáhnout do počítače či telefonu. Vlastní obrázky (i ZIP) můžete načíst tlačítkem „Importovat“ – podle názvu souboru (např. q-12.png, t-3.jpg) se samy přiřadí k otázce nebo tématu a fungují i offline.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedImagesList.map(([key, item]) => (
                      <div
                        key={key}
                        className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between group"
                      >
                        <div>
                          <div className="relative bg-slate-900 aspect-video overflow-hidden">
                            <img
                              src={item.url}
                              alt={item.title}
                              onClick={() => setLightboxImage(item)}
                              className="w-full h-full object-contain cursor-pointer group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-[10px] font-semibold text-indigo-300">
                              {item.mode === 'technical'
                                ? 'Technické schéma'
                                : item.mode === 'import'
                                ? 'Importováno'
                                : 'Vizuální analogie'}
                            </span>
                          </div>
                          <div className="p-3.5 space-y-1">
                            <div className="text-xs font-bold text-white line-clamp-2">
                              {item.title}
                            </div>
                            <div className={`text-[11px] ${labelForKey(key) ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {labelForKey(key) ? `Přiřazeno: ${labelForKey(key)}` : 'Nepřiřazeno – klikni na „Přiřadit“'}
                            </div>
                            {item.createdAt && (
                              <div className="text-[11px] text-slate-500">
                                Uloženo v {item.createdAt}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadImageToDevice(item.url, item.title, fileNameFor(key, item))
                            }
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition"
                          >
                            <Download className="w-3.5 h-3.5" /> Stáhnout
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAssignKey(key); setAssignQuery(''); }}
                            title="Přiřadit k otázce nebo pojmu"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLightboxImage(item)}
                            title="Zvětšit náhled"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedImage(key)}
                            title="Odstranit ze složky"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox pro zvětšení vygenerovaného AI obrázku */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2 text-sm font-bold text-white truncate max-w-xl">
                  <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{lightboxImage.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadImageToDevice(
                        lightboxImage.url,
                        lightboxImage.title
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Stáhnout do zařízení
                  </button>
                  <button
                    onClick={() => setLightboxImage(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-950 flex items-center justify-center">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upozornění při případné chybě TTS nebo generování obrázků */}
        {ttsError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
            <span>{ttsError}</span>
            <button
              onClick={() => setTtsError(null)}
              className="text-rose-300 hover:text-white font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}
        {imageError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
            <span>{imageError}</span>
            <button
              onClick={() => setImageError(null)}
              className="text-rose-300 hover:text-white font-bold px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==========================================
            ZÁLOŽKA 1: PLÁN PŘÍPRAVY (DASHBOARD)
           ========================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Uvítací karta Mistra Karla */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Váš osobní průvodce ke zkoušce § 6
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      „Zdravím kolego! Pojďme ty paragrafy a normy přeložit do lidské řeči.“
                    </h2>
                    <TtsButton
                      id="dash-welcome-title"
                      text="Zdravím kolego! Pojďme ty paragrafy a normy přeložit do lidské řeči."
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed flex-1">
                      Máte doma příručku, ale spousta definic v ní zní jako z jiné planety? V praxi i u zkoušky jde přitom o logické věci. Jako váš mentor <strong>Mistr Karel</strong> vám každou složitou poučku vysvětlím na jednoduché analogii (auto, vodovod, klec se lvem), abyste se nemuseli učit texty nazpaměť a u komise zazářili.
                    </p>
                    <TtsButton
                      id="dash-welcome-body"
                      text="Máte doma příručku, ale spousta definic v ní zní jako z jiné planety? V praxi i u zkoušky jde přitom o logické věci. Jako váš mentor Mistr Karel vám každou složitou poučku vysvětlím na jednoduché analogii jako auto, vodovod nebo klec se lvem, abyste se nemuseli učit texty nazpaměť a u komise zazářili."
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('analogies')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Začít studovat s analogiemi
                    </button>
                    <button
                      onClick={() => setActiveTab('quiz')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition"
                    >
                      <Play className="w-4 h-4 text-amber-400" />
                      Spustit cvičný kvíz (15 otázek)
                    </button>
                  </div>
                </div>

                {/* Přehled progresu */}
                <div className="w-full md:w-72 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Vaše připravenost
                    </span>
                    <span className="text-sm font-bold text-amber-400">
                      {Math.round((completedTopics.length / STUDY_TOPICS.length) * 100)} % témat
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${(completedTopics.length / STUDY_TOPICS.length) * 100}%`
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-lg font-bold text-white">
                        {completedTopics.length}/{STUDY_TOPICS.length}
                      </div>
                      <div className="text-[11px] text-slate-400">Prošlé kapitoly</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-lg font-bold text-emerald-400">
                        {answeredCount > 0 ? `${scorePercent} %` : '—'}
                      </div>
                      <div className="text-[11px] text-slate-400">Skóre v kvízu</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Co zkouška § 6 přesně obnáší - 3 pilíře */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Co musíte u zkoušky podle § 6 zvládnout (3 kroky k osvědčení)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 text-xs font-semibold">
                      1. Před zkouškou
                    </span>
                    <div className="flex items-center gap-2">
                      <TtsButton
                        id="dash-pillar-1"
                        text="Za prvé, před zkouškou: Vzdělání, praxe a MPBP. Doložíte doklad o elektrotechnickém vzdělání, tedy výuční list, maturitu, diplom nebo profesní kvalifikaci, a potvrzení o praxi či seznámení s místním provozním bezpečnostním předpisem."
                      />
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-base">
                    Vzdělání, praxe a MPBP
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Doložíte doklad o elektrotechnickém vzdělání (výuční list, maturita, diplom nebo profesní kvalifikace) a potvrzení o praxi či seznámení s místním provozním bezpečnostním předpisem (MPBP).
                  </p>
                </div>

                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 text-xs font-semibold">
                      2. Písemný test (min. 80 %)
                    </span>
                    <div className="flex items-center gap-2">
                      <TtsButton
                        id="dash-pillar-2"
                        text="Za druhé, písemný test s minimální úspěšností 80 procent: Legislativa, BOZP a první pomoc. Test prověřuje znalost nařízení vlády číslo 194 lomeno 2022 Sbírky, zákona číslo 250 lomeno 2021 Sbírky, pěti zlatých pravidel, ochrany před úrazem, hašení a první pomoci v poměru 30 ku 2."
                      />
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-base">
                    Legislativa, BOZP a první pomoc
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Test prověřuje znalost NV č. 194/2022 Sb., zákona č. 250/2021 Sb., 5 zlatých pravidel (ČSN EN 50110-1), ochrany před úrazem (ČSN 33 2000-4-41), hašení a první pomoci (30:2).
                  </p>
                </div>

                <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
                      3. Ústní pohovor
                    </span>
                    <div className="flex items-center gap-2">
                      <TtsButton
                        id="dash-pillar-3"
                        text="Za třetí, ústní pohovor: Praktické postupy a rizika. Zkušební komise se zeptá na reálné situace: jak zajistíte rozvaděč před prací, jak ověříte zkoušečku, jak funguje proudový chránič nebo jak vyprostíte kolegu zasaženého proudem."
                      />
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-base">
                    Praktické postupy a rizika
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zkušební komise se zeptá na reálné situace: jak zajistíte rozvaděč před prací, jak ověříte zkoušečku, jak funguje proudový chránič nebo jak vyprostíte kolegu zasaženého proudem.
                  </p>
                </div>
              </div>
            </div>

            {/* Rychlý rozcestník kapitol s analogiemi */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                6 klíčových kapitol z příručky přeložených do analogií
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STUDY_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isDone = completedTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setSelectedTopicId(topic.id);
                        setActiveTab('analogies');
                      }}
                      className="group cursor-pointer bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 rounded-lg bg-slate-800 group-hover:bg-amber-500/20 text-amber-400 transition">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TtsButton
                              id={`dash-card-${topic.id}`}
                              text={`${topic.title}. ${topic.analogyTitle}. ${topic.officialText}`}
                            />
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Nastudováno
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                                {topic.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-amber-400/90 uppercase tracking-wider">
                            {topic.category}
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5 group-hover:text-amber-300 transition">
                            {topic.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {topic.analogyTitle}
                        </p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
                        <span>Otevřít vysvětlení a analogii</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ZÁLOŽKA 2: TAHÁK S ANALOGIEMI
           ========================================== */}
        {activeTab === 'analogies' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Levý sloupec: Seznam témat */}
            <div className="lg:col-span-4 space-y-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Kapitoly ke zkoušce (§ 6)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Vyberte téma a porovnejte si oficiální definici s lidskou analogií Mistra Karla.
                </p>
              </div>

              {STUDY_TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isSelected = topic.id === selectedTopicId;
                const isDone = completedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">
                          {topic.category}
                        </div>
                        <div className="text-sm font-semibold truncate">
                          {topic.title}
                        </div>
                      </div>
                    </div>
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pravý sloupec: Detail vybraného tématu */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                {/* Hlavička */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      {selectedTopic.category}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1">
                      {selectedTopic.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => toggleTopicCompleted(selectedTopic.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                      completedTopics.includes(selectedTopic.id)
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {completedTopics.includes(selectedTopic.id)
                      ? 'Označeno jako nastudované'
                      : 'Označit jako nastudované'}
                  </button>
                </div>

                {/* 1. Oficiální řeč zákona / normy */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                      <FileText className="w-4 h-4" />
                      Co se píše v příručce a co chtějí slyšet u komise:
                    </div>
                    <TtsButton
                      id={`topic-official-${selectedTopic.id}`}
                      text={selectedTopic.officialText}
                    />
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {selectedTopic.officialText}
                  </p>
                </div>

                {/* 2. Lidská analogie Mistra Karla (každý odstavec má vlastní reproduktor) */}
                <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                      <Lightbulb className="w-5 h-5 text-amber-400 shrink-0" />
                      {selectedTopic.analogyTitle} (Vysvětlení Mistra Karla)
                    </div>
                    <TtsButton
                      id={`topic-analogy-all-${selectedTopic.id}`}
                      text={`${selectedTopic.analogyTitle}. ${selectedTopic.analogyText}`}
                      label="Přečíst celou analogii"
                    />
                  </div>
                  <div className="space-y-2.5">
                    {selectedTopic.analogyText.split('\n').map((paragraph, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-start justify-between gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-amber-500/20"
                      >
                        <p className="text-sm text-slate-200 leading-relaxed flex-1">
                          {paragraph}
                        </p>
                        <TtsButton
                          id={`topic-analogy-${selectedTopic.id}-p-${pIdx}`}
                          text={paragraph}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2b. AI Vizuální představivost k tématu (Generování obrázku přes Gemini) */}
                <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                        <ImageIcon className="w-4 h-4" />
                        Vizuální paměť • AI Ilustrace k tématu
                      </div>
                      <p className="text-xs text-slate-400">
                        Nechte umělou inteligenci nakreslit analogii Mistra Karla nebo technické schéma k této kapitole.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          generateVisualAid(
                            `topic-${selectedTopic.id}`,
                            selectedTopic.title,
                            selectedTopic.analogyText,
                            selectedTopic.officialText,
                            'analogy'
                          )
                        }
                        disabled={imageLoadingId === `topic-${selectedTopic.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20"
                      >
                        {imageLoadingId === `topic-${selectedTopic.id}` ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Kreslím ilustraci...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            Ilustrovat analogii
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          generateVisualAid(
                            `topic-${selectedTopic.id}`,
                            selectedTopic.title,
                            selectedTopic.analogyText,
                            selectedTopic.officialText,
                            'technical'
                          )
                        }
                        disabled={imageLoadingId === `topic-${selectedTopic.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Technické schéma
                      </button>
                    </div>
                  </div>

                  {imageLoadingId === `topic-${selectedTopic.id}` && (
                    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <div className="text-sm font-semibold text-white">
                        Mistr Karel kreslí vizuální tahák pro „{selectedTopic.title}“...
                      </div>
                      <p className="text-xs text-slate-400 max-w-md">
                        Generování obrazu pomocí Gemini 3.1 Flash Image trvá obvykle několik vteřin.
                      </p>
                    </div>
                  )}

                  {generatedImages[`topic-${selectedTopic.id}`] &&
                    imageLoadingId !== `topic-${selectedTopic.id}` && (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                        <img
                          src={generatedImages[`topic-${selectedTopic.id}`].url}
                          alt={selectedTopic.title}
                          onClick={() =>
                            setLightboxImage(generatedImages[`topic-${selectedTopic.id}`])
                          }
                          className="w-full max-h-96 object-contain mx-auto cursor-pointer"
                        />
                        <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                          <span>
                            {generatedImages[`topic-${selectedTopic.id}`].mode === 'technical'
                              ? 'Technické schéma pro praxi'
                              : 'Vizuální ilustrace analogie Mistra Karla'}
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                downloadImageToDevice(
                                  generatedImages[`topic-${selectedTopic.id}`].url,
                                  generatedImages[`topic-${selectedTopic.id}`].title
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold transition"
                            >
                              <Download className="w-3.5 h-3.5" /> Stáhnout do zařízení
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxImage(generatedImages[`topic-${selectedTopic.id}`])
                              }
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              <ZoomIn className="w-3.5 h-3.5" /> Zvětšit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* 3. Pozor na chyták u zkoušky */}
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Nejčastější chyták u zkoušky:
                    </div>
                    <TtsButton
                      id={`topic-trap-${selectedTopic.id}`}
                      text={selectedTopic.examTrap}
                    />
                  </div>
                  <p className="text-sm text-rose-100/90 leading-relaxed">
                    {selectedTopic.examTrap}
                  </p>
                </div>

                {/* 4. Klíčové body k zapamatování */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    3 věty, které si odtud odneste do testu:
                  </h4>
                  <ul className="space-y-2">
                    {selectedTopic.keyPoints.map((pt, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-2.5 text-sm text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                        <TtsButton
                          id={`topic-kp-${selectedTopic.id}-${i}`}
                          text={pt}
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Spodní navigace mezi tématy */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const idx = STUDY_TOPICS.findIndex((t) => t.id === selectedTopic.id);
                      if (idx > 0) setSelectedTopicId(STUDY_TOPICS[idx - 1].id);
                    }}
                    disabled={STUDY_TOPICS[0].id === selectedTopic.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Předchozí kapitola
                  </button>

                  {selectedTopic.id === '5pravidel' && (
                    <button
                      onClick={() => setActiveTab('simulator')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition"
                    >
                      Vyzkoušet trenažér 5 pravidel <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const idx = STUDY_TOPICS.findIndex((t) => t.id === selectedTopic.id);
                      if (idx < STUDY_TOPICS.length - 1) {
                        setSelectedTopicId(STUDY_TOPICS[idx + 1].id);
                      } else {
                        setActiveTab('quiz');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                  >
                    {STUDY_TOPICS[STUDY_TOPICS.length - 1].id === selectedTopic.id
                      ? 'Přejít na cvičný kvíz'
                      : 'Další kapitola'}{' '}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ZÁLOŽKA 3: TRENAŽÉR 5 ZLATÝCH PRAVIDEL
           ========================================== */}
        {activeTab === 'simulator' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Praktický trenažér • ČSN EN 50110-1
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">
                    Seřaďte 5 zlatých pravidel pro práci bez napětí
                  </h2>
                  <div className="flex items-start gap-2 mt-1">
                    <p className="text-xs sm:text-sm text-slate-400">
                      U písemné i ústní zkoušky musíte znát těchto 5 kroků ve 100% přesném pořadí. Klikejte na karty v pořadí od 1. do 5. kroku!
                    </p>
                    <TtsButton
                      id="sim-intro"
                      text="Seřaďte pět zlatých pravidel pro práci bez napětí. U písemné i ústní zkoušky musíte znát těchto pět kroků ve stoprocentně přesném pořadí. Klikejte na karty v pořadí od prvního do pátého kroku!"
                    />
                  </div>
                </div>
                <button
                  onClick={resetGoldenRulesGame}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 self-start sm:self-auto shrink-0"
                >
                  <RotateCcw className="w-4 h-4" /> Zamíchat znovu
                </button>
              </div>

              {/* Stavová zpráva */}
              {rulesFeedback && (
                <div
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm ${
                    rulesFeedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : rulesFeedback.type === 'error'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rulesFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : rulesFeedback.type === 'error' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>{rulesFeedback.message}</div>
                  </div>
                  <TtsButton
                    id="sim-feedback"
                    text={rulesFeedback.message}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Levá strana: Zamíchané kroky */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Dostupné úkony (klikněte na další správný krok):
                  </h3>
                  {shuffledRules.map((rule) => {
                    const isPicked = selectedRulesOrder.some((r) => r.step === rule.step);
                    return (
                      <div
                        key={rule.step}
                        onClick={() => !isPicked && handleRuleClick(rule)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isPicked
                            ? 'bg-slate-950/40 border-slate-800/50 text-slate-600 opacity-50 cursor-not-allowed'
                            : 'cursor-pointer bg-slate-950 hover:bg-slate-800 border-slate-700 hover:border-amber-500/60 text-white shadow-sm'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm">{rule.text}</div>
                          <div className="text-xs text-amber-400/80 mt-1">
                            Analogie: {rule.analogy}
                          </div>
                        </div>
                        <TtsButton
                          id={`sim-rule-${rule.step}`}
                          text={`${rule.text}. Analogie: ${rule.analogy}`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Pravá strana: Seřazené kroky 1 až 5 */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Váš postup zajištění pracoviště (1 až 5):
                  </h3>
                  {[1, 2, 3, 4, 5].map((stepNum) => {
                    const placedRule = selectedRulesOrder.find(
                      (r) => r.step === stepNum
                    );
                    return (
                      <div
                        key={stepNum}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                          placedRule
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                            : 'bg-slate-950/60 border-dashed border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              placedRule
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {stepNum}.
                          </div>
                          {placedRule ? (
                            <div>
                              <div className="text-sm font-semibold text-emerald-200">
                                {placedRule.text}
                              </div>
                              <div className="text-xs text-slate-400">
                                {placedRule.analogy}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs italic">
                              Čeká na výběr {stepNum}. kroku...
                            </span>
                          )}
                        </div>
                        {placedRule && (
                          <TtsButton
                            id={`sim-placed-${stepNum}`}
                            text={`Krok ${stepNum}: ${placedRule.text}. ${placedRule.analogy}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            ZÁLOŽKA 4: CVIČNÝ KVÍZ (§ 6)
           ========================================== */}
        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Horní panel nastavení kvízu */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Zkušební testy • Vyžadováno min. 80 %
                </span>
                <h2 className="text-xl font-bold text-white">
                  Cvičný kvíz podle příručky pro § 6 NV č. 194/2022 Sb.
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Přepínač režimu */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => resetQuiz('mentor', quizFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      quizMode === 'mentor'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trénink s Mentorem
                  </button>
                  <button
                    onClick={() => resetQuiz('exam', quizFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      quizMode === 'exam'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Zkouška nanečisto (80 %)
                  </button>
                </div>

                {/* Přepínač sady otázek */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    onClick={() => resetQuiz(quizMode, 'all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      quizFilter === 'all'
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Všech 15 otázek
                  </button>
                  <button
                    onClick={() => resetQuiz(quizMode, 'artifact')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      quizFilter === 'artifact'
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    10 otázek z vašeho testu
                  </button>
                </div>
              </div>
            </div>

            {quizFinished ? (
              /* Vyhodnocení kvízu */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="text-center space-y-3 border-b border-slate-800 pb-6">
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                      passedExam
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {passedExam ? (
                      <Award className="w-9 h-9" />
                    ) : (
                      <AlertTriangle className="w-9 h-9" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {passedExam
                      ? 'Gratulujeme! Zkoušku § 6 byste úspěšně složili!'
                      : 'Zatím to nestačilo. Hranice pro složení zkoušky je 80 %.'}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-slate-300 text-sm">
                      Dosáhli jste skóre{' '}
                      <strong
                        className={
                          passedExam ? 'text-emerald-400' : 'text-rose-400'
                        }
                      >
                        {scorePercent} %
                      </strong>{' '}
                      ({correctCount} z {activeQuestions.length} správně).
                    </p>
                    <TtsButton
                      id="quiz-result-summary"
                      text={`${
                        passedExam
                          ? 'Gratulujeme! Zkoušku podle paragrafu 6 byste úspěšně složili!'
                          : 'Zatím to nestačilo. Hranice pro složení zkoušky je 80 procent.'
                      } Dosáhli jste skóre ${scorePercent} procent, tedy ${correctCount} z ${
                        activeQuestions.length
                      } správně.`}
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => resetQuiz(quizMode, quizFilter)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      <RotateCcw className="w-4 h-4" /> Zkusit kvíz znovu
                    </button>
                  </div>
                </div>

                {/* Přehled všech otázek a vysvětlení */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Podrobný rozbor vašich odpovědí s Mentorem:
                  </h4>
                  {activeQuestions.map((q, idx) => {
                    const userAns = userAnswers[q.id];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border space-y-2 ${
                          isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-rose-500/5 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-bold text-white">
                            {idx + 1}. {q.question}
                          </div>
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          )}
                        </div>
                        {!isCorrect && (
                          <div className="text-xs text-rose-300">
                            Vaše odpověď:{' '}
                            {userAns !== undefined
                              ? q.options[userAns]
                              : 'Nezodpovězeno'}
                          </div>
                        )}
                        <div className="text-xs text-emerald-300 font-semibold">
                          Správná odpověď: {q.options[q.correctIndex]}
                        </div>
                        <div className="text-xs text-amber-200/90 bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
                          <div>
                            <strong>Mistr Karel:</strong> {q.mentorAnalogy} ({q.ruleReference})
                          </div>
                          <TtsButton
                            id={`quiz-summary-analogy-${q.id}`}
                            text={`${q.question} Správná odpověď: ${q.options[q.correctIndex]}. Vysvětlení Mistra Karla: ${q.mentorAnalogy}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Probíhající kvíz */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                {/* Lišta postupu */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Otázka <strong className="text-white">{currentQuestionIdx + 1}</strong> z{' '}
                      <strong className="text-white">{activeQuestions.length}</strong>
                    </span>
                    <span className="text-amber-400 font-semibold">
                      {currentQuestion.category}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${((currentQuestionIdx + 1) / activeQuestions.length) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Text otázky */}
                <div className="space-y-2">
                  {currentQuestion.fromArtifact && (
                    <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                      Otázka z vašeho původního testu
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg md:text-xl font-bold text-white leading-snug">
                      {currentQuestion.question}
                    </h3>
                    <TtsButton
                      id={`quiz-q-${currentQuestion.id}`}
                      text={currentQuestion.question}
                      label="Přečíst otázku"
                    />
                  </div>
                </div>

                {/* Možnosti odpovědí */}
                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const selectedIdx = userAnswers[currentQuestion.id];
                    const isAnswered = selectedIdx !== undefined;
                    const isSelected = selectedIdx === idx;
                    const isCorrect = currentQuestion.correctIndex === idx;

                    let cardStyle =
                      'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200';

                    if (quizMode === 'mentor' && isAnswered) {
                      if (isCorrect) {
                        cardStyle =
                          'bg-emerald-500/15 border-emerald-500 text-emerald-100';
                      } else if (isSelected && !isCorrect) {
                        cardStyle = 'bg-rose-500/15 border-rose-500 text-rose-100';
                      } else {
                        cardStyle = 'bg-slate-950/50 border-slate-800/60 text-slate-500';
                      }
                    } else if (quizMode === 'exam' && isSelected) {
                      cardStyle =
                        'bg-amber-500/15 border-amber-500 text-amber-100';
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`cursor-pointer w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${cardStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm font-medium leading-relaxed">
                            {opt}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TtsButton
                            id={`quiz-opt-${currentQuestion.id}-${idx}`}
                            text={`Možnost ${String.fromCharCode(65 + idx)}: ${opt}`}
                          />
                          {quizMode === 'mentor' && isAnswered && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          {quizMode === 'mentor' &&
                            isAnswered &&
                            isSelected &&
                            !isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Okamžitá zpětná vazba Mentora v tréninkovém režimu */}
                {quizMode === 'mentor' &&
                  userAnswers[currentQuestion.id] !== undefined && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          Vysvětlení a analogie Mistra Karla:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {currentQuestion.ruleReference}
                          </span>
                          <TtsButton
                            id={`quiz-analogy-${currentQuestion.id}`}
                            text={currentQuestion.mentorAnalogy}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {currentQuestion.mentorAnalogy}
                      </p>
                    </div>
                  )}

                {/* AI Vizuální pomůcka a hlubší rozbor přímo u otázky */}
                <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4" />
                        AI Vizuální představivost & Rozbor otázky
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Nevíte si rady nebo si chcete otázku vizuálně zapamatovat? Nechte AI nakreslit obrázek nebo vysvětlit chytáky.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          generateVisualAid(
                            `quiz-img-${currentQuestion.id}`,
                            `${currentQuestion.category}: ${currentQuestion.question}`,
                            currentQuestion.mentorAnalogy,
                            `Správná zásada podle ${currentQuestion.ruleReference}: ${currentQuestion.options[currentQuestion.correctIndex]}`,
                            'analogy'
                          )
                        }
                        disabled={imageLoadingId === `quiz-img-${currentQuestion.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20"
                      >
                        {imageLoadingId === `quiz-img-${currentQuestion.id}` ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Generuji obrázek...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3.5 h-3.5" />
                            {generatedImages[`quiz-img-${currentQuestion.id}`]
                              ? 'Přegenerovat AI obrázek'
                              : 'Vygenerovat AI obrázek k otázce'}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => explainQuizQuestionWithAi(currentQuestion)}
                        disabled={quizAiLoadingId === `q-ai-${currentQuestion.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
                      >
                        {quizAiLoadingId === `q-ai-${currentQuestion.id}` ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Mistr Karel píše rozbor...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Hlubší AI rozbor otázky
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Loader pro obrázek v kvízu */}
                  {imageLoadingId === `quiz-img-${currentQuestion.id}` && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
                      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        Vytvářím vizuální pomůcku k otázce č. {currentQuestionIdx + 1}...
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Obrázek spojuje praktickou situaci s analogií Mistra Karla pro okamžité zapamatování.
                      </p>
                    </div>
                  )}

                  {/* Zobrazení vygenerovaného obrázku k otázce */}
                  {generatedImages[`quiz-img-${currentQuestion.id}`] &&
                    imageLoadingId !== `quiz-img-${currentQuestion.id}` && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                        <img
                          src={generatedImages[`quiz-img-${currentQuestion.id}`].url}
                          alt={currentQuestion.question}
                          onClick={() =>
                            setLightboxImage(
                              generatedImages[`quiz-img-${currentQuestion.id}`]
                            )
                          }
                          className="w-full max-h-80 object-contain mx-auto cursor-pointer"
                        />
                        <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <span>Vizuální tahák k otázce č. {currentQuestionIdx + 1}</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                downloadImageToDevice(
                                  generatedImages[`quiz-img-${currentQuestion.id}`].url,
                                  generatedImages[`quiz-img-${currentQuestion.id}`].title
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold transition"
                            >
                              <Download className="w-3.5 h-3.5" /> Stáhnout do zařízení
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxImage(
                                  generatedImages[`quiz-img-${currentQuestion.id}`]
                                )
                              }
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                            >
                              <ZoomIn className="w-3.5 h-3.5" /> Zvětšit obrázek
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Zobrazení hlubšího AI rozboru otázky s TTS */}
                  {quizAiExplanations[currentQuestion.id] && (
                    <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Detailní rozbor od AI Mistra Karla:
                        </span>
                        <TtsButton
                          id={`quiz-deep-ai-all-${currentQuestion.id}`}
                          text={quizAiExplanations[currentQuestion.id]}
                          label="Přečíst celý rozbor"
                        />
                      </div>
                      <div className="space-y-2">
                        {quizAiExplanations[currentQuestion.id]
                          .split('\n')
                          .filter((line) => line.trim().length > 0)
                          .map((para, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-start justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                            >
                              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
                                {para}
                              </p>
                              <TtsButton
                                id={`quiz-deep-ai-${currentQuestion.id}-p-${pIdx}`}
                                text={para}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigace mezi otázkami */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentQuestionIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Předchozí
                  </button>

                  {currentQuestionIdx < activeQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                    >
                      Další otázka <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setQuizFinished(true)}
                      className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
                    >
                      Vyhodnotit test <Award className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            ZÁLOŽKA 5: ÚSTNÍ ZKOUŠKA & AI MENTOR
           ========================================== */}
        {activeTab === 'oral' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Levá část: Trenažér ústního pohovoru */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      2. část zkoušky • Ústní pohovor
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                      Simulátor otázek zkušební komise
                    </h2>
                  </div>
                  <div className="flex gap-1.5">
                    {ORAL_SCENARIOS.map((sc, idx) => (
                      <button
                        key={sc.id}
                        onClick={() => {
                          setActiveOralIdx(idx);
                          setShowOralAnswer(false);
                          setUserOralDraft('');
                        }}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          activeOralIdx === idx
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Otázka komisaře */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-white leading-relaxed">
                      {ORAL_SCENARIOS[activeOralIdx].question}
                    </div>
                    <TtsButton
                      id={`oral-q-${activeOralIdx}`}
                      text={ORAL_SCENARIOS[activeOralIdx].question}
                    />
                  </div>
                  <div className="text-xs text-amber-300 flex items-start justify-between gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        <strong>Nápověda Mistra Karla:</strong>{' '}
                        {ORAL_SCENARIOS[activeOralIdx].mentorTip}
                      </span>
                    </div>
                    <TtsButton
                      id={`oral-tip-${activeOralIdx}`}
                      text={`Nápověda Mistra Karla: ${ORAL_SCENARIOS[activeOralIdx].mentorTip}`}
                    />
                  </div>
                </div>

                {/* Textové pole pro nanečisto odpověď */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">
                    Zkuste si nanečisto napsat (nebo říct nahlas), jak byste komisi odpověděli:
                  </label>
                  <textarea
                    rows={3}
                    value={userOralDraft}
                    onChange={(e) => setUserOralDraft(e.target.value)}
                    placeholder="Napište sem klíčové body své odpovědi..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none p-3.5 text-sm text-white placeholder-slate-500"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowOralAnswer(!showOralAnswer)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    {showOralAnswer
                      ? 'Skrýt vzorovou odpověď'
                      : 'Zobrazit vzorovou odpověď na jedničku'}
                  </button>
                  {userOralDraft.trim().length > 5 && (
                    <button
                      onClick={() =>
                        askAiMentor(
                          `Komisař u zkoušky § 6 se zeptal: "${ORAL_SCENARIOS[activeOralIdx].question}". Moje odpověď zní: "${userOralDraft}". Zhodnoť prosím jako Mistr Karel, jestli by mi to u zkoušky uznali a co případně doplnit.`
                        )
                      }
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs transition"
                    >
                      <Sparkles className="w-4 h-4" /> Nechat zhodnotit AI Mentorem
                    </button>
                  )}
                </div>

                {showOralAnswer && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Vzorová odpověď u ústní zkoušky:
                      </div>
                      <TtsButton
                        id={`oral-ideal-all-${activeOralIdx}`}
                        text={ORAL_SCENARIOS[activeOralIdx].idealAnswer}
                        label="Přečíst celou odpověď"
                      />
                    </div>
                    <div className="space-y-2">
                      {ORAL_SCENARIOS[activeOralIdx].idealAnswer
                        .split('\n')
                        .map((para, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start justify-between gap-3 bg-slate-950/40 p-2.5 rounded-lg border border-emerald-500/20"
                          >
                            <p className="text-sm text-slate-200 leading-relaxed flex-1">
                              {para}
                            </p>
                            <TtsButton
                              id={`oral-ideal-${activeOralIdx}-p-${pIdx}`}
                              text={para}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pravá část: Interaktivní AI Mentor Mistr Karel */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Zeptejte se AI Mistra Karla
                    </h3>
                    <p className="text-xs text-slate-400">
                      Nerozumíte pojmu v knize? Vysvětlím vám ho na analogii!
                    </p>
                  </div>
                </div>

                {/* Rychlé dotazy */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Rychlé dotazy z příručky:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Vysvětli mi sítě TN-C, TN-S a TN-C-S na analogii',
                      'Co je to krokové napětí a proč vzniká?',
                      'Jaký je rozdíl mezi SELV, PELV a FELV?',
                      'Co znamená krytí IP44 a IP2X?'
                    ].map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setAiQuestion(preset);
                          askAiMentor(preset);
                        }}
                        className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vlastní dotaz */}
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Napište sem jakýkoliv pojem nebo otázku z vaší příručky (např. Co je to hlavní ochranné pospojování MET?)..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none p-3 text-sm text-white placeholder-slate-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => askAiMentor()}
                      disabled={aiLoading || !aiQuestion.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm transition"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Přemýšlím...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Vysvětlit s analogií
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        generateVisualAid(
                          'custom-mentor-img',
                          aiQuestion,
                          aiResponse || aiQuestion,
                          'Odborná způsobilost v elektrotechnice § 6 NV č. 194/2022 Sb.',
                          'analogy'
                        )
                      }
                      disabled={
                        imageLoadingId === 'custom-mentor-img' || !aiQuestion.trim()
                      }
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition"
                    >
                      {imageLoadingId === 'custom-mentor-img' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Kreslím...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" /> Nakreslit AI obrázek
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                    {aiError}
                  </div>
                )}

                {imageLoadingId === 'custom-mentor-img' && (
                  <div className="flex flex-col items-center justify-center py-6 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-300">
                      Generuji názornou ilustraci k vašemu dotazu...
                    </span>
                  </div>
                )}

                {generatedImages['custom-mentor-img'] &&
                  imageLoadingId !== 'custom-mentor-img' && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={generatedImages['custom-mentor-img'].url}
                        alt={generatedImages['custom-mentor-img'].title}
                        onClick={() =>
                          setLightboxImage(generatedImages['custom-mentor-img'])
                        }
                        className="w-full max-h-64 object-contain mx-auto cursor-pointer"
                      />
                      <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="truncate max-w-[160px]">
                          {generatedImages['custom-mentor-img'].title}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadImageToDevice(
                                generatedImages['custom-mentor-img'].url,
                                generatedImages['custom-mentor-img'].title
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-semibold transition"
                          >
                            <Download className="w-3 h-3" /> Stáhnout
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage(generatedImages['custom-mentor-img'])
                            }
                            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold shrink-0"
                          >
                            <ZoomIn className="w-3.5 h-3.5" /> Zvětšit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                {aiResponse && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Odpověď Mistra Karla:
                      </div>
                      <TtsButton
                        id="ai-response-all"
                        text={aiResponse}
                        label="Přečíst celou odpověď"
                      />
                    </div>
                    <div className="space-y-2">
                      {aiResponse
                        .split('\n')
                        .filter((line) => line.trim().length > 0)
                        .map((para, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start justify-between gap-2.5 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800"
                          >
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
                              {para}
                            </p>
                            <TtsButton
                              id={`ai-response-p-${pIdx}`}
                              text={para}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TTS nastavení + mini přehrávač */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {miniPlayer && (
          <div className="bg-slate-900/95 border border-amber-500/40 rounded-xl px-3 py-2 shadow-lg text-xs text-slate-200 max-w-xs flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{miniPlayer.text}</span>
            <button
              onClick={() => {
                (window as any).speechSynthesis?.cancel();
                getAndroidBridge()?.stop();
                if (audioRef.current) audioRef.current.pause();
                setTtsPlayingId(null);
                setMiniPlayer(null);
              }}
              className="ml-1 text-amber-400 hover:text-amber-300"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}
        <div className="bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs flex items-center gap-3">
          <span className="text-slate-400">TTS:</span>
          <button
            onClick={() => setTtsMode(ttsMode === 'system' ? 'gemini' : 'system')}
            className={`px-2 py-0.5 rounded ${ttsMode === 'system' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
          >
            {ttsMode === 'system' ? 'Systém' : 'Gemini'}
          </button>
          {ttsMode === 'system' && (
            <>
              <label className="flex items-center gap-1 text-slate-300">
                Rychlost
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-16"
                />
                <span>{ttsRate.toFixed(1)}×</span>
              </label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => {
                  const v = systemVoices.find(x => x.name === e.target.value);
                  if (v) setSelectedVoice(v);
                }}
                className="bg-slate-800 text-slate-200 text-xs rounded px-1 py-0.5 max-w-[140px]"
                title="Vybrat hlas"
              >
                {systemVoices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

    </div>
  );
}