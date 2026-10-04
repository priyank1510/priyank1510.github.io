/* ==========================================================================
   SOUNDTRACK — "Latent Drift"
   An ambient piece composed live in the browser with the Web Audio API:
   warm detuned pads, FM glass bells wandering a pentatonic scale, a sub
   bass, a little wind, all through a long synthetic reverb. Nothing is
   downloaded and nothing needs licensing. Each section of the page
   nudges the mood (brightness + how often the bells speak).

   Prefer a real track? Set `music.src` in content.js to an MP3 you have
   the rights to, and this plays that instead (same controls, same pulse).
   ========================================================================== */

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

// D – Bm – G – A, voiced wide and soft
const CHORDS = [
  { bass: 38, notes: [50, 57, 61, 64, 66] }, // Dmaj9
  { bass: 35, notes: [47, 54, 57, 62, 64] }, // Bm11
  { bass: 43, notes: [43, 50, 54, 57, 61] }, // Gmaj9(#11)
  { bass: 45, notes: [45, 52, 59, 61, 64] }, // A add9
];
const SCALE = [69, 71, 74, 76, 78, 81, 83, 86, 88]; // D major pentatonic, upper register

const BPM = 66;
const EIGHTH = 60 / BPM / 2;
const STEPS_PER_CHORD = 16;

// per page figure: [pad cutoff Hz, bell density]
const MOODS = [
  [700, 0.1],
  [1050, 0.22],
  [850, 0.16],
  [1250, 0.26],
  [1500, 0.3],
  [1150, 0.22],
  [1900, 0.34],
];

function impulse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

