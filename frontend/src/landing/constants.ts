export const LANDING_NAV_ITEMS = [
  { key: 'about', href: '#about' },
  { key: 'how', href: '#how' },
  { key: 'customers', href: '#customers' },
  { key: 'providers', href: '#providers' },
  { key: 'ecosystem', href: '#ecosystem' },
  { key: 'coming', href: '#coming' },
  { key: 'contact', href: '#contact' },
] as const;

export type LandingNavKey = (typeof LANDING_NAV_ITEMS)[number]['key'];

export const LANDING_ASSETS = {
  logo: '/logo_diyar.svg',
  phoneMockup: '/diyar-phone-mockup.webp',
  heroAccent: '/hero_1.webp',
  heroSecondary: '/hero_2.webp',
  laptop: '/laptop.webp',
  panelOne: '/panel%201.webp',
  panelTwo: '/panel%202.webp',
  categories: [
    '/categories/%D8%AA%D8%B5%D9%85%D9%8A%D9%85%20%D8%AF%D8%A7%D8%AE%D9%84%D9%8A.webp',
    '/categories/%D8%AA%D8%B1%D9%83%D9%8A%D8%A8%20%D9%88%D8%B5%D9%8A%D8%A7%D9%86%D8%A9.webp',
    '/categories/%D8%AF%D9%87%D8%A7%D9%86%D8%A7%D8%AA.webp',
    '/categories/%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%A8%D8%AE.webp',
  ],
} as const;
