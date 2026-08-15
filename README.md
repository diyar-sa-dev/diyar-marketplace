# DIYAR Marketplace — UI/UX Prototype

An Arabic (RTL), multi-vendor furniture & home-services marketplace. This is a
**frontend-only UI/UX prototype** — there is no backend. All data is mocked
inline and all "AI" / interactive features are simulated in the UI.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server + build)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **react-router-dom 7** for routing
- **lucide-react** (icons), **motion** (animation), **recharts** (dashboard charts)

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build
npm run lint       # type-check with tsc --noEmit
```

## Project structure

```
src/
├── App.tsx                 # App shell: header, routes, global modals
├── main.tsx                # React entry point
├── index.css               # Tailwind + theme tokens (diyar-dark/cream/brown)
├── components/
│   ├── layout/             # AnnouncementBar, SidebarMenu, FloatingContactBar, Footer
│   ├── modals/             # Cart, Filter, ImageSearch, RequestService
│   ├── cards/              # ProductCard, ServiceCard
│   └── home/               # Hero, CategoriesStrip, FeaturedDeals, Sections (homepage blocks)
├── layouts/                # DashboardLayout (partner portal shell)
└── pages/                  # Route pages (storefront)
    └── dashboard/          # Vendor / Service / Affiliate partner dashboards
```

Static assets (images, logo, payment icons) live in [`public/`](public/).

## Theme

Brand tokens are defined in [`src/index.css`](src/index.css):

| Token             | Value     |
| ----------------- | --------- |
| `--color-diyar-dark`  | `#1f3d3a` |
| `--color-diyar-cream` | `#f3ecdb` |
| `--color-diyar-brown` | `#947961` |
