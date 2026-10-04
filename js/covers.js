/* ==========================================================================
   GENERATIVE COVERS — every project gets its own deterministic artwork,
   seeded by its slug. Same project, same picture; hover and it comes alive.
   ========================================================================== */

const TAU = Math.PI * 2;
const INK = "#0c0e12";
const BONE = "232, 237, 244";
const ACCENT = "106, 169, 255";

export const COVER_STYLES = ["contours", "flow", "orbits", "halftone", "spectrum"];

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* A smooth scalar field: a few low-frequency waves plus gaussian hills. */
function makeField(r) {
  const waves = Array.from({ length: 4 }, () => ({
    fx: (r() * 2 - 1) * 4.2,
    fy: (r() * 2 - 1) * 4.2,
    ph: r() * TAU,
    sp: (r() * 2 - 1) * 0.6,
    a: 0.18 + r() * 0.3,
  }));
  const hills = Array.from({ length: 4 }, () => ({
    x: 0.15 + r() * 1.2,
    y: 0.1 + r() * 0.8,
    s: 0.03 + r() * 0.09,
    a: (r() < 0.7 ? 1 : -1) * (0.6 + r() * 0.9),
  }));
  return (x, y, t = 0) => {
    let v = 0;
    for (const w of waves) v += w.a * Math.sin(w.fx * x + w.fy * y + w.ph + t * w.sp);
    for (const h of hills) {
      const dx = x - h.x, dy = y - h.y;
      v += h.a * Math.exp(-(dx * dx + dy * dy) / h.s);
    }
    return v;
  };
}

