/* ==========================================================================
   MAIN — renders content.js into the page and choreographs everything:
   loader, smooth scroll, the particle field, cursor, reveals, case studies.
   ========================================================================== */
import SITE from "./content.js";
import { createCover } from "./covers.js";
import { createSoundtrack } from "./sound.js";
import { createSpotifyPlayer, toSpotifyUri } from "./spotify.js";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

let lenis = null;
let scene = null;
let sound = null;
const covers = new Map(); // canvas element -> cover controller

/* ------------------------------------------------------------------ utils */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (s) =>
  esc(s)
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\^(.+?)\^/g, '<span class="hl">$1</span>');
const plain = (s) => String(s ?? "").replace(/[*^]/g, "");
const pad = (n, l = 2) => String(n).padStart(l, "0");
const expId = (i) => `EXP-${pad(i + 1, 3)}`;
const yearOf = (s) => (String(s).match(/\d{4}/) || [""])[0];

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), force: true, ...opts });
  else {
    const el = typeof target === "number" ? null : target;
    if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    else window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
  }
}

const ARROW = '<svg class="arr" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

/* ================================================================ render */
function render() {
  const { profile: P, hero, about, experience, nextEpoch, projects, skills, education, certifications, activities, contact, settings } = SITE;
  const year = new Date().getFullYear();

  $$('[data-bind="name"]').forEach((el) => (el.textContent = P.name));
  $$('[data-bind="initials"]').forEach((el) => (el.textContent = P.initials));
  $$('[data-bind="year"]').forEach((el) => (el.textContent = year));

  const cv = $('[data-slot="nav-cv"]');
  if (P.resume) {
    cv.href = P.resume;
    cv.hidden = false;
  }

  /* ---- hero */
  const [first, ...rest] = P.name.split(" ");
  $('[data-slot="hero"]').innerHTML = `
    <div class="hero__top mono" data-hero-fade>
      ${hero.kicker.map((k) => `<span>${esc(k)}</span>`).join('<span class="sep">/</span>')}
    </div>
    <h1 class="hero__title" aria-label="${esc(P.name)}">
      <span class="hero__line"><span class="hero__word" data-split-chars>${esc(first)}</span></span>
      <span class="hero__line hero__line--2"><em class="hero__word" data-split-chars>${esc(rest.join(" "))}</em></span>
    </h1>
    <div class="hero__foot">
      <p class="hero__tagline" data-hero-fade>${fmt(hero.tagline)}</p>
      <dl class="hero__meta mono" data-hero-fade>
        <div><dt>Status</dt><dd>${P.available ? '<i class="pulse"></i>' : ""}${esc(P.availability)} · ${esc(P.location)}</dd></div>
        ${
          SITE.music
            ? `<div><dt>Soundtrack</dt><dd class="hero__music">
          <button class="hero__play" type="button" data-sound aria-pressed="false"><span class="hero__play-icon">◈</span> <span data-sound-label>Play</span></button>
          ${(() => {
            const M = SITE.music;
            const label = `${esc(M.title || "")}${M.credit ? `<span> — ${esc(M.credit)}</span>` : ""}`;
            return toSpotifyUri(M.spotify)
              ? `<a class="hero__track" href="${esc(M.spotify)}" target="_blank" rel="noopener">${label}</a>`
              : `<span class="hero__track">${label}</span>`;
          })()}
        </dd></div>`
            : ""
        }
      </dl>
    </div>`;

  /* ---- about */
  $('[data-slot="about"]').innerHTML = `
    <p class="about__statement" data-words>${fmt(about.statement)}</p>
    <div class="about__cols">
      ${about.paragraphs.map((p) => `<p data-reveal>${fmt(p)}</p>`).join("")}
    </div>
    ${about.stats?.length ? `<dl class="stats">
      ${about.stats
        .map(
          (s, i) => `
        <div class="stat" data-reveal>
          <dt class="stat__value"><span data-count="${s.value}" data-decimals="${s.decimals || 0}">0</span><span class="stat__suffix">${esc(s.suffix)}</span></dt>
          <dd class="stat__label"><span class="mono">${pad(i + 1)}</span>${esc(s.label)}</dd>
        </div>`
        )
        .join("")}
    </dl>` : ""}`;

  /* ---- experience / training log */
  const epochs = experience.length;
  $('[data-slot="log"]').innerHTML = `
    <div class="log__grid">
      <div class="log__chart">
        <div class="chart" data-reveal>
          <div class="chart__head mono"><span>train / val loss</span><span class="chart__readout">epoch <b data-epoch-now>00</b>/${pad(epochs)} · loss <b data-loss-now>2.303</b></span></div>
          <svg class="chart__svg" viewBox="0 0 400 250" aria-hidden="true"></svg>
          <div class="chart__foot mono"><span><i class="key key--train"></i>train</span><span><i class="key key--val"></i>val</span></div>
        </div>
      </div>
      <ol class="log__list">
        ${experience
          .map(
            (e, i) => `
          <li class="epoch" data-epoch="${i}">
            <div class="epoch__head mono"><span class="epoch__n">Epoch ${pad(i + 1)}</span><span>${esc(e.start)} — ${esc(e.end)}</span></div>
            <h3 class="epoch__role">${fmt(e.role)}</h3>
            <p class="epoch__org">${esc(e.company)}<span> · ${esc(e.location)}</span></p>
            <ul class="epoch__points">${e.points.map((p) => `<li>${fmt(p)}</li>`).join("")}</ul>
            ${e.stack?.length ? `<ul class="chips">${e.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          </li>`
          )
          .join("")}
        ${
          nextEpoch
            ? `<li class="epoch epoch--next" data-epoch="${epochs}">
            <div class="epoch__head mono"><span class="epoch__n">Epoch ${pad(epochs + 1)}</span><span><i class="pulse"></i> pending</span></div>
            <h3 class="epoch__role">${fmt(nextEpoch.title)}<span class="blink">_</span></h3>
            <p class="epoch__text">${fmt(nextEpoch.text)}</p>
            <a class="btn" href="#contact" data-magnetic><span data-scramble>${esc(nextEpoch.cta)}</span>${ARROW}</a>
          </li>`
            : ""
        }
      </ol>
    </div>`;

  /* ---- projects */
  const featured = projects.map((p, i) => ({ p, i })).filter(({ p }) => p.featured !== false);
  const archive = projects.map((p, i) => ({ p, i })).filter(({ p }) => p.featured === false);

  const tagCounts = {};
  projects.forEach((p) => (p.tags || []).forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([t]) => t);
  const showFilters = projects.length >= (settings.showFiltersAt ?? 4) && topTags.length > 1;

  $('[data-slot="work"]').innerHTML = `
    ${
      showFilters
        ? `<div class="filters mono" role="toolbar" aria-label="Filter experiments">
        <button class="filter is-active" data-filter="*" aria-pressed="true">All <sup>${projects.length}</sup></button>
        ${topTags.map((t) => `<button class="filter" data-filter="${esc(t)}" aria-pressed="false">${esc(t)} <sup>${tagCounts[t]}</sup></button>`).join("")}
      </div>`
        : ""
    }
    <div class="grid">
      ${featured.map(({ p, i }) => cardHTML(p, i)).join("")}
      ${settings.showInProgressCard ? pendingHTML(projects.length) : ""}
    </div>
    ${
      archive.length
        ? `<div class="archive">
        <h3 class="archive__title mono">Archive — ${pad(archive.length)} more</h3>
        <ul class="archive__list">
          ${archive
            .map(
              ({ p, i }) => `
            <li class="row" data-tags="${esc((p.tags || []).join("|"))}">
              <a href="#/p/${esc(p.slug)}" data-cursor="Open" data-preview="${esc(p.slug)}" data-preview-style="${esc(p.coverStyle || "")}" data-preview-img="${esc(p.cover || "")}">
                <span class="row__id mono">${expId(i)}</span>
                <span class="row__title">${fmt(p.title)}</span>
                <span class="row__kind mono">${esc(p.kind || "")}</span>
                <span class="row__year mono">${esc(p.year || "")}</span>
                <span class="row__arrow">${ARROW}</span>
              </a>
            </li>`
            )
            .join("")}
        </ul>
      </div>`
        : ""
    }`;

  /* ---- skills */
  $('[data-slot="toolkit"]').innerHTML = `
    <div class="yaml" data-reveal>
      <dl class="yaml__body">
        ${skills
          .map(
            (s) => `
          <div class="yaml__row">
            <dt class="mono">${esc(s.key)}</dt>
            <dd>${s.items.map((it) => `<span class="chip">${esc(it)}</span>`).join("")}</dd>
          </div>`
          )
          .join("")}
      </dl>
    </div>`;

  /* ---- credentials */
  $('[data-slot="creds"]').innerHTML = `
    <ul class="edu">
      ${education
        .map(
          (e) => `
        <li class="edu__row" data-reveal>
          <span class="edu__years mono">${esc(yearOf(e.start))} — ${esc(e.end === "Present" ? "Now" : yearOf(e.end))}</span>
          <div class="edu__main">
            <h3 class="edu__degree">${fmt(e.degree)}</h3>
            <p class="edu__school">${esc(e.school)}<span> · ${esc(e.place)}</span></p>
          </div>
          <span class="edu__grade mono">${esc(e.grade)}</span>
        </li>`
        )
        .join("")}
    </ul>
    <div class="creds__cols">
      <div data-reveal>
        <h4 class="creds__h mono">Certifications</h4>
        <ul class="creds__list">${certifications.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      </div>
      <div data-reveal>
        <h4 class="creds__h mono">Beyond the coursework</h4>
        <ul class="creds__list">${activities
          .map((a) => `<li><b>${esc(a.title)}</b> — ${esc(a.org)}${a.text ? `<span>${esc(a.text)}</span>` : ""}</li>`)
          .join("")}</ul>
      </div>
    </div>`;

  /* ---- contact */
  const links = [
    P.github && { label: "GitHub", href: P.github },
    P.linkedin && { label: "LinkedIn", href: P.linkedin },
    P.resume && { label: "Résumé (PDF)", href: P.resume },
  ].filter(Boolean);
  $('[data-slot="contact"]').innerHTML = `
    <h2 class="contact__headline" data-words-rise>${fmt(contact.headline)}</h2>
    <p class="contact__text" data-reveal>${fmt(contact.text)}</p>
    <div class="contact__email" data-reveal>
      <a class="contact__mail" href="mailto:${esc(P.email)}" data-cursor="Write">${esc(P.email)}</a>
      <button class="btn btn--ghost" type="button" data-copy="${esc(P.email)}" data-magnetic><span class="copy-label" data-scramble>Copy address</span></button>
    </div>
    <ul class="contact__links" data-reveal>
      ${links
        .map(
          (l) =>
            `<li><a href="${esc(l.href)}" ${l.href.startsWith("http") || l.href.endsWith(".pdf") ? 'target="_blank" rel="noopener"' : ""} data-magnetic><span data-scramble>${esc(l.label)}</span>${ARROW}</a></li>`
        )
        .join("")}
    </ul>`;

  /* ---- footer */
  $('[data-slot="footer"]').innerHTML = `
    <div class="foot__row mono">
      <span>© ${year}</span>
      <span>Hand-built · no templates</span>
      <a href="#top" data-magnetic><span data-scramble>Back to top</span> ↑</a>
    </div>`;

  /* ---- mobile menu footer */
  $('[data-slot="menu-foot"]').innerHTML = `
    <a href="mailto:${esc(P.email)}">${esc(P.email)}</a>
    <span>${links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ")}</span>`;
}

function cardHTML(p, i) {
  const style = p.coverStyle || "";
  const media = p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(plain(p.title))} — cover" loading="lazy" decoding="async" />`
    : `<canvas class="card__canvas" data-cover="${esc(p.slug)}" data-cover-style="${esc(style)}"></canvas>`;
  return `
  <article class="card" data-tags="${esc((p.tags || []).join("|"))}">
    <a class="card__link" href="#/p/${esc(p.slug)}" data-cursor="Open">
      <div class="card__media" data-tilt>
        <div class="card__inner">
          ${media}
          <div class="card__glare"></div>
          <div class="card__hud mono"><span>${expId(i)}</span></div>
          <span class="card__cta mono">Read the case ${ARROW}</span>
        </div>
      </div>
      <div class="card__body">
        <div class="card__meta mono"><span>${esc(p.kind || "")}</span>${p.year ? `<span>${esc(p.year)}</span>` : ""}</div>
        <h3 class="card__title">${fmt(p.title)}</h3>
        <p class="card__summary">${fmt(p.summary)}</p>
        ${p.tags?.length ? `<ul class="chips">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      </div>
    </a>
  </article>`;
}

function pendingHTML(n) {
  return `
  <article class="card card--pending" data-tags="*">
    <div class="card__media">
      <div class="card__inner pending">
        <div class="pending__grid" aria-hidden="true"></div>
        <div class="pending__hud mono">
          <span>${expId(n)}</span>
          <span class="pending__status"><i class="pulse"></i>training</span>
        </div>
        <div class="pending__term mono" aria-hidden="true">
          <div>epoch <b data-pending-epoch>001</b> / ∞</div>
          <div>loss&nbsp;&nbsp;<b data-pending-loss>2.3026</b></div>
          <div class="pending__bar"><i data-pending-bar></i></div>
        </div>
      </div>
    </div>
    <div class="card__body">
      <div class="card__meta mono"><span>In progress</span></div>
      <h3 class="card__title">Next <em>experiment</em></h3>
      <p class="card__summary">${fmt(SITE.settings.inProgressText)}</p>
    </div>
  </article>`;
}

/* ============================================================ splitting */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  if (!el.hasAttribute("aria-label") && !el.closest("[aria-label]")) el.setAttribute("aria-label", text);
  const frag = document.createDocumentFragment();
  for (const ch of text) {
    const s = document.createElement("span");
    s.className = "char";
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch === " " ? " " : ch;
    frag.appendChild(s);
  }
  el.appendChild(frag);
  return $$(".char", el);
}

function splitWords(el, cls = "w") {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
      else {
        const s = document.createElement("span");
        s.className = cls;
        s.textContent = part;
        frag.appendChild(s);
      }
    });
    node.replaceWith(frag);
  });
  return $$("." + cls, el);
}

/* =========================================================== smooth scroll */
function initScroll() {
  if (!reduced && Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // until the loader finishes
  }

  // in-page anchors
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href");
    if (href.startsWith("#/")) return; // router
    const target = href === "#top" || href === "#" ? 0 : $(href);
    if (target === null) return;
    e.preventDefault();
    if (root.classList.contains("menu-open")) toggleMenu(false);
    if (root.classList.contains("case-open")) {
      closeCase().then(() => scrollToTarget(target));
      return;
    }
    scrollToTarget(target);
  });
}

/* =================================================================== HUD */
let hudFigText = null;
function setFigureCaption(i) {
  if (!hudFigText) hudFigText = $(".hud__fig-text");
  import("./scene.js").then(({ FIGURES }) => scramble(hudFigText, FIGURES[i].fig, 0.9));
}

function initHud() {
  const nav = $(".nav");
  let lastY = 0;
  const update = () => {
    const y = lenis ? lenis.scroll : scrollY;
    const down = y > lastY;
    if (Math.abs(y - lastY) > 4) nav.classList.toggle("is-hidden", down && y > innerHeight * 0.8 && !root.classList.contains("menu-open"));
    nav.classList.toggle("is-solid", y > 40);
    lastY = y;
  };
  if (lenis) lenis.on("scroll", (l) => { update(); scene?.setVelocity(l.velocity); });
  else addEventListener("scroll", update, { passive: true });
  update();
}

/* ================================================================ cursor */
function initCursor() {
  if (!finePointer || reduced) return;
  root.classList.add("has-cursor");
  const ring = $(".cursor__ring");
  const dot = $(".cursor__dot");
  const label = $(".cursor__label");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "none" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "none" });

  addEventListener("pointermove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    ringX(pos.x); ringY(pos.y); dotX(pos.x); dotY(pos.y);
    root.classList.add("cursor-visible");
  });
  root.addEventListener("mouseleave", () => root.classList.remove("cursor-visible"));
  addEventListener("pointerdown", () => root.classList.add("cursor-down"));
  addEventListener("pointerup", () => root.classList.remove("cursor-down"));

  document.addEventListener("pointerover", (e) => {
    const labelled = e.target.closest("[data-cursor]");
    const interactive = e.target.closest("a, button, [data-tilt], input, label");
    root.classList.toggle("cursor-label", !!labelled);
    root.classList.toggle("cursor-hover", !!interactive && !labelled);
    label.textContent = labelled ? labelled.dataset.cursor : "";
  });
}

/* ============================================================== magnetic */
function initMagnetic(scope = document) {
  if (!finePointer || reduced) return;
  $$("[data-magnetic]", scope).forEach((el) => {
    if (el.__mag) return;
    el.__mag = true;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
    });
    el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
  });
}

/* ============================================================== scramble */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/\\";
function scramble(el, to, duration = 0.6) {
  if (!el) return;
  if (reduced) { el.textContent = to; return; }
  const from = el.textContent;
  const len = Math.max(from.length, to.length);
  const start = performance.now();
  cancelAnimationFrame(el.__scr);
  const step = (now) => {
    const p = Math.min((now - start) / (duration * 1000), 1);
    let out = "";
    for (let i = 0; i < len; i++) {
      const settle = i / len;
      if (p >= settle * 0.7 + 0.3) out += to[i] ?? "";
      else if (p >= settle * 0.7) out += to[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      else out += from[i] ?? "";
    }
    el.textContent = out;
    if (p < 1) el.__scr = requestAnimationFrame(step);
    else el.textContent = to;
  };
  el.__scr = requestAnimationFrame(step);
}

function initScrambleHover(scope = document) {
  if (!finePointer) return;
  $$("[data-scramble]", scope).forEach((el) => {
    const host = el.closest("a, button") || el;
    if (host.__scr) return;
    host.__scr = true;
    host.addEventListener("pointerenter", () => scramble(el, el.dataset.text || (el.dataset.text = el.textContent), 0.45));
  });
}

/* ================================================================== menu */
function toggleMenu(force) {
  const open = force ?? !root.classList.contains("menu-open");
  root.classList.toggle("menu-open", open);
  const btn = $(".nav__menu");
  btn.setAttribute("aria-expanded", String(open));
  $(".nav__menu-label").textContent = open ? "Close" : "Menu";
  $("#menu").setAttribute("aria-hidden", String(!open));
  if (open) {
    lenis?.stop();
    gsap.fromTo("#menu .menu__links a", { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.9, ease: "expo.out", delay: 0.15 });
  } else if (!root.classList.contains("case-open")) lenis?.start();
}

/* ============================================================== covers */
function initCovers(scope = document) {
  $$("canvas[data-cover]", scope).forEach((cv) => {
    if (covers.has(cv)) return;
    const c = createCover(cv, cv.dataset.cover, cv.dataset.coverStyle);
    covers.set(cv, c);
    c.render();
    const host = cv.closest(".card__link");
    if (host && !reduced) {
      host.addEventListener("pointerenter", () => c.play());
      host.addEventListener("pointerleave", () => c.pause());
      host.addEventListener("focus", () => c.play());
      host.addEventListener("blur", () => c.pause());
    }
  });
}

let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => covers.forEach((c) => c.resize()), 150);
});

/* ================================================================ tilt */
function initTilt() {
  if (!finePointer || reduced) return;
  $$("[data-tilt]").forEach((el) => {
    const inner = $(".card__inner", el);
    const rx = gsap.quickTo(inner, "rotationX", { duration: 0.7, ease: "power3" });
    const ry = gsap.quickTo(inner, "rotationY", { duration: 0.7, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 12);
      rx((0.5 - py) * 10);
      inner.style.setProperty("--gx", `${px * 100}%`);
      inner.style.setProperty("--gy", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });
}

/* =========================================================== filters */
function initFilters() {
  const bar = $(".filters");
  if (!bar) return;
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    const tag = btn.dataset.filter;
    $$(".filter", bar).forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    const items = $$(".grid .card, .archive .row");
    items.forEach((it) => {
      const tags = (it.dataset.tags || "").split("|");
      const show = tag === "*" || tags.includes(tag) || it.dataset.tags === "*";
      if (show && it.hidden) {
        it.hidden = false;
        gsap.fromTo(it, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
      } else if (!show) it.hidden = true;
    });
    covers.forEach((c) => c.resize());
    ScrollTrigger.refresh();
  });
}

/* ============================================================ archive preview */
function initPreview() {
  const rows = $$("[data-preview]");
  if (!rows.length || !finePointer) return;
  const box = $(".preview");
  const cv = $("canvas", box);
  const cache = new Map();
  const xTo = gsap.quickTo(box, "x", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(box, "y", { duration: 0.5, ease: "power3" });
  let current = null;
  rows.forEach((a) => {
    a.addEventListener("pointerenter", () => {
      box.classList.add("is-on");
      const slug = a.dataset.preview;
      const img = a.dataset.previewImg;
      box.style.backgroundImage = img ? `url("${img}")` : "";
      cv.style.display = img ? "none" : "block";
      if (!img) {
        current?.pause();
        let c = cache.get(slug);
        if (!c) {
          c = createCover(cv, slug, a.dataset.previewStyle);
          cache.set(slug, c);
        }
        current = c;
        c.render();
        c.play();
      }
    });
    a.addEventListener("pointerleave", () => {
      box.classList.remove("is-on");
      current?.pause();
    });
    a.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
  });
}

/* ================================================================ pending card */
function initPending() {
  const ep = $("[data-pending-epoch]");
  if (!ep) return;
  const loss = $("[data-pending-loss]");
  const bar = $("[data-pending-bar]");
  let e = 1, l = 2.3026, visible = false;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(ep.closest(".card"));
  setInterval(() => {
    if (!visible || document.hidden) return;
    e += 1;
    l = Math.max(0.0421, l * (0.965 + Math.random() * 0.03) - 0.002);
    ep.textContent = pad(e, 3);
    loss.textContent = l.toFixed(4);
    bar.style.transform = `scaleX(${(e % 40) / 40})`;
  }, 420);
}

/* =============================================================== copy */
function initCopy() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const label = $(".copy-label", btn);
    let ok = false;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      ok = true;
    } catch {
      // older browsers / insecure contexts
      const ta = document.createElement("textarea");
      ta.value = btn.dataset.copy;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
    }
    scramble(label, ok ? "Copied ✓" : "Press Ctrl/⌘ + C", 0.4);
    if (!ok) getSelection()?.selectAllChildren($(".contact__mail"));
    clearTimeout(btn.__t);
    btn.__t = setTimeout(() => scramble(label, label.dataset.text || "Copy address", 0.4), 2200);
  });
}

/* ============================================================ loss chart */
function buildLossChart() {
  const svg = $(".chart__svg");
  if (!svg) return null;
  const W = 400, H = 250, P = { l: 30, r: 10, t: 14, b: 22 };
  const r = mulberry32(42);
  const N = 160;
  const train = [], val = [];
  let n1 = 0, n2 = 0;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    n1 = n1 * 0.7 + (r() - 0.5) * 0.3;
    n2 = n2 * 0.8 + (r() - 0.5) * 0.18;
    const base = 2.2 * Math.exp(-3.4 * x) + 0.1;
    train.push([x, base + n1 * 0.22 * Math.exp(-1.2 * x)]);
    val.push([x, base + 0.08 + x * 0.05 + n2 * 0.18 * Math.exp(-1.0 * x)]);
  }
  const X = (x) => P.l + x * (W - P.l - P.r);
  const Y = (y) => P.t + (1 - y / 2.5) * (H - P.t - P.b);
  const d = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join("");
  const epochs = SITE.experience.length;
  let grid = "";
  for (let g = 0; g <= 5; g++) {
    const y = P.t + (g / 5) * (H - P.t - P.b);
    grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" class="chart__grid"/>`;
    grid += `<text x="${P.l - 6}" y="${y + 3}" class="chart__tick" text-anchor="end">${(2.5 - g * 0.5).toFixed(1)}</text>`;
  }
  let marks = "";
  for (let e = 1; e <= epochs; e++) {
    const x = e / epochs;
    const idx = Math.round(x * N);
    const [, y] = train[Math.min(idx, N)];
    marks += `<line x1="${X(x)}" x2="${X(x)}" y1="${P.t}" y2="${H - P.b}" class="chart__epoch"/>`;
    marks += `<text x="${X(x) - 4}" y="${H - 6}" class="chart__tick" text-anchor="end">E${pad(e)}</text>`;
    marks += `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="chart__dot" data-dot="${e - 1}"/>`;
  }
  svg.innerHTML = `
    ${grid}${marks}
    <path d="${d(val)}" class="chart__val"/>
    <path d="${d(train)}" class="chart__train"/>
    <circle r="3.5" class="chart__head-dot"/>`;
  const trainPath = $(".chart__train", svg);
  const valPath = $(".chart__val", svg);
  const head = $(".chart__head-dot", svg);
  const dots = $$("[data-dot]", svg);
  const lossNow = $("[data-loss-now]");
  const epochNow = $("[data-epoch-now]");
  return {
    set(p) {
      // reveal both curves left → right by x, so they always stay in step
      const clip = `inset(-10% ${((1 - p) * 100).toFixed(2)}% -10% 0)`;
      trainPath.style.clipPath = clip;
      valPath.style.clipPath = clip;
      const idx = Math.min(Math.round(p * N), N);
      const [x, y] = train[idx];
      head.setAttribute("cx", X(x));
      head.setAttribute("cy", Y(y));
      head.style.opacity = p > 0.002 ? 1 : 0;
      lossNow.textContent = (p > 0.002 ? y : 2.303).toFixed(3);
      epochNow.textContent = pad(Math.min(epochs, Math.ceil(p * epochs - 0.0001)));
      dots.forEach((c) => c.classList.toggle("is-on", p >= (+c.dataset.dot + 1) / epochs - 0.001));
    },
  };
}

