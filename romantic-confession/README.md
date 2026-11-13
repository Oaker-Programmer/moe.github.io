# Eight Little Chapters

A private, cinematic 3D confession page built to open from the **“About to tell you”** button on the existing romantic site.

It is a React + Three.js experience: a living twilight landscape, eight looping video chapters, a personal letter for each film, and an immersive story viewer with custom playback controls.

## Where it lives

The finished page is installed in both working copies of the site, beside `index.html`:

- `C:\Users\USER-TUF A15\Desktop\codefile\Cursh\about.html`
- `C:\Users\USER-TUF A15\Desktop\For Crush Project\about.html`

Each folder also contains `about-assets/` (videos, posters, fonts, and the meadow background). The main site button now navigates to `about.html`.

The original `index.html` in both folders was backed up as `index.backup-before-about.html`.

## The eight chapters

| Chapter | Film | Message theme |
| --- | --- | --- |
| 01 | moonlit confession | the night I stopped pretending |
| 02 | golden-hour beach | where we started |
| 03 | petals at sunset | a little crazy, a lot true |
| 04 | love written in clouds | the sky knows why |
| 05 | soft blue smile | the smile I keep |
| 06 | light across the sky | I’d find you again |
| 07 | rooftop sparklers with friends | some nights never really end |
| 08 | her face in the sparkler light | you outshine every spark |

Every chapter’s video, poster, title, and message live together in one object in [`src/data/stories.js`](src/data/stories.js). The viewer renders the message from the same object as the selected video, so the words can never belong to the wrong film.

## Editing the words

Open `src/data/stories.js`. Each chapter has:

- `title`, `quote`, `mood` — display text
- `src` / `poster` — media paths
- `message` — an array of paragraphs (the word-by-word reveal is automatic)
- `whisper` — the italic closing line
- `posterPosition` — focal point for the card crop
- `aspect` — the film’s aspect ratio

Replace the text, keep the eight objects in order, then rebuild.

Chapters 07 and 08 were cut from their letterboxed portrait originals (the real picture was a 16:9 strip) and converted from 4K HDR to SDR 720p H.264, so they fill the viewer without black bars.

## Replacing a video or poster

Put the files in `public/about-assets/videos/` and `public/about-assets/posters/`, then update the matching `src` and `poster` values in `stories.js`.

The player always uses:

```html
<video loop playsInline preload="auto" />
```

plus an `onEnded` restart fallback, so every film loops forever. Audio starts with the film when the browser allows it; if autoplay is blocked, the viewer starts muted and shows a “tap for sound” button.

## Build

```bash
npm install
npm run build
```

The build produces `dist/about.html` (JavaScript and CSS inlined) plus `dist/about-assets/`. To deploy, copy those two items beside the main `index.html`.

The page intentionally has no external CDN dependencies:

- fonts are self-hosted in `public/about-assets/fonts/`
- the supplied background video is compressed locally to `public/about-assets/bg/meadow.mp4`
- all eight films are local files

That means it also works when opened directly from `file://`, not only from a server.

## Notes

- **Responsive:** designed and tested at 320 px, 360 px, 390 px, 430 px, 768 px, 834 px, 1024 px, 1440 px, and 1920 px.
- **Accessibility:** dialog semantics, focus trap, Escape to close, arrow-key chapter navigation, visible focus rings, `prefers-reduced-motion` support.
- **Performance:** only the active film plays; gallery hover previews are muted and stop when the viewer opens; the 3D scene pauses while the viewer is open; mobile uses a lighter quality tier.
- **No external libraries beyond React, Three.js, and React Three Fiber.**

Made with a very full heart.
