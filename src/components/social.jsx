// The social profiles, and the two ways the site shows them.
//
// Previously this lived inside SiteChrome.jsx, where the nav and the footer both
// reached for it. The nav no longer carries these at all — three profile links
// competing with three routes is noise in a bar that has to survive a 360px
// screen — so they now appear as icons in the contact block and as words in the
// footer. One list, two presentations, so the set can never disagree with
// itself.
//
// `label` is what the footer shows; `name` is what a screen reader announces,
// because a link whose entire accessible name is "X" says nothing on its own.
//
// rel="me" states that the profile at the other end belongs to the same person
// as this site — the convention identity consumers read to confirm the link is
// reciprocal. It is also what the stylesheet matches on. noopener/noreferrer are
// the usual hardening for target="_blank": without noopener the opened page gets
// a handle on this window.

// Single-path glyphs at a 24x24 viewBox, drawn as fills rather than strokes so
// they hold their weight next to the mono labels at 18px without hinting tricks.
const ICONS = {
  X: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  Instagram:
    'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm5.3-7.03a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0z',
  LinkedIn:
    'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.71h.05c.53-.95 1.83-1.96 3.76-1.96 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.02-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21H9z',
  GitHub:
    'M12 2C6.48 2 2 6.58 2 12.19c0 4.49 2.87 8.3 6.84 9.65.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.49-1.11-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05a9.29 9.29 0 0 1 2.5-.35c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.19C22 6.58 17.52 2 12 2z'
}

const SOCIAL_LINKS = [
  { label: 'X', name: 'greenhueblues on X', href: 'https://x.com/sumip780' },
  { label: 'Instagram', name: 'greenhueblues on Instagram', href: 'https://www.instagram.com/mipxyz____/' },
  { label: 'LinkedIn', name: 'Sumip Chaudhary on LinkedIn', href: 'https://www.linkedin.com/in/sumip-chaudhary/' },
  { label: 'GitHub', name: 'zer0vox on GitHub', href: 'https://www.github.com/zer0vox' }
]

function SocialAnchor({ link, className, children }) {
  return (
    <a
      key={link.label}
      className={className}
      href={link.href}
      aria-label={link.name}
      target="_blank"
      rel="me noopener noreferrer"
    >
      {children}
    </a>
  )
}

// Footer: words, in the column with the other link lists.
export function SocialTextLinks() {
  return SOCIAL_LINKS.map((link) => (
    <SocialAnchor key={link.label} link={link}>
      {link.label}
    </SocialAnchor>
  ))
}

// Contact block: icons. aria-hidden on the glyph and aria-label on the anchor,
// so the accessible name is the full "greenhueblues on X" rather than a shape
// with no text at all.
export function SocialIconLinks() {
  return (
    <ul className="cta-social">
      {SOCIAL_LINKS.map((link) => (
        <li key={link.label}>
          <SocialAnchor link={link} className="cta-social-link">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d={ICONS[link.label]} fill="currentColor" />
            </svg>
          </SocialAnchor>
        </li>
      ))}
    </ul>
  )
}
