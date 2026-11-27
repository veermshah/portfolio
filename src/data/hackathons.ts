/**
 * Hackathon prizes, one entry per winning project. Each prize matches the `award` on that project
 * in projects.ts and its Devpost page; add a win here only once it is confirmed there.
 */
export interface HackathonWin {
  /** The project's slug in projects.ts. */
  slug: string;
  event: string;
  year: number;
  /** City of the host school, left out where it isn't confirmed. */
  place?: string;
  prizes: string[];
}

export const hackathonWins: HackathonWin[] = [
  { slug: 'destina', event: 'HackTX 2026', year: 2026, place: 'Austin, Texas', prizes: ['Meta track, 3rd place'] },
  { slug: 'hack-stash', event: 'RowdyHacks XII', year: 2026, place: 'San Antonio, Texas', prizes: ['Overall Track, 3rd place', 'MLH Best Use of Presage'] },
  { slug: 'whatdoesdafoxsay', event: 'HackUTA 7', year: 2025, place: 'Arlington, Texas', prizes: ['MLH Best Use of Auth0'] },
  { slug: 'midpoint', event: 'HackUPC 2025', year: 2025, place: 'Barcelona, Spain', prizes: ['MLH Best Use of MongoDB Atlas'] },
  { slug: 'quantumloans', event: 'HackFin 2024', year: 2024, prizes: ['Fintech Hackathon Challenge, winner'] },
  { slug: 'ebby', event: 'HackSMU VI', year: 2024, place: 'Dallas, Texas', prizes: ['OIT Track, winner', 'MLH Best Use of PropelAuth'] },
  { slug: 'charity-clarity', event: 'HackTheChains', year: 2024, prizes: ['GoDaddy Best Domain Name', 'Solana prize'] },
  { slug: 'moneyplant', event: 'TAMUhack X', year: 2024, place: 'College Station, Texas', prizes: ['PIMCO Challenge, 3rd place'] },
  { slug: 'aerovision', event: 'PennApps XXIV', year: 2023, place: 'Philadelphia, Pennsylvania', prizes: ['Best Use of Viam Software in Robotics'] },
];

export const winBySlug = (slug: string) => hackathonWins.find((w) => w.slug === slug);

/** "Meta track, 3rd place, HackTX 2026" style strings for Person `award` in structured data. */
export const awardStrings = hackathonWins.flatMap((w) => w.prizes.map((prize) => `${prize}, ${w.event}`));
