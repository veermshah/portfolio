export interface ProfileLink {
  label: string;
  /** Leave undefined to hide the link until it exists. */
  href?: string;
}

export const profile = {
  name: 'Veer Shah',
  /** One line under the name on the home page. */
  bio: 'Computer science master’s student at UT Dallas (Intelligent Systems, 4.00 GPA), joining Capital One full time in 2027. I’ve built cloud and AI systems as an intern at Capital One and Fidelity, and I’m director of HackUTD.',
  /** Other names people search for; used in structured data and the home page title. */
  alternateNames: ['Veer Mickey Shah', 'Veer Mickey'],
  /** Used for <meta name="description"> on the home page. */
  description:
    'Veer Shah (Veer Mickey Shah): software engineer, UT Dallas computer science master’s student and HackUTD director, joining Capital One full time in 2027.',
  links: [
    { label: 'GitHub', href: 'https://github.com/veermshah' },
    { label: 'Devpost', href: 'https://devpost.com/veermickey' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/veermickeyshah/' },
    { label: 'Email', href: 'mailto:veermickey@gmail.com' },
    { label: 'Unsplash', href: 'https://unsplash.com/@veermickey' },
    { label: 'Resume', href: '/resume.pdf' },
  ] satisfies ProfileLink[],
  /**
   * Every public profile that belongs to me, plus the blog. Used for Person `sameAs` in structured
   * data and `rel="me"` links on the home page, so search engines can tie the accounts together.
   */
  sameAs: [
    'https://github.com/veermshah',
    'https://www.linkedin.com/in/veermickeyshah/',
    'https://devpost.com/veermickey',
    'https://unsplash.com/@veermickey',
    'https://medium.com/@veermickey',
    'https://blog.veermickey.com',
  ],
  /** City and region only, as stated by the UT Dallas and HackUTD experience entries. */
  locality: { city: 'Richardson', region: 'TX', country: 'US' },
};
