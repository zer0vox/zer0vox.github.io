// One definition, three call sites: the home CTA, the Philosophy closing line
// and the About closing line. It previously lived as a literal in each of them,
// which is how all three ended up pointing at an address that was never set up.
export const CONTACT_EMAIL = 'greenhueblues@gmail.com'

// A default subject so a message arrives already sorted, and so the reader is
// not staring at an empty compose window deciding how to open. Encoded because
// a raw space in a mailto is not valid in every client.
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Working together')}`
