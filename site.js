/* =========================================================
   SUNFLOWER — site.js (mobile-friendly + animations ON)
   Includes:
   - Bar charts (energy + cost)
   - Climate chart (Chart.js demo)
   - 11 formula buttons -> info panel (English)
   - Comparison animations (3 canvases) optimized for phones:
       * 30 FPS on mobile
       * dpr capped
       * pause when offscreen
       * single RAF loop for all canvases
   ========================================================= */

/* ------------------ PERF / ENV ------------------ */
const PERF = (() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmall = window.matchMedia?.("(max-width: 900px)")?.matches ?? false;
  const isMobile = isTouch || isSmall;

  // We DO NOT disable animations on mobile.
  // We only reduce their complexity.
  const targetFPS = isMobile ? 30 : 60;
  const dprCap = isMobile ? 1.5 : 2; // cap DPR to avoid huge canvas on phones

  const mathjaxDebounceMs = isMobile ? 200 : 90;

  return { prefersReducedMotion, isMobile, targetFPS, dprCap, mathjaxDebounceMs };
})();

/* ------------------ HELPERS ------------------ */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function throttle(fn, wait = 160) {
  let last = 0, t = null, lastArgs = null;
  return (...args) => {
    const now = Date.now();
    lastArgs = args;
    if (now - last >= wait) {
      last = now;
      fn(...args);
      return;
    }
    clearTimeout(t);
    t = setTimeout(() => {
      last = Date.now();
      fn(...lastArgs);
    }, wait);
  };
}

function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ------------------ MathJax typeset (throttled) ------------------ */
const typesetMath = debounce(() => {
  if (!window.MathJax || !window.MathJax.typesetPromise) return;
  const panel = $("#formulaPanel");
  if (!panel) return;
  window.MathJax.typesetPromise([panel]).catch(() => {});
}, PERF.mathjaxDebounceMs);

/* ------------------ SIMPLE BAR CHART ------------------ */
function renderBars(containerId, items, maxValue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const frag = document.createDocumentFragment();
  container.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "barRow";

    const label = document.createElement("div");
    label.className = "barLabel";
    label.textContent = item.label;

    const track = document.createElement("div");
    track.className = "barTrack";

    const fill = document.createElement("div");
    fill.className = "barFill";
    const percent = clamp(item.value / maxValue, 0, 1);
    fill.style.width = (percent * 100).toFixed(1) + "%";
    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "barValue";
    value.textContent = item.valueText || String(item.value);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    frag.appendChild(row);
  });

  container.appendChild(frag);
}

/* ------------------ DATA ------------------ */
const energyData = [
  { label: "Fixed system", value: 1350, valueText: "1350" },
  { label: "Conventional tracker", value: 1600, valueText: "1600" },
  { label: "SUNFLOWER", value: 1700, valueText: "1700" }
];

const costData = [
  { label: "Fixed system", value: 1225, valueText: "1200–1250" },
  { label: "Sensor-based tracker", value: 1450, valueText: "1400–1500" },
  { label: "SUNFLOWER", value: 1400, valueText: "1350–1450" }
];

/* ------------------ CLIMATE CHART (Chart.js demo) ------------------ */
function initClimateChart() {
  const canvas = document.getElementById("tempChartCanvas");
  if (!canvas) return;
  if (!window.Chart) return;

  const labels = ["2016","2017","2018","2019","2020","2021","2022","2023","2024"];
  const values = [0.87,0.90,0.82,0.95,1.02,0.85,0.89,1.00,1.05];

  if (canvas.__chart) {
    canvas.__chart.destroy();
    canvas.__chart = null;
  }

  canvas.__chart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Global temperature anomaly (demo, °C)",
        data: values,
        borderWidth: 2,
        pointRadius: PERF.isMobile ? 2 : 3,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: PERF.prefersReducedMotion ? false : { duration: PERF.isMobile ? 300 : 650 },
      plugins: { legend: { display: true } },
      scales: {
        y: { title: { display: true, text: "°C" } },
        x: { title: { display: true, text: "Year" } }
      }
    }
  });
}

