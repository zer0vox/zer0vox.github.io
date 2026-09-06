# Recovered: travelling glass nav highlight

Claude deleted this with `git checkout --` on 2026-09-06, mistaking it for output
from a runaway subagent. It was uncommitted, so it was not in git. Both halves
below were lifted verbatim out of the Claude session transcript that authored
them (`~/.claude/projects/d--trialme-golden-ratio-site/09b0f4a0-*.jsonl`), not
retyped, so this is the original code.

- `useNavPill.jsx.txt` - the hook, goes in src/components/SiteChrome.jsx above
  the "Nav and footer are shared by every route" comment.
- `nav-pill.css.txt`   - the material + states, goes in src/index.css after the
  `nav.top .right { ... }` rule.

Three more edits are needed to wire it up:

1. src/components/SiteChrome.jsx, in SiteNav():
       const innerRef = useRef(null)
       useNavPill(innerRef)

2. src/components/SiteChrome.jsx, the nav's inner div:
       <div className="inner" ref={innerRef}>
         <span className="nav-pill" aria-hidden="true" />
         ...

3. src/index.css, on `nav.top .inner`, add `z-index: 1;` - it makes .inner a
   stacking context so the highlight sits above nav.top::before.

NOTE: a hamburger mobile menu (nav-toggle / mobile-menu) was being built in these
same two files at the time of recovery, and the committed responsive pass put the
nav links on a second row below 810px (`grid-area: 2 / 1 / 3 / -1`). Those two
are competing solutions to the same problem - reconcile them before wiring this
back in.
