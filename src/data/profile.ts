export interface ProfileLink {
  label: string;
  /** Leave undefined to hide the link until it exists. */
  href?: string;
}

export const profile = {
  name: 'Veer Shah',
  /** One line under the name on the home page. */
  bio: 'Computer science student at UT Dallas (B.S. + M.S.). I’ve interned at Capital One and Fidelity, and I’m a director of HackUTD.',
  /** Used for <meta name="description"> on the home page. */
  description:
    'Veer Shah: software engineer and UT Dallas computer science student. Fifteen projects across compilers, ML research tooling, simulated neuroscience and hackathon builds.',
  links: [
    { label: 'GitHub', href: 'https://github.com/veermshah' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/veermickeyshah/' },
    { label: 'Email', href: 'mailto:veermickey@gmail.com' },
    // TODO(Veer): put the current resume at public/resume.pdf, then set href: '/resume.pdf'.
    { label: 'Resume' },
  ] satisfies ProfileLink[],
};