/* ------------------ FORMULAS (11 tiles) ------------------ */
const FORMULAS = {
  gamma: {
    title: "γ — Fractional year (radians)",
    definition: "A compact variable for the position within the year used in NOAA solar approximations.",
    derivation: "Turns seasonal variation into sine/cosine terms.",
    equation: String.raw`\[
\gamma=\frac{2\pi}{365}\left(N-1+\frac{h-12}{24}\right)
\]
\[
N=\text{day of year},\quad h=\text{local clock hour}
\]`
  },
  et: {
    title: "ET — Equation of Time (minutes)",
    definition: "Difference between apparent solar time and mean clock time.",
    derivation: "NOAA approximation as periodic terms in γ.",
    equation: String.raw`\[
ET=229.18\Big(
0.000075+0.001868\cos\gamma-0.032077\sin\gamma
-0.014615\cos 2\gamma-0.040849\sin 2\gamma
\Big)
\]`
  },
  delta: {
    title: "δ — Solar declination (radians)",
    definition: "Angle between the Sun’s rays and Earth’s equatorial plane.",
    derivation: "NOAA approximation in γ.",
    equation: String.raw`\[
\delta=
0.006918-0.399912\cos\gamma+0.070257\sin\gamma
-0.006758\cos 2\gamma+0.000907\sin 2\gamma
-0.002697\cos 3\gamma+0.00148\sin 3\gamma
\]`
  },
  tf: {
    title: "t₍f₎ — Time correction (minutes)",
    definition: "Clock-to-solar time correction using ET, longitude and time zone.",
    derivation: "4 minutes per degree longitude; 60 minutes per hour time zone shift.",
    equation: String.raw`\[
t_f = ET + 4\lambda - 60\,TZ
\]
\[
\lambda=\text{longitude (deg)},\quad TZ=\text{UTC offset (hours)}
\]`
  },
  tst: {
    title: "tₛₜ — True Solar Time (minutes)",
    definition: "Solar time in minutes from midnight.",
    derivation: "Clock minutes + time correction.",
    equation: String.raw`\[
t_{st} = 60h + m + \frac{s}{60} + t_f
\]`
  },
  ha: {
    title: "hₐ — Hour angle (degrees)",
    definition: "Angle relative to solar noon (0° at solar noon).",
    derivation: "1° per 4 minutes.",
    equation: String.raw`\[
h_a = \frac{t_{st}}{4}-180
\]`
  },
  phi: {
    title: "φ — Zenith angle (degrees)",
    definition: "Angle from vertical to the Sun (0° at the zenith).",
    derivation: "From spherical astronomy (direction dot product).",
    equation: String.raw`\[
\cos\phi = \sin\varphi\sin\delta+\cos\varphi\cos\delta\cos h_a
\]
\[
\phi=\arccos(\cos\phi),\quad \alpha = 90^\circ-\phi
\]`,
    notes: "α is the solar elevation angle."
  },
  theta: {
    title: "θ — Solar azimuth (degrees)",
    definition: "Compass direction of the Sun on the horizontal plane.",
    derivation: "Use atan2 for correct quadrant.",
    equation: String.raw`\[
\theta = \operatorname{atan2}(\sin\theta_s,\cos\theta_s)
\]
\[
\text{If }\theta<0,\ \theta\leftarrow\theta+360^\circ
\]`
  },
  sr: {
    title: "Sᵣ,ₜ — Sunrise & sunset",
    definition: "Approximate sunrise/sunset times using horizon hour angle.",
    derivation: "Solve hour angle when elevation is near horizon.",
    equation: String.raw`\[
t_{sunrise}=720-4(\lambda+h_{sr})-ET,\quad
t_{sunset}=720-4(\lambda-h_{sr})-ET
\]`
  },
  snoon: {
    title: "Sₙₒₒₙ — Solar noon (minutes)",
    definition: "Time of the Sun’s highest point.",
    derivation: "Hour angle equals 0° at solar noon.",
    equation: String.raw`\[
t_{noon} = 720 - 4\lambda - ET
\]`
  },
  dalpha: {
    title: "Δα — Angular error between Sun and panel",
    definition: "Angular distance between Sun direction and panel normal direction.",
    derivation: "Dot product of two directions on the celestial sphere.",
    equation: String.raw`\[
\Delta \alpha =
\arccos\Big(
\sin(h_1)\sin(h_2)+\cos(h_1)\cos(h_2)\cos(A_1-A_2)
\Big)
\]`
  }
};

