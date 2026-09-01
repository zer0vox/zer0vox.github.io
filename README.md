# greenhueblues

Portfolio site for greenhueblues — an independent design studio in Kathmandu.
React + Vite, deployed to GitHub Pages at **[greenhueblues.me](https://greenhueblues.me)**.

## Running it

```bash
npm install
npm run dev      # vite dev server
npm run build    # production build into dist/
npm run preview  # serve the built output
npm run lint     # eslint
```

## Layout

A single page. There is no router — every hash (`#work`, `#about`, `#contact`) is an
in-page anchor, scrolled by Lenis.

```
src/
  main.jsx                       entry
  App.jsx                        Lenis smooth scroll, renders Home
  index.css                      design tokens and all page styling
  pages/Home.jsx                 hero, panels, about, contact, footer
  components/
    FibonacciPsyBackground.jsx   OGL/GSAP animated background
    useHeroGlare.js              pointer-tracked hero glare
  assets/                        panel imagery
public/
  CNAME                          custom domain for GitHub Pages
  favicon.svg, greenhueblues.png favicon and social share image
```

Design tokens (colour, type, spacing, easing) live in `:root` at the top of
[`src/index.css`](src/index.css). `--sans` is Inter, `--mono` is Fragment Mono,
`--script` is Caveat, all loaded from Google Fonts.

## Deploying

Push to `master`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds the site and publishes `dist/` to GitHub Pages; the custom domain comes from
`public/CNAME`. Nothing else is needed — the repo is a user site served at the domain
root, so Vite's default `base: '/'` is correct.