export function createSoundtrack({ src = "" } = {}) {
  let ctx = null;
  let nodes = null;
  let playing = false;
  let timer = 0;
  let step = 0;
  let nextTime = 0;
  let chordIndex = 0;
  let melody = 4;
  let mood = MOODS[1];
  let media = null;
  let stopTimer = 0;
  const timeData = new Uint8Array(256);
  const freqData = new Uint8Array(128);
  const bandAvg = [];
  let levelAvg = 0;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    master.connect(comp).connect(analyser).connect(ctx.destination);

    if (src) {
      media = new Audio(src);
      media.loop = true;
      media.preload = "auto";
      ctx.createMediaElementSource(media).connect(master);
      nodes = { master, analyser };
      return;
    }

    // space
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 5.5, 2.6);
    const wet = ctx.createGain();
    wet.gain.value = 0.85;
    reverb.connect(wet).connect(master);
    const dry = ctx.createGain();
    dry.gain.value = 0.9;
    dry.connect(master);

    // pads
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = mood[0];
    padFilter.Q.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 260;
    lfo.connect(lfoDepth).connect(padFilter.frequency);
    lfo.start();
    const padOut = ctx.createGain();
    padOut.gain.value = 0.8;
    padFilter.connect(padOut);
    padOut.connect(dry);
    const padSend = ctx.createGain();
    padSend.gain.value = 0.55;
    padOut.connect(padSend).connect(reverb);

    // bells → ping delay → reverb
    const bells = ctx.createGain();
    bells.gain.value = 1;
    const bellDry = ctx.createGain();
    bellDry.gain.value = 0.45;
    bells.connect(bellDry).connect(dry);
    const bellSend = ctx.createGain();
    bellSend.gain.value = 0.7;
    bells.connect(bellSend).connect(reverb);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = EIGHTH * 1.5;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2600;
    bells.connect(delay);
    delay.connect(tone).connect(feedback).connect(delay);
    const delayOut = ctx.createGain();
    delayOut.gain.value = 0.32;
    tone.connect(delayOut);
    delayOut.connect(reverb);
    delayOut.connect(dry);

    // wind
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900;
    band.Q.value = 0.5;
    const air = ctx.createGain();
    air.gain.value = 0.012;
    const airLfo = ctx.createOscillator();
    airLfo.frequency.value = 0.07;
    const airDepth = ctx.createGain();
    airDepth.gain.value = 0.008;
    airLfo.connect(airDepth).connect(air.gain);
    noise.connect(band).connect(air).connect(reverb);
    noise.start();
    airLfo.start();

    nodes = { master, analyser, dry, padFilter, bells };
  }

  /* --------------------------------------------------------------- voices */
  function pad(chord, t, dur) {
    const attack = 2.6;
    const release = 4.8;
    const end = t + dur;
    chord.notes.forEach((m) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.045, t + attack);
      g.gain.setValueAtTime(0.045, end);
      g.gain.linearRampToValueAtTime(0, end + release);
      g.connect(nodes.padFilter);
      for (const cents of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = midi(m);
        o.detune.value = cents + rand(-3, 3);
        o.connect(g);
        o.start(t);
        o.stop(end + release + 0.1);
      }
    });
    // sub
    const b = ctx.createOscillator();
    b.type = "sine";
    b.frequency.value = midi(chord.bass);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0, t);
    bg.gain.linearRampToValueAtTime(0.11, t + 1.8);
    bg.gain.setValueAtTime(0.11, end);
    bg.gain.linearRampToValueAtTime(0, end + 3);
    b.connect(bg).connect(nodes.dry);
    b.start(t);
    b.stop(end + 3.1);
  }

  function bell(m, t, vel = 1, pan = 0) {
    const f = midi(m);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f;
    const index = ctx.createGain();
    index.gain.setValueAtTime(f * 1.9 * vel, t);
    index.gain.exponentialRampToValueAtTime(f * 0.02, t + 1.4);
    mod.connect(index).connect(car.frequency);
    // glassy shimmer partial
    const shimmer = ctx.createOscillator();
    shimmer.frequency.value = f * 3.5;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.012 * vel, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.06 * vel, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (p) p.pan.value = pan;
    car.connect(env);
    shimmer.connect(sg).connect(p || nodes.bells);
    env.connect(p || nodes.bells);
    if (p) p.connect(nodes.bells);
    for (const o of [car, mod, shimmer]) {
      o.start(t);
      o.stop(t + 3.8);
    }
  }

  /* ------------------------------------------------------------ sequencer */
  function tick() {
    while (nextTime < ctx.currentTime + 0.3) {
      const pos = step % STEPS_PER_CHORD;
      if (pos === 0) {
        const chord = CHORDS[chordIndex++ % CHORDS.length];
        pad(chord, nextTime, EIGHTH * STEPS_PER_CHORD);
        // a soft rolled arpeggio to announce the chord
        if (Math.random() < 0.7) {
          chord.notes.slice(1, 4).forEach((m, i) => bell(m + 12, nextTime + i * EIGHTH * 0.5 + 0.02, 0.35, rand(-0.4, 0.4)));
        }
      }
      const accent = pos % 4 === 0 ? 1.35 : pos % 2 === 0 ? 1 : 0.5;
      if (Math.random() < mood[1] * accent) {
        melody = Math.max(0, Math.min(SCALE.length - 1, melody + pick([-2, -1, -1, 0, 1, 1, 2])));
        bell(SCALE[melody], nextTime + rand(0, 0.015), rand(0.55, 1), rand(-0.6, 0.6));
        if (Math.random() < 0.14) {
          const up = Math.min(SCALE.length - 1, melody + 2);
          bell(SCALE[up], nextTime + EIGHTH, rand(0.4, 0.7), rand(-0.6, 0.6));
        }
      }
      nextTime += EIGHTH;
      step++;
    }
  }

  /* --------------------------------------------------------------- public */
  async function play() {
    clearTimeout(stopTimer);
    if (!ctx) build();
    await ctx.resume();
    const now = ctx.currentTime;
    nodes.master.gain.cancelScheduledValues(now);
    nodes.master.gain.setValueAtTime(nodes.master.gain.value, now);
    nodes.master.gain.setTargetAtTime(src ? 0.9 : 0.85, now, 0.9);
    if (media) {
      await media.play();
    } else if (!timer) {
      nextTime = now + 0.12;
      timer = setInterval(tick, 50);
      tick();
    }
    playing = true;
  }

  function pause() {
    if (!ctx) return;
    playing = false;
    const now = ctx.currentTime;
    nodes.master.gain.cancelScheduledValues(now);
    nodes.master.gain.setValueAtTime(nodes.master.gain.value, now);
    nodes.master.gain.setTargetAtTime(0, now, 0.35);
    clearTimeout(stopTimer);
    stopTimer = setTimeout(() => {
      clearInterval(timer);
      timer = 0;
      media?.pause();
      ctx.suspend();
    }, 1600);
  }

  // pause quietly in background tabs, pick back up on return
  let resumeOnShow = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) {
      resumeOnShow = true;
      pause();
    } else if (!document.hidden && resumeOnShow) {
      resumeOnShow = false;
      play().catch(() => {});
    }
  });

  return {
    get playing() {
      return playing;
    },
    async toggle() {
      if (playing) pause();
      else await play();
      return playing;
    },
    setMood(i) {
      mood = MOODS[Math.max(0, Math.min(MOODS.length - 1, i))];
      if (ctx && nodes.padFilter) nodes.padFilter.frequency.setTargetAtTime(mood[0], ctx.currentTime, 1.8);
    },
    /** 0..1, follows the music's dynamics (bell hits, swells) rather than raw loudness */
    level() {
      if (!ctx || !nodes || ctx.state !== "running") return 0;
      nodes.analyser.getByteTimeDomainData(timeData);
      let sum = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / timeData.length);
      levelAvg += (rms - levelAvg) * 0.03;
      return Math.max(0, Math.min(1, 0.12 + (rms - levelAvg) * 16));
    },
    /** n bands 0..1 for the equaliser icon, each normalised against its own running average */
    bands(n = 4) {
      const out = new Array(n).fill(0);
      if (!ctx || !nodes || ctx.state !== "running") return out;
      nodes.analyser.getByteFrequencyData(freqData);
      const edges = [1, 4, 8, 16, 40];
      for (let i = 0; i < n; i++) {
        let sum = 0, c = 0;
        for (let k = edges[i]; k < edges[i + 1]; k++) { sum += freqData[k]; c++; }
        const v = c ? sum / c / 255 : 0;
        bandAvg[i] = (bandAvg[i] ?? v) + (v - (bandAvg[i] ?? v)) * 0.04;
        out[i] = Math.max(0, Math.min(1, 0.35 + (v - bandAvg[i]) * 7));
      }
      return out;
    },
  };
}
