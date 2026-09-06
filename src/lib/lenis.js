// App.jsx owns the single Lenis instance and hands it here, so anything deeper
// in the tree can drive the scroll without prop-drilling or a context. Without
// this, a programmatic jump (the year rail in the Experience section) would
// call window.scrollTo and fight Lenis for the scroll position.

let instance = null

export function setLenis(next) {
  instance = next
}

// Callers must cope with null: Lenis is created in an effect, so the first
// paint — and any environment where it failed to start — has no instance.
export function getLenis() {
  return instance
}

// Scroll to an absolute document offset through Lenis when it is running, and
// fall back to the native smooth scroll when it is not.
export function scrollToOffset(top, options = {}) {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(top, { duration: 1.1, ...options })
  else window.scrollTo({ top, behavior: 'smooth' })
}
