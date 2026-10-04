/* ==========================================================================
   SPOTIFY — plays a track (or album / playlist) through Spotify's official
   embed, driven by the site's own ◈ Play buttons via the Spotify iFrame API.
   Nothing is downloaded or re-hosted, so it's licensed and the artist gets
   the stream. Visitors logged into Spotify hear the full song; everyone
   else gets Spotify's 30-second preview. The embed script only loads when
   someone presses Play.
   ========================================================================== */

const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

/** Accepts an open.spotify.com link or a spotify: URI and returns a URI ("" if invalid). */
export function toSpotifyUri(link) {
  const s = String(link || "").trim();
  if (/^spotify:(track|album|playlist|episode|show):[A-Za-z0-9]+$/.test(s)) return s;
  const m = s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : "";
}

let apiPromise = null;
function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => resolve(IFrameAPI);
    const script = document.createElement("script");
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Spotify embed failed to load"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function createSpotifyPlayer({ link, loop = true, onChange = () => {} }) {
  const uri = toSpotifyUri(link);
  let controller = null;
  let ready = null;
  let playing = false;
  let started = false;
  let wantPlaying = false;
  let restarting = false;
  const t0 = performance.now();

  // a small dock that holds the official player while music is on
  const dock = document.createElement("div");
  dock.className = "dock";
  dock.setAttribute("role", "region");
  dock.setAttribute("aria-label", "Music player");
  dock.innerHTML = `<button class="dock__close" type="button" aria-label="Close music player">✕</button><div class="dock__embed"><div></div></div>`;
  document.body.appendChild(dock);
  const mount = dock.querySelector(".dock__embed > div");
  dock.querySelector(".dock__close").addEventListener("click", () => {
    pause();
    show(false);
  });

  function show(on) {
    document.documentElement.classList.toggle("dock-open", on);
  }

  function setPlaying(p) {
    if (p === playing) return;
    playing = p;
    onChange(p);
  }

  function init() {
    if (ready) return ready;
    ready = loadApi().then(
      (API) =>
        new Promise((resolve) => {
          API.createController(mount, { uri, width: "100%", height: 80 }, (c) => {
            controller = c;
            c.addListener("playback_update", (e) => {
              const { isPaused, position, duration } = e.data;
              lastProgress = performance.now();
              // Spotify parks at position === duration when a track ends; start it over
              if (loop && wantPlaying && duration > 0 && position >= duration - 250) {
                restart();
                return;
              }
              if (position < duration - 250) restarting = false;
              setPlaying(!isPaused);
            });
            c.addListener("ready", () => resolve(c));
            setTimeout(() => resolve(c), 4000); // don't hang if "ready" was missed
          });
        })
    );
    ready.catch(() => (ready = null));
    return ready;
  }

  let lastProgress = 0;
  function restart() {
    if (restarting || !controller) return;
    restarting = true;
    controller.play(); // play() starts the loaded track from the top
    // if Spotify ignores it, try again until updates resume
    setTimeout(function check() {
      if (!restarting || !wantPlaying) return;
      if (performance.now() - lastProgress > 2000) controller.play();
      setTimeout(check, 2500);
    }, 2500);
  }

  async function play() {
    wantPlaying = true;
    show(true);
    const c = await init();
    if (started) c.resume();
    else {
      c.play();
      started = true;
    }
    setPlaying(true);
  }

  function pause() {
    wantPlaying = false;
    controller?.pause();
    setPlaying(false);
  }

  // Cross-origin audio can't be analysed, so the visuals get a gentle,
  // music-like breathing while the song plays instead of a live meter.
  const swell = (t, f, p) => 0.5 + 0.5 * Math.sin(t * f + p);

  return {
    get playing() {
      return playing;
    },
    async toggle() {
      if (playing) pause();
      else await play();
      return playing;
    },
    setMood() {},
    level() {
      if (!playing) return 0;
      const t = (performance.now() - t0) / 1000;
      return 0.1 + 0.18 * swell(t, 2.9, 0) * swell(t, 0.7, 1.3);
    },
    bands(n = 4) {
      const out = new Array(n).fill(0);
      if (!playing) return out;
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < n; i++) out[i] = 0.25 + 0.6 * swell(t, 3.1 + i * 1.7, i * 2.1) * swell(t, 0.9 + i * 0.4, i);
      return out;
    },
  };
}
