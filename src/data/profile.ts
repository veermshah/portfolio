export interface ProfileLink {
  label: string;
  /** Leave undefined to hide the link until it exists. */
  href?: string;
}

export const profile = {
  name: 'Veer Shah',
  /** One line under the name on the home page. */
  bio: 'Computer science master’s student at UT Dallas. I’ve interned at Capital One and Fidelity, and I’m president of HackUTD.',
  /** Used for <meta name="description"> on the home page. */
  description:
    'Veer Shah: software engineer and UT Dallas computer science student. Selected projects across compilers, ML research tooling, simulated neuroscience and hackathon builds.',
  links: [
    { label: 'GitHub', href: 'https://github.com/veermshah' },
    { label: 'Devpost', href: 'https://devpost.com/veermickey' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/veermickeyshah/' },
    { label: 'Email', href: 'mailto:veermickey@gmail.com' },
    { label: 'Unsplash', href: 'https://unsplash.com/@veermickey' },
    { label: 'Resume', href: '/resume.pdf' },
  ] satisfies ProfileLink[],
};
