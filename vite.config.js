import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ORIGIN = 'https://greenhueblues.me'

// The two sub-routes, and the metadata a crawler should see for each. The app
// sets document.title itself once it boots, but a search or social crawler
// reads the served HTML and most never run the JS — so without this every
// route shares the home page's title, description and share card.
const ROUTES = [
  {
    path: 'philosophy',
    title: 'Philosophy — greenhueblues',
    description:
      'How an idea gets from a ridgeline at five in the morning to something you can hold in your hands — the six stages of the greenhueblues practice.'
  },
  {
    path: 'about',
    title: 'About — greenhueblues',
    description:
      'Sumip Chaudhary — the practice, the tools and the work behind greenhueblues. Based in Kathmandu, working globally.'
  }
]

// Rewrites the <head> of a built index.html for one route. Deliberately narrow
// string replacements rather than an HTML parser: the input is our own
// index.html, and anything unmatched simply leaves the home value in place.
function pageFor(html, route) {
  const url = `${ORIGIN}/${route.path}`
  return html
    // The hero-pattern preload belongs to the home page only — `.hero
    // .hero-pattern` exists on no other route. Left in, these documents would
    // each pull 287 kB gzip of SVG that nothing ever paints.
    .replace(/\s*<link rel="preload"[^>]*first(?:%20| )page[^>]*>/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${route.description}$2`
    )
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${url}$2`
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(
      /(<meta property="og:title" content=")[^"]*(")/,
      `$1${route.title}$2`
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*(")/,
      `$1${route.description}$2`
    )
    .replace(
      /(<meta name="twitter:title" content=")[^"]*(")/,
      `$1${route.title}$2`
    )
    .replace(
      /(<meta name="twitter:description" content=")[^"]*(")/,
      `$1${route.description}$2`
    )
}

// The home hero's pattern is a 2.1 MB SVG (287 kB gzip) painted full-viewport,
// which makes it the LCP element — and it is referenced only from inside the
// stylesheet, so the browser cannot even learn the URL until the app CSS has
// downloaded and parsed. A preload in the document head lets that fetch start
// at HTML parse time and overlap the JS/CSS chain instead of queueing after it.
//
// The hashed filename is read back out of the bundle rather than pattern
// matched, so a re-hash or a rename can never leave a stale preload pointing at
// a file that no longer exists — it warns instead of silently doing nothing.
function preloadHeroPattern() {
  return {
    name: 'preload-hero-pattern',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle ?? {}
        const file = Object.keys(bundle).find((name) => {
          const asset = bundle[name]
          if (asset.type !== 'asset') return false
          const origins =
            asset.originalFileNames ??
            (asset.originalFileName ? [asset.originalFileName] : [])
          return origins.some((origin) => origin.endsWith('first page.svg'))
        })

        if (!file) {
          console.warn('[preload-hero-pattern] hero SVG not found in bundle; no preload emitted')
          return html
        }

        return {
          html,
          tags: [
            {
              tag: 'link',
              attrs: {
                rel: 'preload',
                as: 'image',
                type: 'image/svg+xml',
                // The source file is literally named "first page.svg", so the
                // built name carries a space. Encode it rather than relying on
                // each browser's attribute-URL recovery.
                href: `/${file.split('/').map(encodeURIComponent).join('/')}`,
                fetchpriority: 'high'
              },
              injectTo: 'head-prepend'
            }
          ]
        }
      }
    }
  }
}

// GitHub Pages serves 404.html for any path it has no file for. Shipping a copy
// of index.html under that name lets a real route like /philosophy survive a
// hard refresh or a shared link: the SPA boots and the router reads the URL,
// with no redirect hop and the address bar left intact.
//
// That fallback still answers with HTTP 404 though, which is the status a
// crawler acts on: it will not index a 404, and most social scrapers refuse to
// build a card from one. So the two real routes also get their own directory
// with a real index.html, served as a plain 200, and 404.html stays behind for
// genuinely unknown paths. Also emits robots.txt and a sitemap, since a crawler
// otherwise has to discover the sub-routes through JS-rendered nav links.
function githubPagesRoutes() {
  let outDir = 'dist'
  return {
    name: 'github-pages-routes',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (!existsSync(index)) return

      copyFileSync(index, resolve(outDir, '404.html'))

      const html = readFileSync(index, 'utf8')
      for (const route of ROUTES) {
        const page = pageFor(html, route)

        // Written twice on purpose. GitHub Pages serves `<name>.html` directly
        // for an extensionless `/<name>`, but for `/<name>` matching a
        // directory it answers with a 301 to `/<name>/` first. Shipping both
        // means the shared, unslashed form — the one people actually paste —
        // is served in one hop, while `/<name>/` still resolves for anyone who
        // types the slash.
        writeFileSync(resolve(outDir, `${route.path}.html`), page)

        const dir = resolve(outDir, route.path)
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, 'index.html'), page)
      }

      writeFileSync(
        resolve(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`
      )

      const urls = ['', ...ROUTES.map((r) => r.path)]
        .map((p) => `  <url><loc>${ORIGIN}/${p}</loc></url>`)
        .join('\n')
      writeFileSync(
        resolve(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      )
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadHeroPattern(), githubPagesRoutes()],
  build: {
    rollupOptions: {
      output: {
        // React, the router and GSAP change only when a dependency is
        // upgraded, while the app's own code changes constantly. Kept in the
        // main chunk they were re-downloaded in full on every deploy, because
        // one edited component invalidates the whole content hash. Split out,
        // a returning visitor keeps them cached across releases.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // Anchored to the package-directory boundary: a loose
          // `includes('react')` would also swallow react-router and any
          // package with "react" in its path. Vite normalises module ids to
          // forward slashes on every platform, so this stays right on Windows.
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
            return 'react-vendor'
          }
          if (/node_modules\/gsap\//.test(id)) {
            // ScrollTrigger is deliberately NOT pinned here. Only the lazy
            // backdrop and Philosophy import it, and naming it as part of the
            // shared gsap chunk would drag it back onto the landing page's
            // critical path — undoing the split it was moved out of. Left
            // unassigned, it rides along with whichever lazy chunk pulls it.
            if (/ScrollTrigger/.test(id)) return undefined
            return 'gsap'
          }
          return undefined
        }
      }
    }
  }
})