function buildFormulaHTML(key) {
  const f = FORMULAS[key];
  if (!f) {
    return { title: "Not found", html: `<p class="small">No content.</p>` };
  }

  return {
    title: f.title,
    html: `
      <div class="panelSection">
        <h4>Definition</h4>
        <p>${escapeHTML(f.definition)}</p>
      </div>
      <div class="panelSection">
        <h4>Derivation / Why this form</h4>
        <p>${escapeHTML(f.derivation)}</p>
      </div>
      <div class="panelSection">
        <h4>Equation</h4>
        <div class="mathBlock">${f.equation}</div>
      </div>
      ${f.notes ? `
        <div class="panelSection">
          <h4>Notes</h4>
          <p>${escapeHTML(f.notes)}</p>
        </div>` : ""
      }
    `
  };
}

function initFormulaPanel() {
  const panel = $("#formulaPanel");
  const panelTitle = $("#panelTitle");
  const panelBody = $("#panelBody");
  const closeBtn = $("#panelClose");
  const tiles = $all(".formulaTile");
  if (!panel || !panelTitle || !panelBody || tiles.length === 0) return;

  const open = (key) => {
    const content = buildFormulaHTML(key);
    panelTitle.textContent = content.title;
    panelBody.innerHTML = content.html;
    panel.classList.remove("hidden");
    if (!PERF.prefersReducedMotion) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    typesetMath();
  };

  const close = () => {
    panel.classList.add("hidden");
    panelTitle.textContent = "—";
    panelBody.innerHTML = "";
  };

  tiles.forEach(btn => {
    btn.addEventListener("click", () => open(btn.dataset.formula), { passive: true });
  });

  closeBtn?.addEventListener("click", close, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("hidden")) close();
  });
}

/* =========================================================
   ANIMATIONS (3 canvases comparison) — optimized for phones
   Requires:
     <section id="compareAnim"> ... <canvas class="animCanvas" data-anim="fixed|sensor|sunflower"></canvas>
   ========================================================= */

