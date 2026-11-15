import lockupSvg from '../assets/about/hue/lockup.svg?raw'

// The "GREEN HUE / Blues" lockup, as the glyphs were set in the brand deck
// (src/assets/about/green hue.svg) rather than re-typeset: the script is a
// face the site does not ship, and the deck's spacing is the approved one.
// Inlined so it prints in currentColor -- the hero sets it twice, off-white on
// the photograph and yellow on the blue.
//
// .gh-word and .gh-script are untransformed wrappers around the deck's own
// translate matrices, so a tween can move either part without fighting them.
// `wipe` names a clip that lets "Blues" be written in left to right; it is an
// id, so it has to be unique per instance.
export default function HueLockup({ wipe }) {
  let svg = lockupSvg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ')

  if (wipe) {
    // The script's box in deck units, padded so the swash is never shaved.
    svg = svg
      .replace(
        /(<svg[^>]*>)/,
        `$1<defs><clipPath id="${wipe}"><rect class="gh-wipe" x="355" y="330" width="260" height="135"/></clipPath></defs>`
      )
      .replace('<g class="gh-script">', `<g class="gh-script" clip-path="url(#${wipe})">`)
  }

  return <span className="hue-lockup" dangerouslySetInnerHTML={{ __html: svg }} />
}
