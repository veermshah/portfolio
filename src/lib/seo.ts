/** Helpers for page titles, meta descriptions and JSON-LD structured data. */

const BRAND = 'Veer Mickey Shah';

/** Stable @id values shared by the home page graph and every other page. */
export const schemaIds = (site: URL | string | undefined) => {
  const home = new URL('/', site).href;
  return { home, person: `${home}#person`, website: `${home}#website` };
};

/** The Person node as a reference other nodes can embed (name and url help validators that don't follow @id). */
export const personRef = (site: URL | string | undefined) => {
  const ids = schemaIds(site);
  return { '@type': 'Person', '@id': ids.person, name: BRAND, url: ids.home };
};

/** BreadcrumbList from [name, absolute URL] pairs, in order from the home page. */
export const breadcrumbs = (id: string, items: [name: string, url: string][]) => ({
  '@type': 'BreadcrumbList',
  '@id': id,
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

/** JSON for a <script type="application/ld+json"> body, with `<` escaped so text can't close the tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

const stripCode = (s: string) => s.replace(/`/g, '').replace(/\s+/g, ' ').trim();

/** Sentences of a paragraph (split after ., ! or ? followed by a space and a capital or digit). */
const sentences = (s: string) => stripCode(s).split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/);

/** Cut text to at most `max` characters at a word boundary, adding an ellipsis. */
export const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:(–-]+$/, '')}…`;
};

/**
 * A meta description of roughly 110 to 160 characters built from real copy:
 * whole sentences from the parts in order, or a clipped run of them when whole sentences fall short.
 */
export const metaDescription = (parts: (string | undefined)[], min = 110, max = 160) => {
  const all = parts.filter(Boolean).flatMap((p) => sentences(p!));
  let out = '';
  for (const s of all) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  if (out.length >= min || out.length === all.join(' ').length) return out;
  return clip(all.join(' '), max);
};

/**
 * Short title phrases for projects whose pitch doesn't cut cleanly, written from each pitch.
 * New projects work without an entry: projectTitle() falls back to the pitch's first clause.
 */
export const projectTitlePhrases: Record<string, string> = {
  'fog-map': 'Ranking unclear spec decisions',
  'popup-optimizer': 'Civic stops in Dallas',
  'statebench-harness': 'State tracking',
  veer: 'Language for LLM programs',
  wander: 'Indoor navigation for the blind',
  cambrian: 'Self-evolving DeFi agent swarm',
  'kaggle-agent': 'Autonomous Kaggle agent',
  'dishbrain-playground': 'Neurons play Pong',
  'jev-calibration-lab': 'Calibration testing',
  'organoid-reservoir': 'Reservoir computing',
  destina: 'Party game with Vision Pro',
  habla: 'Spanish tutor you talk to',
  'hack-stash': 'San Antonio getaway game',
  'hack-odds': 'Hackathon prediction market',
  moneyplant: 'Black-Litterman robo-advisor',
  'jev-support-desk': 'Support ticket routing',
  whatdoesdafoxsay: 'Dyslexia reading helper',
  'charity-clarity': 'Solana donation tracker',
  aerovision: 'Gesture-driven rover',
  proofsnap: 'Checks handwritten proofs',
  riff: 'AI music studio in the browser',
  firelens: 'Wildfire damage assessment',
  quantumloans: 'Crypto-backed lending',
  adaptrees: 'Variable-length key B+tree',
  chainfund: 'Crowdfunding on Ethereum',
  utdlang: 'Java compiler front-end',
  'wetware-emulator': 'Virtual neuron culture',
};

/**
 * "<Title>: <short phrase> | Veer Mickey Shah". The phrase comes from projectTitlePhrases, or else the
 * pitch's first clause, cut only at a comma or before a connecting word so it still reads as a phrase.
 * Falls back to "<Title> | Veer Mickey Shah" when nothing fits within `max` characters.
 */
export const projectTitle = (slug: string, title: string, pitch: string, max = 60) => {
  const suffix = ` | ${BRAND}`;
  const curated = projectTitlePhrases[slug];
  if (curated) return `${title}: ${curated}${suffix}`.length <= max ? `${title}: ${curated}${suffix}` : `${title}${suffix}`;
  const room = max - title.length - 2 - suffix.length;
  let phrase = stripCode(pitch).split(/[:.;!?](?:\s|$)/)[0].replace(/^(?:A|An|The)\s+/, '');
  phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  if (phrase.length > room) {
    const head = phrase.slice(0, room + 1);
    const cut = Math.max(head.lastIndexOf(','), ...[' with ', ' using ', ' for ', ' that ', ' on ', ' in ', ' via '].map((w) => head.lastIndexOf(w)));
    phrase = head.slice(0, Math.max(cut, 0)).trim();
  }
  return phrase.split(' ').length >= 3 && phrase.length <= room ? `${title}: ${phrase}${suffix}` : `${title}${suffix}`;
};
