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
};