/* ------------------------------------------------------------- painters */
const painters = {
  contours(ctx, w, h, r, dpr, field, t) {
    const aspect = w / h;
    const gx = 150, gy = Math.max(40, Math.round(150 / aspect));
    const cw = w / gx, ch = h / gy;
    const vals = new Float32Array((gx + 1) * (gy + 1));
    let min = Infinity, max = -Infinity;
    for (let j = 0; j <= gy; j++)
      for (let i = 0; i <= gx; i++) {
        const v = field((i / gx) * aspect, j / gy, t);
        vals[j * (gx + 1) + i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    const levels = 26;
    const accentLevel = 2 + Math.floor(r.fixed * (levels - 4));
    for (let l = 1; l < levels; l++) {
      const L = min + ((max - min) * l) / levels;
      const major = l % 5 === 0;
      const isAccent = l === accentLevel;
      ctx.strokeStyle = isAccent ? `rgba(${ACCENT},0.95)` : `rgba(${BONE},${major ? 0.62 : 0.22})`;
      ctx.lineWidth = (isAccent ? 1.6 : major ? 1.1 : 0.7) * dpr;
      ctx.beginPath();
      for (let j = 0; j < gy; j++)
        for (let i = 0; i < gx; i++) {
          const a = vals[j * (gx + 1) + i];
          const b = vals[j * (gx + 1) + i + 1];
          const c = vals[(j + 1) * (gx + 1) + i + 1];
          const d = vals[(j + 1) * (gx + 1) + i];
          let idx = 0;
          if (a > L) idx |= 8;
          if (b > L) idx |= 4;
          if (c > L) idx |= 2;
          if (d > L) idx |= 1;
          if (idx === 0 || idx === 15) continue;
          const x = i * cw, y = j * ch;
          const top = [x + cw * ((L - a) / (b - a)), y];
          const right = [x + cw, y + ch * ((L - b) / (c - b))];
          const bottom = [x + cw * ((L - d) / (c - d)), y + ch];
          const left = [x, y + ch * ((L - a) / (d - a))];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 10: seg(left, bottom); seg(top, right); break;
          }
        }
      ctx.stroke();
    }
  },

  flow(ctx, w, h, r, dpr, field, t) {
    const aspect = w / h;
    const rr = mulberry32(r.seed);
    const lines = 1100;
    const steps = 70;
    const stepLen = 0.0065;
    ctx.lineCap = "round";
    for (let n = 0; n < lines; n++) {
      let x = rr() * aspect, y = rr();
      const accent = rr() < 0.045;
      ctx.strokeStyle = accent ? `rgba(${ACCENT},0.85)` : `rgba(${BONE},${0.08 + rr() * 0.22})`;
      ctx.lineWidth = (accent ? 1.2 : 0.7) * dpr;
      ctx.beginPath();
      ctx.moveTo((x / aspect) * w, y * h);
      for (let s = 0; s < steps; s++) {
        const a = field(x, y, t) * Math.PI * 1.1;
        x += Math.cos(a) * stepLen;
        y += Math.sin(a) * stepLen;
        if (x < 0 || x > aspect || y < 0 || y > 1) break;
        ctx.lineTo((x / aspect) * w, y * h);
      }
      ctx.stroke();
    }
  },

  orbits(ctx, w, h, r, dpr, field, t) {
    const rr = mulberry32(r.seed);
    const cx = w * (0.35 + rr() * 0.3), cy = h * (0.4 + rr() * 0.2);
    const tilt = (rr() - 0.5) * 0.9;
    const squash = 0.32 + rr() * 0.25;
    const rings = 9 + Math.floor(rr() * 5);
    const maxR = Math.max(w, h) * 0.62;
    const accentRing = 2 + Math.floor(rr() * (rings - 3));
    // radial ticks
    ctx.strokeStyle = `rgba(${BONE},0.08)`;
    ctx.lineWidth = dpr;
    ctx.beginPath();
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * TAU;
      ctx.moveTo(cx + Math.cos(a) * maxR * 0.08, cy + Math.sin(a) * maxR * 0.08 * squash * 2);
      ctx.lineTo(cx + Math.cos(a) * maxR * 1.2, cy + Math.sin(a) * maxR * 1.2);
    }
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    for (let i = 1; i <= rings; i++) {
      const R = (maxR * i) / rings;
      const acc = i === accentRing;
      ctx.strokeStyle = acc ? `rgba(${ACCENT},0.9)` : `rgba(${BONE},${0.14 + (i % 3 === 0 ? 0.25 : 0)})`;
      ctx.lineWidth = (acc ? 1.4 : 0.8) * dpr;
      ctx.setLineDash(i % 4 === 0 ? [3 * dpr, 5 * dpr] : []);
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * squash, 0, 0, TAU);
      ctx.stroke();
      // bodies
      const bodies = 1 + Math.floor(rr() * 3);
      for (let b = 0; b < bodies; b++) {
        const a = rr() * TAU + t * (0.6 / Math.sqrt(i)) * (rr() < 0.5 ? 1 : -1);
        const size = (1.5 + rr() * 3.5) * dpr * (acc ? 1.6 : 1);
        ctx.fillStyle = acc ? `rgb(${ACCENT})` : `rgba(${BONE},0.9)`;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R, Math.sin(a) * R * squash, size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.setLineDash([]);
    // core
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.12);
    g.addColorStop(0, `rgba(${BONE},0.95)`);
    g.addColorStop(1, `rgba(${BONE},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, maxR * 0.12, 0, TAU);
    ctx.fill();
    ctx.restore();
  },

  halftone(ctx, w, h, r, dpr, field, t) {
    const aspect = w / h;
    const step = 9 * dpr;
    let min = Infinity, max = -Infinity;
    const cols = Math.ceil(w / step) + 1, rows = Math.ceil(h / step) + 1;
    const vals = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const v = field(((i * step) / w) * aspect, (j * step) / h, t);
        vals[j * cols + i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const n = (vals[j * cols + i] - min) / (max - min);
        const rad = Math.pow(n, 1.6) * step * 0.55;
        if (rad < 0.4 * dpr) continue;
        ctx.fillStyle = n > 0.86 ? `rgb(${ACCENT})` : `rgba(${BONE},${0.25 + n * 0.7})`;
        ctx.beginPath();
        ctx.arc(i * step + (j % 2) * step * 0.5, j * step, rad, 0, TAU);
        ctx.fill();
      }
  },

  spectrum(ctx, w, h, r, dpr, field, t) {
    // ridgelines — a stack of time series
    const rr = mulberry32(r.seed);
    const lines = 30;
    const top = h * 0.16, bottom = h * 0.95;
    const gap = (bottom - top) / lines;
    const accentLine = 6 + Math.floor(rr() * (lines - 12));
    const peaks = Array.from({ length: 3 }, () => ({ c: 0.25 + rr() * 0.5, s: 0.004 + rr() * 0.01, a: 0.6 + rr() }));
    for (let l = 0; l < lines; l++) {
      const y0 = top + l * gap;
      const pts = [];
      const N = 140;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        let env = 0;
        for (const p of peaks) env += p.a * Math.exp(-((u - p.c) ** 2) / (p.s * 6));
        const n = field(u * 2.2, l * 0.11, t) * 0.5 + 0.5;
        const v = env * (0.35 + n) * gap * 3.2 + Math.abs(Math.sin(u * 60 + l + t * 2)) * gap * 0.12;
        pts.push([u * w, y0 - v]);
      }
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (const [x, y] of pts) ctx.lineTo(x, y);
      ctx.lineTo(w, y0);
      ctx.closePath();
      ctx.fillStyle = INK;
      ctx.fill();
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      const acc = l === accentLine;
      ctx.strokeStyle = acc ? `rgba(${ACCENT},1)` : `rgba(${BONE},${0.35 + (l / lines) * 0.5})`;
      ctx.lineWidth = (acc ? 1.6 : 1) * dpr;
      ctx.stroke();
    }
  },
};

/* ---------------------------------------------------------------- public */
export function createCover(canvas, seedStr, style) {
  const seed = hashString(seedStr);
  const pick = COVER_STYLES.includes(style) ? style : COVER_STYLES[seed % COVER_STYLES.length];
  const r = mulberry32(seed);
  const field = makeField(r);
  const meta = { seed, fixed: r() };
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, dpr = 1, t = 0, raf = 0, playing = false, last = 0;

  function size() {
    // layout size (ignores hover/tilt transforms)
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nw = Math.max(2, Math.round(canvas.clientWidth * dpr));
    const nh = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (nw === w && nh === h) return false;
    w = canvas.width = nw;
    h = canvas.height = nh;
    return true;
  }

  function draw() {
    if (!w || !h) return;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, w, h);
    painters[pick](ctx, w, h, meta, dpr, field, t);
    // vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, "rgba(7,8,10,0)");
    g.addColorStop(1, "rgba(7,8,10,0.65)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function loop(now) {
    if (!playing) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt * 0.9;
    draw();
  }

  return {
    style: pick,
    seedHex: "0x" + seed.toString(16).padStart(8, "0").slice(0, 6),
    render() {
      size();
      draw();
    },
    resize() {
      if (size()) draw();
    },
    play() {
      if (playing) return;
      playing = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    pause() {
      playing = false;
      cancelAnimationFrame(raf);
    },
  };
}
