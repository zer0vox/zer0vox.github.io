// The Experience timeline — the content behind the 3D "chapters" section on
// the About page (see ExperienceTimeline.jsx / ExperienceScene.jsx).
//
// EDIT THIS FILE, not the components. Order is oldest -> newest on purpose:
// the section is scrolled through like a story, so scrolling down moves
// forward in time.
//
// Fields:
//   id      unique + stable (used as the React key and the deep-link target)
//   year    the short label on the left rail — keep it to ~4-9 characters
//   period  the full span, shown on the card
//   role    what you were
//   org     where, or the name of the thing you were building
//   place   city / remote / self-directed — one short line
//   lead    one sentence that carries the chapter. This is the line people
//           actually read, so make it a claim, not a job description.
//   notes   2-4 short specifics. Outcomes beat responsibilities.
//   tools   short chips on the card, and one orbiting dot each in the 3D
//           scene. Free text — where a name also appears in the Stack marquee
//           in About.jsx it will read as the same thing, but it does not have
//           to, and several here (VHF, CNS) deliberately do not.
//   model   optional. Either `src` — a file in public/models/ — or `builder`,
//           naming a procedural model in src/lib/models.js. Shown on the left of the
//           stage while this chapter is the current one. Omit it and the
//           chapter falls back to the abstract helix node, which is a
//           deliberate look rather than a gap — see the DAAI chapter.
//
//           rotation  [x, y, z] in DEGREES, applied once to stand the model
//                     up and face it at the reader. Almost every model needs
//                     one: an exported board or prop is usually authored
//                     lying flat in the XZ plane, and a flat thing seen from
//                     a near-level camera is invisible. Measure before
//                     guessing — `gltf-transform inspect public/models/x.glb`
//                     prints the bounding box, and the axis with the smallest
//                     extent is the one currently pointing up.
//           scale     multiplies the shared fit, for a model that still reads
//                     too big or too small once it is standing.
//           credit    rendered under the stage while this chapter is current.
//                     Required for anything under an attribution licence.

export const EXPERIENCE = [
  {
    id: 'xp-nec',
    year: '2021',
    period: '2021 — 2025',
    role: 'BE, Electronics and Communication Engineering',
    org: 'Certified NEC Engineer, 2025',
    place: 'Nepal',
    lead: 'Four years spent learning how signal becomes system — from the physics of a circuit up to the software riding on top of it.',
    notes: [
      'Registered with the Nepal Engineering Council as a certified engineer in 2025.',
      'Built the electronics and communication grounding that the rest of this timeline runs on.',
    ],
    tools: ['C', 'C++', 'MATLAB', 'Proteus'],
    // Measured 8.5 x 1.5 x 11.4 — a board lying face-up. Standing it on its
    // long edge turns the populated face towards the reader.
    model: { src: '/models/electronics.glb', rotation: [90, 0, 0], scale: 1 },
  },
  {
    id: 'xp-cnad',
    year: '2025',
    period: '2025',
    role: 'Engineering Intern',
    org: 'CNAD — Civil Aviation Authority of Nepal',
    place: 'Communication & Navigation Aid Department',
    lead: 'Aviation is the one place where a dropped signal is not an inconvenience, and that is where I learned what reliable actually costs.',
    notes: [
      'Hands-on with VHF, aviation communication and navigation systems.',
      'Assisted with maintenance, troubleshooting and day-to-day technical operations.',
    ],
    tools: ['VHF', 'RF Communication', 'CNS', 'Navigation Systems', 'Troubleshooting'],
    model: {
      src: '/models/radio.glb',
      // Left as authored — lying on its back, looked down on. A field radio
      // reads as a field radio from above, and standing it up made it look
      // like a mounted rack unit.
      scale: 1,
      // CC BY 4.0 obliges us to name the work, its author and the licence,
      // each linked. Rendered under the stage whenever this chapter is the
      // current one — do not drop it while the model is still in use.
      credit: {
        title: 'Military Radio',
        titleHref:
          'https://sketchfab.com/3d-models/military-radio-099f56505d30414e970d79e4872a752d',
        author: 'ForaMon',
        authorHref: 'https://sketchfab.com/ForaMon',
        license: 'CC BY 4.0',
        licenseHref: 'https://creativecommons.org/licenses/by/4.0/',
      },
    },
  },
  {
    id: 'xp-daai',
    year: '2025',
    period: '2025 — 2026',
    role: 'DAAI Fellow',
    org: 'Data, Automation & AI Fellowship',
    place: 'Top Performer',
    lead: 'The turn from hardware to data — a fellowship spent automating the things I had been doing by hand.',
    notes: [
      'Hands-on work across data, automation and AI.',
      'Recognised as a Top Performer of the cohort.',
    ],
    tools: ['Python', 'AI/ML', 'Data Analysis', 'Automation', 'Git'],
    // The one object with no file behind it: the fellowship's own award,
    // generated from curves at runtime. See src/lib/trophy.js.
    model: { builder: 'trophy', scale: 1 },
  },
  {
    id: 'xp-mandaapx',
    year: 'Now',
    period: '2026 — present',
    role: 'Software Engineer',
    org: 'MandaapX',
    place: 'Currently brewing',
    lead: 'Building full-stack products on the FARM stack — FastAPI, React and MongoDB — and shipping them to real infrastructure.',
    notes: [
      'REST APIs, frontend interfaces, backend services and the integrations between them.',
      'Docker, AWS and cloud deployments.',
    ],
    tools: ['FastAPI', 'React', 'MongoDB', 'Python', 'TypeScript', 'Docker', 'AWS'],
    // Measured 4.6 x 1.23 x 0.25 — already standing and facing front, so no
    // correction needed.
    model: { src: '/models/mandaapx.glb', scale: 1.05 },
  },
]
