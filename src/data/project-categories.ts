/** Projects can appear in several filters. Keep these IDs stable for shared URLs. */
export const projectCategories = [
  { id: 'ai-ml', label: 'AI / ML' },
  { id: 'systems', label: 'Systems' },
  { id: 'blockchain', label: 'Blockchain' },
  { id: 'web-apps', label: 'Web apps' },
  { id: 'robotics', label: 'Robotics / hardware' },
  { id: 'hackathons', label: 'Hackathons' },
] as const;

type Category = (typeof projectCategories)[number]['id'];

export const categoriesByProject: Record<string, readonly Category[]> = {
  'fog-map': ['ai-ml', 'systems'],
  'dynaflow-orchestrator': ['ai-ml', 'systems'],
  'popup-optimizer': ['web-apps'],
  'statebench-harness': ['ai-ml', 'systems'],
  veer: ['systems', 'ai-ml'],
  wander: ['ai-ml', 'web-apps', 'hackathons'],
  cambrian: ['ai-ml', 'systems', 'blockchain'],
  'kaggle-agent': ['ai-ml'],
  'dishbrain-playground': ['ai-ml', 'web-apps'],
  'jev-calibration-lab': ['ai-ml'],
  'wetware-emulator': ['systems', 'ai-ml'],
  'organoid-reservoir': ['ai-ml'],
  adaptrees: ['systems'],
  destina: ['blockchain', 'robotics', 'hackathons'],
  quantumloans: ['blockchain', 'web-apps', 'hackathons'],
  firelens: ['ai-ml', 'web-apps'],
  habla: ['ai-ml', 'web-apps'],
  'hack-stash': ['robotics', 'web-apps', 'hackathons'],
  'hack-odds': ['blockchain', 'web-apps', 'hackathons'],
  chainfund: ['blockchain', 'web-apps'],
  ebby: ['ai-ml', 'web-apps', 'hackathons'],
  moneyplant: ['ai-ml', 'web-apps', 'hackathons'],
  'jev-support-desk': ['ai-ml'],
  utdlang: ['systems'],
  midpoint: ['ai-ml', 'web-apps', 'hackathons'],
  whatdoesdafoxsay: ['ai-ml', 'hackathons'],
  'charity-clarity': ['blockchain', 'web-apps', 'hackathons'],
  aerovision: ['ai-ml', 'robotics', 'hackathons'],
};
