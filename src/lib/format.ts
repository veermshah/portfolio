import type { Project } from '../data/projects';

/** "Solo, HackSMU 2026" or "Team of 4, Hack the North" */
export function roleSummary(p: Project): string {
  const who = p.role.kind === 'Solo' ? 'Solo' : p.role.size ? `Team of ${p.role.size}` : 'Team';
  return p.context ? `${who}, ${p.context}` : who;
}

/** What Veer did on a team project, or undefined for solo work. */
export function myPart(p: Project): string | undefined {
  return p.role.kind === 'Team' ? p.role.mine : undefined;
}
