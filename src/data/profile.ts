export interface ProfileLink {
  label: string;
  /** Leave undefined to hide the link until it exists. */
  href?: string;
}

export const profile = {
  name: 'Veer Mickey Shah',
  /** Short form for tight spots (the navbar wordmark, photo credits). */
  shortName: 'Veer Shah',
  /** One line under the name on the home page. */
  bio: 'I’m a master’s student at UT Dallas studying intelligent systems. I’ve built cloud and AI systems as an intern at Capital One and Fidelity. I love competing in and organizing hackathons, and I coach events for MLH.',
  /** Other names people search for; used in structured data and the home page title. */
  alternateNames: ['Veer Shah', 'Veer M. Shah', 'Veer Mickey'],
  /** Used for <meta name="description"> on the home page. */
  description:
    'Veer Mickey Shah (Veer Shah): software engineer, UT Dallas computer science master’s student and MLH Coach who loves competing in and organizing hackathons.',
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
