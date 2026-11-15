# Path photos

Square (1:1) photos for "The path" on the About page: hover a row and its
photo follows the pointer.

Name each file after its step's `id` in `src/data/experience.js`:

| File            | Step                         |
| --------------- | ---------------------------- |
| `xp-be.jpg`       | Bachelor of Engineering      |
| `xp-cnad.jpg`     | Engineering Intern, CNAD     |
| `xp-daai.jpg`     | DAAI Fellow                  |
| `xp-mandaapx.jpg` | Software Engineer, MandaapX  |
| `xp-next.jpg`     | The next one (optional)      |

- Any of `.webp`, `.avif`, `.jpg`, `.jpeg` or `.png` works. If two files share a
  name, `.webp` wins.
- Crop to a square if you can (otherwise the centre is cropped), at about
  1000 × 1000 px and under 200 KB. Only devices with a mouse download them.
- A step with no photo shows its sketch on a yellow square instead.