function initCompareAnimations() {
  const section = document.getElementById("compareAnim");
  if (!section) return;

  const canvases = $all("canvas.animCanvas", section);
  if (canvases.length === 0) return;

  // Pause when offscreen
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.18 });
  io.observe(section);

  // Setup each canvas
  const items = canvases.map(cv => {
    const ctx = cv.getContext("2d", { alpha: true, desynchronized: true });
    const mode = cv.dataset.anim || "fixed";
    const state = {
      cv, ctx, mode,
      w: 0, h: 0, dpr: 1,
      // Simulated sun/time
      t: 0, // seconds in loop
      // Sensor tracker failure event
      failPhase: 0
    };
    return state;
  });

  function resizeOne(s) {
    const rect = s.cv.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, PERF.dprCap);
    s.dpr = dpr;
    s.w = Math.max(260, Math.floor(rect.width));
    s.h = Math.max(180, Math.floor(rect.height || 220));
    s.cv.width = Math.floor(s.w * dpr);
    s.cv.height = Math.floor(s.h * dpr);
    s.cv.style.height = s.h + "px";
    s.cv.style.width = s.w + "px";
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeAll() {
    items.forEach(resizeOne);
  }

  resizeAll();
  window.addEventListener("resize", throttle(resizeAll, 250), { passive: true });

  // --- Drawing helpers (lightweight) ---
  function drawRoundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function skyGradient(ctx, w, h, weather) {
    // weather: 0 clear -> 1 cloudy
    const g = ctx.createLinearGradient(0, 0, 0, h);
    // dark sky base
    g.addColorStop(0, `rgba(8, 18, 35, ${0.95})`);
    g.addColorStop(1, `rgba(10, 28, 58, ${0.95})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // cloud overlay (simple)
    if (weather > 0.02) {
      ctx.fillStyle = `rgba(180, 200, 230, ${0.10 + 0.25 * weather})`;
      // 2–3 soft blobs (mobile = 2)
      const blobs = PERF.isMobile ? 2 : 3;
      for (let i = 0; i < blobs; i++) {
        const cx = (w * (0.25 + i * 0.3)) + Math.sin(weather * 5 + i) * 12;
        const cy = h * (0.25 + (i % 2) * 0.12);
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 0.22, h * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function sunPathAngle(day01) {
    // 0..1 over the day
    // sun moves from left horizon (-150deg) to right horizon (-30deg) visually
    const start = Math.PI * 1.05;  // left
    const end = Math.PI * 1.95;    // right
    return start + (end - start) * day01;
  }

  function calcSunPos(w, h, day01) {
    const a = sunPathAngle(day01);
    const cx = w * 0.50;
    const cy = h * 0.92;
    const r = Math.min(w, h) * 0.78;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
  }

  function drawSun(ctx, x, y, glow, weather) {
    // sun weaker in clouds
    const alpha = clamp(1 - weather * 0.65, 0.25, 1);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 220, 120, ${0.75 * alpha})`;
    ctx.arc(x, y, 10 + glow, 0, Math.PI * 2);
    ctx.fill();

    // glow
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 220, 160, ${0.12 * alpha})`;
    ctx.arc(x, y, 24 + glow * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround(ctx, w, h) {
    ctx.fillStyle = "rgba(8, 12, 18, 0.9)";
    ctx.fillRect(0, h * 0.80, w, h * 0.20);
  }

  function drawPanel(ctx, w, h, angleRad, label, statusColor) {
    // base stand
    const baseY = h * 0.80;
    const px = w * 0.50;
    const py = baseY - 28;

    // stand
    ctx.strokeStyle = "rgba(220,230,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, baseY);
    ctx.lineTo(px, py);
    ctx.stroke();

    // panel rectangle rotated
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angleRad);

    const pw = w * 0.32;
    const ph = h * 0.09;
    drawRoundedRect(ctx, -pw / 2, -ph / 2, pw, ph, 8);
    ctx.fillStyle = "rgba(30, 55, 95, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(200,220,255,0.28)";
    ctx.stroke();

    // “cells” (reduce on mobile)
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(200,220,255,0.25)";
    ctx.lineWidth = 1;
    const cols = PERF.isMobile ? 6 : 10;
    for (let i = 1; i < cols; i++) {
      const x = -pw/2 + (pw/cols)*i;
      ctx.beginPath();
      ctx.moveTo(x, -ph/2);
      ctx.lineTo(x,  ph/2);
      ctx.stroke();
    }
    ctx.restore();

    // label/status
    ctx.fillStyle = "rgba(235,245,255,0.85)";
    ctx.font = PERF.isMobile ? "12px system-ui, -apple-system, Segoe UI" : "13px system-ui, -apple-system, Segoe UI";
    ctx.fillText(label, 12, 18);

    ctx.fillStyle = statusColor;
    ctx.fillRect(12, 28, 10, 10);
    ctx.fillStyle = "rgba(235,245,255,0.72)";
    ctx.fillText("Tracking status", 28, 37);
  }

  function lerp(a,b,t){ return a+(b-a)*t; }

  // tracker logic: returns panel angle and status
  function trackerModel(mode, sunAngle, weather, t, state) {
    // panelAngle tries to match sun direction (visual)
    // sunAngle here is direction from panel to sun: angle of sun position relative to center
    // We'll map to panel rotation angle around horizontal: simplified 2D
    const target = clamp((sunAngle - Math.PI*1.5) * 0.9, -1.2, 1.2); // remap

    if (mode === "fixed") {
      // fixed tilt
      return { panelAngle: -0.35, ok: true, note: "Limited window" };
    }

    if (mode === "sensor") {
      // sensor tracker works unless weather gets bad + “dirty sensor” event
      // create failure windows
      const cloudBad = weather > 0.62;
      // dirty sensor event: short interval per loop
      const dirty = (t % 24) > 14 && (t % 24) < 18; // between 14-18 "hours" in demo
      const fail = cloudBad || dirty;

      // smooth motion if ok, otherwise drift/stop
      if (!fail) {
        // follow with some lag
        const current = state.failPhase || 0;
        const next = lerp(current, target, PERF.isMobile ? 0.12 : 0.18);
        state.failPhase = next;
        return { panelAngle: next, ok: true, note: "Tracks (but can fail)" };
      } else {
        // stops tracking: keep last angle, small random jitter
        const base = state.failPhase || target;
        const jitter = PERF.isMobile ? 0 : (Math.sin(t*3.2) * 0.02);
        state.failPhase = base;
        return { panelAngle: base + jitter, ok: false, note: "Fails in clouds/dust" };
      }
    }

    // SUNFLOWER (algorithm-based): always tracks with small numerical/actuation error
    const current = state.failPhase || 0;
    const follow = lerp(current, target, PERF.isMobile ? 0.16 : 0.22);
    // tiny controlled error (looks realistic)
    const err = (PERF.isMobile ? 0.006 : 0.01) * Math.sin(t * 1.7);
    state.failPhase = follow;
    return { panelAngle: follow + err, ok: true, note: "Stable tracking" };
  }

  // Weather model: 0..1
  function weatherModel(day01, t) {
    // clear morning -> cloudy middle -> clearer evening
    const mid = Math.exp(-Math.pow((day01 - 0.55) / 0.18, 2));
    // small oscillation
    const wobble = 0.08 * Math.sin(t * 0.9);
    return clamp(0.15 + 0.70 * mid + wobble, 0, 1);
  }

  function drawOne(s, dt) {
    const { ctx, w, h } = s;
    // advance time (loop)
    // treat t as "hours" 0..24 for readability:
    s.t = (s.t + dt * 0.6) % 24; // speed factor (0.6) -> smooth

    const day01 = s.t / 24;
    const weather = weatherModel(day01, s.t);

    skyGradient(ctx, w, h, weather);
    drawGround(ctx, w, h);

    // sun position
    const sun = calcSunPos(w, h, day01);
    drawSun(ctx, sun.x, sun.y, PERF.isMobile ? 0 : 2, weather);

    // fixed panel “visibility” idea: after afternoon, not reachable (visual)
    let statusColor = "rgba(60,220,140,0.9)"; // green
    let label = "";

    const model = trackerModel(s.mode, sun.a, weather, s.t, s);

    if (s.mode === "fixed") {
      label = "Fixed panel (no tracking)";
      // show “effective” window: before ~0.62 day fraction
      const good = day01 > 0.12 && day01 < 0.62 && weather < 0.85;
      statusColor = good ? "rgba(60,220,140,0.9)" : "rgba(255,120,120,0.9)";
    } else if (s.mode === "sensor") {
      label = "Photodetector tracker";
      statusColor = model.ok ? "rgba(60,220,140,0.9)" : "rgba(255,120,120,0.9)";
    } else {
      label = "SUNFLOWER (algorithm)";
      statusColor = "rgba(60,220,140,0.9)";
    }

    // draw panel
    drawPanel(ctx, w, h, model.panelAngle, label, statusColor);

    // small “weather label”
    ctx.fillStyle = "rgba(235,245,255,0.65)";
    ctx.font = PERF.isMobile ? "11px system-ui, -apple-system, Segoe UI" : "12px system-ui, -apple-system, Segoe UI";
    const weatherText = weather > 0.62 ? "Cloudy / dust risk" : "Clear";
    ctx.fillText(weatherText, 12, h - 12);

    // sensor failure marker
    if (s.mode === "sensor" && !model.ok) {
      ctx.fillStyle = "rgba(255,120,120,0.95)";
      ctx.fillText("Tracking lost", w - 110, 18);
    }
  }

  // --- RAF loop (single loop for all canvases) ---
  let rafId = 0;
  let last = performance.now();
  let acc = 0;
  const step = 1000 / PERF.targetFPS;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!visible) return; // pause when offscreen

    // If user prefers reduced motion, we still animate but slower and lighter
    const maxDt = PERF.prefersReducedMotion ? 40 : 26;
    const dt = Math.min(maxDt, now - last);
    last = now;

    acc += dt;

    // Fixed-step updates -> stable on mobile
    while (acc >= step) {
      items.forEach(s => drawOne(s, step / 1000));
      acc -= step;
      // On mobile, avoid spiral of death
      if (PERF.isMobile) break;
    }
  }

  // Start
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);

  // Pause when tab hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      visible = false;
    } else {
      visible = true;
      last = performance.now();
    }
  }, { passive: true });
}

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // Bars
  renderBars("energyBars", energyData, 1800);
  renderBars("costBars", costData, 1600);

  // Climate chart
  initClimateChart();

  // Formula panel
  initFormulaPanel();

  // Animations comparison (ON for phones too)
  initCompareAnimations();
}, { passive: true });

/* Re-init chart on resize (throttled) */
window.addEventListener("resize", throttle(() => {
  initClimateChart();
}, 260), { passive: true });
