# priyank1510.github.io

Personal portfolio of **Priyank Patel**, AI engineer. A hand-built static site with no build step and no framework:

- **Latent field.** 52,000 GPU particles (Three.js + custom shaders) morph between ML figures as you scroll: embedding sphere → torus-knot manifold → loss landscape → latent clusters → tensor → accretion disk. Particles near the cursor push away and glow blue.
- **Music.** "◈ Play" in the hero (or the equaliser button in the nav, or the `M` key) plays *Middle of Nowhere* by Macabre Plaza through Spotify's official player: the full song for visitors logged into Spotify, a 30-second preview for everyone else. With no Spotify link set, the site falls back to *Latent Drift*, an ambient piece composed live in the browser.
- **Generative covers.** Every project gets its own artwork (contours, flow fields, orbits, halftone or ridgelines), seeded by its slug. You never need a screenshot, and hovering a cover animates it.
- **Name.** Set in Dela Gothic One as an anime-style title card: hard blue offset shadow, outlined surname.
- **Training log.** Experience reads as epochs, with a loss curve that draws as you scroll.
- **Case studies.** Each project opens as a full-screen page with a shareable link (`/#/p/<slug>`).
- Smooth scroll (Lenis), GSAP choreography, custom cursor, magnetic buttons, a mobile menu, `prefers-reduced-motion` support, a WebGL fallback, SEO and social-share tags, and a custom 404 page.

---

## Add a project (≈ 2 minutes)

Everything you'll ever edit lives in **`js/content.js`**.

1. Open `js/content.js` and scroll to the **PROJECT TEMPLATE** at the bottom.
2. Copy the block into the `projects: [ ... ]` list. Order in the list = order on the page.
3. Fill it in:

```js
{
  slug: "my-new-project",            // unique; becomes the URL  /#/p/my-new-project
  title: "My *New* Project",         // *word* → italic + accent on hover
  kind: "Computer vision · PyTorch",
  year: "2026",
  summary: "One or two sentences that sell it.",
  tags: ["PyTorch", "CV"],
  cover: "",                         // "" = generative art, or "assets/projects/shot.jpg"
  coverStyle: "",                    // contours | flow | orbits | halftone | spectrum | "" (auto)
  featured: true,                    // false = compact row in the "Archive" list
  role: "",                          // optional, e.g. "Team of 3 — ML lead"
  links: { github: "https://github.com/priyank1510/...", live: "", writeup: "" },
  metrics: [{ value: "93%", label: "Top-1 accuracy" }],
  highlights: ["What you built.", "What you measured.", "What you learned."],
  sections: [{ title: "Problem", text: "..." }, { title: "Approach", text: "..." }], // optional
  gallery: [],                       // optional extra images
},
```

4. Save and refresh. The index number (EXP-010…), the "next experiment" link and the archive list all update on their own. Put a new project first in the list to show it first.

**Using a real image?** Put it in `assets/projects/` (16:10 or 4:3, ~1600px wide, JPG/WebP) and set `cover: "assets/projects/your-file.jpg"`.

**Empty links are hidden.** If a project has no links yet, its case study shows "Code & demo coming soon".

Optional extras in `settings`: `showInProgressCard: true` adds an animated "currently training…" card, and `showFiltersAt` sets how many projects it takes before tag filters appear (12 by default).

---

## Edit anything else

| What | Where in `js/content.js` |
| --- | --- |
| Name, email, links, availability | `profile` |
| Hero tagline | `hero.tagline` |
| Big "Abstract" statement + stats | `about` |
| Jobs (the training log) | `experience` (oldest → newest) |
| Skills ("model card") | `skills` |
| Soundtrack (title, or your own MP3) | `music` |
| Education, certifications, activities | `education`, `certifications`, `activities` |
| Contact headline | `contact` |

### Changing the music

To play a different song, set `music.spotify` to any Spotify track, album or playlist link (Share → Copy link), and update `title` and `credit`.

### Using your own MP3

The built-in soundtrack is generated in code, so there's nothing to license. To play a real track instead, put an MP3 **you have the rights to** in `assets/` (royalty-free sources include Pixabay Music and the YouTube Audio Library) and set:

```js
music: { src: "assets/my-track.mp3", title: "Track name", credit: "Artist" },
```

The same buttons, equaliser and particle pulse work with it. Set `music: null` to remove music entirely.

Formatting in text fields: `*word*` = italic, `^word^` = accent colour.

Colours and fonts are CSS variables at the top of `css/style.css` (`--accent`, `--ink`, `--paper`, …).

---

## Run locally

ES modules don't load from `file://`, so serve the folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173.

---

## Deploy to GitHub Pages

The site is plain static files, so you can deploy as is.

1. On GitHub, create a **public** repository named exactly **`priyank1510.github.io`**.
2. Commit this folder (it's already a git repo on `main`) and push it:

```bash
git add .
git commit -m "Launch portfolio"
git remote add origin https://github.com/priyank1510/priyank1510.github.io.git
git push -u origin main
```

(Or in GitHub Desktop: *File → Add local repository…* → pick this folder → *Publish repository*.)

3. In the repo, go to **Settings → Pages → Build and deployment**: *Source: Deploy from a branch*, *Branch: `main` / `(root)`* → **Save**.
4. About a minute later it's live at **https://priyank1510.github.io**.

After that, updating the site means: edit `content.js` → commit → push.

> **Custom domain later?** Add it under Settings → Pages. Then replace `priyank1510.github.io` in `index.html` (canonical + OG tags), `robots.txt` and `sitemap.xml`.

---

## Structure

```
index.html            page shell, SEO / social tags
404.html              "out of distribution" page
css/style.css         the whole visual system
js/content.js         ← all of your content
js/main.js            rendering, scroll choreography, cursor, case studies
js/scene.js           the WebGL particle field
js/covers.js          generative project covers
js/sound.js           the generative fallback soundtrack (Web Audio)
js/spotify.js         Spotify player wired to the ◈ Play buttons
vendor/               three.js r186, GSAP 3.15 + ScrollTrigger, Lenis 1.3 (local copies, no CDN)
assets/               favicon, share image, résumé, project images
```