/* ================================================================ case study */
let caseOpen = false;
let caseReturnFocus = null;
let openedViaClick = false;
let caseCover = null;

function caseHTML(p, i) {
  const all = SITE.projects;
  const next = all[(i + 1) % all.length];
  const linkLabels = { github: "Source code", backend: "Backend code", live: "Live demo", writeup: "Write-up" };
  const links = Object.entries(p.links || {}).filter(([, v]) => v);
  const media = p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(plain(p.title))} — cover" />`
    : `<canvas data-case-cover="${esc(p.slug)}" data-cover-style="${esc(p.coverStyle || "")}"></canvas>`;
  const body = p.sections?.length
    ? p.sections.map((s, k) => `<section class="case__sec"><h3 class="case__h mono">${pad(k + 1)} — ${esc(s.title)}</h3><p>${fmt(s.text)}</p></section>`).join("")
    : "";
  return `
    <header class="case__hero">
      <div class="case__meta mono"><span>${expId(i)}</span><span>${esc(p.kind || "")}</span>${p.year ? `<span>${esc(p.year)}</span>` : ""}</div>
      <h2 class="case__title" id="case-title">${fmt(p.title)}</h2>
      <p class="case__summary">${fmt(p.summary)}</p>
    </header>
    <div class="case__cover">${media}</div>
    <div class="case__grid">
      <aside class="case__facts mono">
        <dl>
          ${p.role ? `<div><dt>Role</dt><dd>${esc(p.role)}</dd></div>` : ""}
          ${p.year ? `<div><dt>Year</dt><dd>${esc(p.year)}</dd></div>` : ""}
          ${p.tags?.length ? `<div><dt>Stack</dt><dd>${p.tags.map(esc).join("<br/>")}</dd></div>` : ""}
          <div><dt>Links</dt><dd>${
            links.length
              ? links.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(linkLabels[k] || k)} ${ARROW}</a>`).join("<br/>")
              : '<span class="muted">Code &amp; demo — coming soon</span>'
          }</dd></div>
        </dl>
      </aside>
      <div class="case__content">
        ${
          p.metrics?.length
            ? `<div class="case__metrics">${p.metrics.map((m) => `<div class="metric"><span class="metric__v">${esc(m.value)}</span><span class="metric__l mono">${esc(m.label)}</span></div>`).join("")}</div>`
            : ""
        }
        ${body}
        ${
          p.highlights?.length
            ? `<section class="case__sec"><h3 class="case__h mono">${body ? "Notes" : "What I did"}</h3><ol class="case__list">${p.highlights.map((h) => `<li>${fmt(h)}</li>`).join("")}</ol></section>`
            : ""
        }
        ${
          p.gallery?.length
            ? `<div class="case__gallery">${p.gallery
                .map((g) => (typeof g === "string" ? { src: g } : g))
                .map(
                  (g, k) => `<figure class="figure">
                <img src="${esc(g.src)}" alt="${esc(g.caption || `${plain(p.title)} — figure ${k + 1}`)}" loading="lazy" />
                ${g.caption ? `<figcaption class="mono"><span>Fig. ${k + 1}</span>${esc(g.caption)}</figcaption>` : ""}
              </figure>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
    </div>
    ${
      all.length > 1
        ? `<a class="case__next" href="#/p/${esc(next.slug)}" data-cursor="Next">
        <span class="mono">Next experiment — ${expId((i + 1) % all.length)}</span>
        <span class="case__next-title">${fmt(next.title)}</span>
      </a>`
        : ""
    }`;
}

function openCase(slug) {
  const i = SITE.projects.findIndex((p) => p.slug === slug);
  if (i < 0) return false;
  const p = SITE.projects[i];
  const el = $("#case");
  const panel = $(".case__panel", el);
  const swapping = caseOpen;
  caseCover?.pause();

  const fill = () => {
    $(".case__crumb", el).textContent = `${expId(i)} / Experiments`;
    $(".case__body", el).innerHTML = caseHTML(p, i);
    panel.scrollTop = 0;
    const cv = $("canvas[data-case-cover]", el);
    if (cv) {
      caseCover = createCover(cv, p.slug, cv.dataset.coverStyle);
      caseCover.render();
      if (!reduced) caseCover.play();
    } else caseCover = null;
    initMagnetic(el);
    initScrambleHover(el);
    document.title = `${plain(p.title)} — ${SITE.profile.name}`;
  };

  if (swapping) {
    gsap.to($(".case__body", el), {
      opacity: 0, y: -30, duration: 0.35, ease: "power2.in",
      onComplete: () => {
        fill();
        gsap.fromTo($(".case__body", el), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" });
      },
    });
    return true;
  }

  caseOpen = true;
  caseReturnFocus = document.activeElement;
  fill();
  root.classList.add("case-open");
  el.setAttribute("aria-hidden", "false");
  lenis?.stop();

  const tl = gsap.timeline({ onComplete: () => scene?.stop() });
  tl.set(el, { visibility: "visible" })
    .fromTo(".case__curtain", { yPercent: 100 }, { yPercent: 0, duration: reduced ? 0.01 : 0.7, ease: "expo.inOut" })
    .fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: reduced ? 0.01 : 0.9, ease: "expo.inOut" }, "-=0.45")
    .fromTo(".case__body > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.9, ease: "expo.out" }, "-=0.35");
  setTimeout(() => $(".case__close", el).focus({ preventScroll: true }), 400);
  return true;
}

function closeCase() {
  if (!caseOpen) return Promise.resolve();
  caseOpen = false;
  const el = $("#case");
  scene?.start();
  caseCover?.pause();
  document.title = `${SITE.profile.name} — ${SITE.profile.role}`;
  return new Promise((resolve) => {
    gsap.timeline({
      onComplete: () => {
        el.setAttribute("aria-hidden", "true");
        gsap.set(el, { visibility: "hidden" });
        root.classList.remove("case-open");
        if (!root.classList.contains("menu-open")) lenis?.start();
        caseReturnFocus?.focus?.({ preventScroll: true });
        resolve();
      },
    })
      .to(".case__panel", { yPercent: 100, duration: reduced ? 0.01 : 0.75, ease: "expo.inOut" })
      .to(".case__curtain", { yPercent: -100, duration: reduced ? 0.01 : 0.6, ease: "expo.inOut" }, "-=0.45");
  });
}

function route() {
  const m = location.hash.match(/^#\/p\/([\w-]+)/);
  if (m) {
    if (!openCase(m[1])) history.replaceState(null, "", location.pathname + location.search);
  } else closeCase();
}

function requestCloseCase() {
  if (openedViaClick && history.length > 1) {
    openedViaClick = false;
    history.back();
  } else {
    history.replaceState(null, "", location.pathname + location.search);
    closeCase();
  }
}

function initRouter() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#/p/"]');
    if (!a) return;
    if (caseOpen) {
      e.preventDefault();
      history.replaceState(null, "", a.getAttribute("href"));
      route();
    } else openedViaClick = true;
  });
  addEventListener("hashchange", route);
  $(".case__close").addEventListener("click", requestCloseCase);
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (caseOpen) requestCloseCase();
      else if (root.classList.contains("menu-open")) toggleMenu(false);
    }
    // keep focus inside the dialog
    if (e.key === "Tab" && caseOpen) {
      const f = $$('#case a[href], #case button, #case [tabindex]:not([tabindex="-1"])').filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ============================================================ choreography */
/* reduced motion: show everything in its final state, no choreography */
function initStatic() {
  buildLossChart()?.set(1);
  $$("[data-count]").forEach((el) => (el.textContent = (+el.dataset.count).toFixed(+el.dataset.decimals || 0)));
}

function initReveals() {
  // section headings — 3D character roll
  $$(".sec-head__title[data-split-chars]").forEach((h) => {
    const chars = splitChars(h);
    gsap.set(h, { perspective: 600 });
    gsap.from(chars, {
      yPercent: 115,
      rotateX: -85,
      opacity: 0,
      transformOrigin: "50% 100% -20px",
      stagger: 0.025,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: h, start: "top 88%" },
    });
  });
  $$(".sec-head").forEach((h) => {
    gsap.from($$(".sec-head__idx, .sec-head__note", h), {
      opacity: 0, y: 14, duration: 0.8, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: h, start: "top 88%" },
    });
    gsap.from(h, { "--rule": 0, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: h, start: "top 88%" } });
  });

  // generic fade-ups
  gsap.set("[data-reveal]", { opacity: 0 });
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09, ease: "expo.out", overwrite: true }),
  });

  // statement — words light up as you read
  const st = $(".about__statement");
  if (st) {
    const words = splitWords(st);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  }

  // stats count up
  $$("[data-count]").forEach((el) => {
    const v = parseFloat(el.dataset.count);
    const dec = +el.dataset.decimals || 0;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v, duration: 1.8, ease: "expo.out", onUpdate: () => (el.textContent = o.v.toFixed(dec)) }),
    });
  });

  // training log — chart draws while you read the epochs
  const chart = buildLossChart();
  if (chart) {
    chart.set(0);
    const mm = gsap.matchMedia();
    // desktop: the chart is sticky, so it draws as you read the epochs
    mm.add("(min-width: 901px)", () => {
      ScrollTrigger.create({
        trigger: ".log__list",
        start: "top 65%",
        end: "bottom 70%",
        scrub: 0.6,
        onUpdate: (s) => chart.set(s.progress),
      });
    });
    // mobile: the chart sits above the list, so it draws itself on sight
    mm.add("(max-width: 900px)", () => {
      const o = { p: 0 };
      chart.set(0);
      const tw = gsap.to(o, { p: 1, duration: reduced ? 0.01 : 2.6, ease: "power2.inOut", paused: true, onUpdate: () => chart.set(o.p) });
      ScrollTrigger.create({ trigger: ".chart", start: "top 75%", once: true, onEnter: () => tw.play() });
      return () => tw.kill();
    });
  }
  $$(".epoch").forEach((ep) => {
    gsap.from(ep, { opacity: 0, x: 40, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ep, start: "top 85%" } });
    ScrollTrigger.create({ trigger: ep, start: "top 60%", end: "bottom 40%", toggleClass: "is-current" });
  });

  // project cards — rise in 3D
  $$(".grid .card").forEach((card, i) => {
    gsap.from(card, {
      y: 120, rotateX: 18, opacity: 0, transformPerspective: 1200, transformOrigin: "50% 0%",
      duration: 1.4, ease: "expo.out", delay: (i % 2) * 0.12,
      scrollTrigger: { trigger: card, start: "top 92%" },
    });
    const media = $(".card__inner", card);
    if (media && !reduced) {
      gsap.fromTo(media, { clipPath: "inset(18% 12% 18% 12%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 92%" },
      });
    }
  });
  $$(".archive .row").forEach((row) =>
    gsap.from(row, { opacity: 0, y: 24, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 92%" } })
  );

  // model card rows
  gsap.from(".yaml__row", {
    opacity: 0, x: -20, stagger: 0.06, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".yaml", start: "top 75%" },
  });

  // education rows: rule draws across
  $$(".edu__row").forEach((row) =>
    gsap.from(row, { "--rule": 0, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: row, start: "top 90%" } })
  );

  // contact headline — words rise
  const head = $("[data-words-rise]");
  if (head) {
    const words = splitWords(head, "wr");
    words.forEach((w) => {
      const wrap = document.createElement("span");
      wrap.className = "wr-mask";
      w.replaceWith(wrap);
      wrap.appendChild(w);
    });
    gsap.from(words, {
      yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.06, ease: "expo.out",
      scrollTrigger: { trigger: head, start: "top 85%" },
    });
  }

  // hero recedes as you leave it
  if (!reduced) {
    gsap.to(".hero__title", {
      yPercent: -18, opacity: 0.15, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

}

/* which figure is on stage + which nav link is lit */
function initSections() {
  $$("section[data-figure]").forEach((sec) => {
    const fig = +sec.dataset.figure;
    ScrollTrigger.create({
      trigger: sec,
      start: sec.id === "top" ? "top top" : "top 55%",
      end: "bottom 55%",
      onToggle: (self) => {
        if (!self.isActive) return;
        currentFigure = fig;
        if (introDone) {
          scene?.goTo(fig);
          sound?.setMood(fig);
        }
        const id = sec.id;
        $$("[data-nav]").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === id || (id === "credentials" && a.dataset.nav === "toolkit")));
      },
    });
  });
}

/* ================================================================= sound */
function initSound() {
  const M = SITE.music;
  const spotify = M && toSpotifyUri(M.spotify);
  if (!M || (!spotify && !(window.AudioContext || window.webkitAudioContext))) {
    $$("[data-sound]").forEach((b) => b.closest(".hero__meta > div, .sound")?.remove());
    return;
  }
  const buttons = $$("[data-sound]");
  const bars = $$(".sound__bars i");

  const sync = (on) => {
    root.classList.toggle("sound-on", on);
    buttons.forEach((b) => {
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Pause soundtrack" : "Play soundtrack");
    });
    $$("[data-sound-label]").forEach((l) => scramble(l, on ? "Pause" : "Play", 0.35));
  };

  sound = spotify
    ? createSpotifyPlayer({ link: M.spotify, onChange: sync }) // play/pause can also come from the embed itself
    : createSoundtrack({ src: M.src || "" });

  const toggle = async () => {
    try {
      sync(await sound.toggle());
    } catch (err) {
      console.warn("[sound] could not start audio", err);
      sync(false);
    }
  };
  buttons.forEach((b) => b.addEventListener("click", toggle));
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest("input, textarea")) toggle();
  });

  // equaliser icon + particles breathe with the music
  gsap.ticker.add(() => {
    if (!sound.playing && !root.classList.contains("sound-on")) {
      if (bars[0]?.__on) {
        bars.forEach((b) => { b.style.transform = ""; b.__on = false; });
        scene?.setPulse(0);
      }
      return;
    }
    const lv = sound.level();
    scene?.setPulse(lv);
    sound.bands(bars.length).forEach((v, i) => {
      bars[i].style.transform = `scaleY(${(0.15 + v * 0.85).toFixed(3)})`;
      bars[i].__on = true;
    });
  });
}

function onFigure(i) {
  setFigureCaption(i);
  sound?.setMood(i);
}

/* ================================================================== scene */
async function initScene() {
  const canvas = $("#field");
  try {
    // probe on a throwaway canvas so three.js can create the real context with its own settings
    if (!document.createElement("canvas").getContext("webgl2")) throw new Error("WebGL2 unavailable");
    const { createScene } = await import("./scene.js");
    const small = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
    scene = createScene(canvas, {
      count: small ? 22000 : 52000,
      reducedMotion: reduced,
      onFigure,
    });
    scene.start();
    if (finePointer) {
      addEventListener("pointermove", (e) => scene.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, true));
      root.addEventListener("mouseleave", () => scene.setPointer(10, 10, false));
    }
  } catch (err) {
    console.warn("[field] WebGL unavailable — falling back to static backdrop.", err);
    root.classList.add("no-webgl");
  }
}

/* ================================================================ loader + intro */
let introDone = false;
let currentFigure = 1;

async function runLoader(ready) {
  const num = $(".loader__num");
  const bar = $(".loader__bar i");
  const counter = { v: 0 };
  const quick = (() => { try { return sessionStorage.getItem("pp-visited") === "1"; } catch { return false; } })();
  try { sessionStorage.setItem("pp-visited", "1"); } catch {}

  const show = () => {
    num.textContent = pad(Math.round(counter.v), 3);
    bar.style.transform = `scaleX(${counter.v / 100})`;
  };
  const first = gsap.to(counter, { v: 82, duration: quick ? 0.5 : 1.6, ease: "power2.out", onUpdate: show });
  await Promise.all([ready, first.then()]);
  await gsap.to(counter, { v: 100, duration: 0.35, ease: "power1.inOut", onUpdate: show }).then();
}

function intro() {
  const loader = $(".loader");
  if (reduced) {
    gsap.to(loader, {
      opacity: 0, duration: 0.4,
      onComplete: () => {
        loader.remove();
        introDone = true;
        scene?.goTo(currentFigure);
        setFigureCaption(currentFigure);
        ScrollTrigger.refresh();
        if (/^#\/p\//.test(location.hash)) route();
      },
    });
    return;
  }
  const heroChars = $$(".hero__title [data-split-chars]").flatMap((w) => splitChars(w));
  const tl = gsap.timeline({
    onComplete: () => {
      loader.remove();
      introDone = true;
      ScrollTrigger.refresh();
      if (/^#\/p\//.test(location.hash)) route();
      else lenis?.start();
    },
  });
  tl.to(".loader__num", { yPercent: -110, duration: 0.7, ease: "expo.in" })
    .to(".loader__row, .loader__bar", { opacity: 0, duration: 0.4 }, "<")
    .add(() => { scene?.goTo(currentFigure, { duration: 2.8 }); setFigureCaption(currentFigure); })
    .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.1")
    .from(heroChars, {
      yPercent: 120, rotateX: -90, opacity: 0, transformOrigin: "50% 100% -30px",
      stagger: 0.035, duration: 1.4, ease: "expo.out",
    }, "-=0.55")
    .from("[data-hero-fade]", { opacity: 0, y: 24, stagger: 0.08, duration: 1, ease: "power3.out" }, "-=1.1")
    .from(".nav > *", { opacity: 0, y: -16, stagger: 0.06, duration: 0.8, ease: "power3.out" }, "-=1")
    .from(".hud > *", { opacity: 0, duration: 1 }, "-=0.8");
}

/* ================================================================== boot */
function signature() {
  console.log(
    "%c PP %c Hi, curious engineer. This site is hand-built: Three.js, GSAP, Lenis, and no templates.\n    Source: " + SITE.profile.github,
    "background:#6aa9ff;color:#07080a;font-weight:700;padding:2px 6px;border-radius:2px",
    "color:#e8edf4"
  );
}

async function boot() {
  render();
  initScroll();
  initCursor();
  initCovers();
  initTilt();
  initFilters();
  initPreview();
  initPending();
  initCopy();
  initRouter();
  initSound();
  initMagnetic();
  initScrambleHover();
  $(".nav__menu").addEventListener("click", () => toggleMenu());

  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  const sceneReady = initScene();
  await fonts; // measure text with real fonts before splitting
  if (reduced) initStatic();
  else initReveals();
  initSections();
  initHud();
  await runLoader(Promise.all([sceneReady, fonts]));
  intro();
  signature();

  if (location.hash.length > 1 && !location.hash.startsWith("#/")) {
    let t = null;
    try { t = $(location.hash); } catch {}
    if (t) scrollToTarget(t, { immediate: true });
  }
}

boot();
