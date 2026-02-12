/* =========================================================
   SUNFLOWER — site.js (DEMO canvas version)
   Works with your HTML:
     section#demo, canvas#trackerDemo
     controls: #weatherSelect, #speedRange, #togglePlay, #resetDemo

   Includes:
   - Bar charts (energy + cost)
   - Climate chart (Chart.js demo)
   - Formula tiles -> panel (11 buttons)
   - Tracking demo animation (single canvas) optimized for mobile
   ========================================================= */

/* ------------------ PERF / ENV ------------------ */
const PERF = (() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmall = window.matchMedia?.("(max-width: 900px)")?.matches ?? false;
  const isMobile = isTouch || isSmall;

  // Keep animation ON everywhere, but lighter on mobile
  const targetFPS = isMobile ? 30 : 60;
  const dprCap = isMobile ? 1.5 : 2;
  const mathjaxDebounceMs = isMobile ? 200 : 90;

  return { prefersReducedMotion, isMobile, targetFPS, dprCap, mathjaxDebounceMs };
})();

/* ------------------ HELPERS ------------------ */
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function throttle(fn, wait = 180) {
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

  container.innerHTML = "";
  const frag = document.createDocumentFragment();

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
      animation: PERF.prefersReducedMotion ? false : { duration: PERF.isMobile ? 250 : 650 },
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
  gamma: { title:"γ — Fractional year (radians)",
    definition:"A compact variable for the position within the year used in NOAA solar approximations.",
    derivation:"Turns seasonal variation into sine/cosine terms.",
    equation: String.raw`\[
\gamma=\frac{2\pi}{365}\left(N-1+\frac{h-12}{24}\right)
\]
\[
N=\text{day of year},\quad h=\text{local clock hour}
\]` },
  et: { title:"ET — Equation of Time (minutes)",
    definition:"Difference between apparent solar time and mean clock time.",
    derivation:"NOAA approximation as periodic terms in γ.",
    equation: String.raw`\[
ET=229.18\Big(
0.000075+0.001868\cos\gamma-0.032077\sin\gamma
-0.014615\cos 2\gamma-0.040849\sin 2\gamma
\Big)
\]` },
  delta: { title:"δ — Solar declination (radians)",
    definition:"Angle between the Sun’s rays and Earth’s equatorial plane.",
    derivation:"NOAA approximation in γ.",
    equation: String.raw`\[
\delta=
0.006918-0.399912\cos\gamma+0.070257\sin\gamma
-0.006758\cos 2\gamma+0.000907\sin 2\gamma
-0.002697\cos 3\gamma+0.00148\sin 3\gamma
\]` },
  tf: { title:"t₍f₎ — Time correction (minutes)",
    definition:"Clock-to-solar time correction using ET, longitude and time zone.",
    derivation:"4 minutes per degree longitude; 60 minutes per hour time zone shift.",
    equation: String.raw`\[
t_f = ET + 4\lambda - 60\,TZ
\]
\[
\lambda=\text{longitude (deg)},\quad TZ=\text{UTC offset (hours)}
\]` },
  tst: { title:"tₛₜ — True Solar Time (minutes)",
    definition:"Solar time in minutes from midnight.",
    derivation:"Clock minutes + time correction.",
    equation: String.raw`\[
t_{st} = 60h + m + \frac{s}{60} + t_f
\]` },
  ha: { title:"hₐ — Hour angle (degrees)",
    definition:"Angle relative to solar noon (0° at solar noon).",
    derivation:"1° per 4 minutes.",
    equation: String.raw`\[
h_a = \frac{t_{st}}{4}-180
\]` },
  phi: { title:"φ — Zenith angle (degrees)",
    definition:"Angle from vertical to the Sun (0° at the zenith).",
    derivation:"From spherical astronomy.",
    equation: String.raw`\[
\cos\phi = \sin\varphi\sin\delta+\cos\varphi\cos\delta\cos h_a
\]
\[
\phi=\arccos(\cos\phi),\quad \alpha = 90^\circ-\phi
\]`,
    notes:"α is the solar elevation angle." },
  theta: { title:"θ — Solar azimuth (degrees)",
    definition:"Compass direction of the Sun on the horizontal plane.",
    derivation:"Use atan2 for the correct quadrant.",
    equation: String.raw`\[
\theta = \operatorname{atan2}(y,x),\quad
\text{if }\theta<0,\ \theta\leftarrow\theta+360^\circ
\]` },
  sr: { title:"Sᵣ,ₜ — Sunrise & sunset (minutes)",
    definition:"Approximate sunrise/sunset times using horizon hour angle.",
    derivation:"Solve hour angle near the horizon (simplified).",
    equation: String.raw`\[
t_{sunrise}=720-4(\lambda+h_{sr})-ET,\quad
t_{sunset}=720-4(\lambda-h_{sr})-ET
\]` },
  snoon: { title:"Sₙₒₒₙ — Solar noon (minutes)",
    definition:"Time of the Sun’s highest point.",
    derivation:"Hour angle equals 0° at solar noon.",
    equation: String.raw`\[
t_{noon} = 720 - 4\lambda - ET
\]` },
  dalpha: { title:"Δα — Angular error between Sun and panel",
    definition:"Angular distance between Sun direction and panel normal direction.",
    derivation:"Dot product of two directions on the celestial sphere.",
    equation: String.raw`\[
\Delta \alpha =
\arccos\Big(
\sin(h_1)\sin(h_2)+\cos(h_1)\cos(h_2)\cos(A_1-A_2)
\Big)
\]` }
};

function buildFormulaHTML(key) {
  const f = FORMULAS[key];
  if (!f) return { title:"Not found", html:`<p class="small">No content.</p>` };

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
        </div>` : ""}
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
    typesetMath();
  };

  const close = () => {
    panel.classList.add("hidden");
    panelTitle.textContent = "—";
    panelBody.innerHTML = "";
  };

  tiles.forEach(btn => btn.addEventListener("click", () => open(btn.dataset.formula), { passive: true }));
  closeBtn?.addEventListener("click", close, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("hidden")) close();
  });
}

/* =========================================================
   DEMO ANIMATION (single canvas: #trackerDemo)
   Section id: #demo
   ========================================================= */
function initDemoAnimation() {
  const section = document.getElementById("demo");
  const canvas = document.getElementById("trackerDemo");
  if (!section || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

  // Controls (optional but your HTML has them)
  const weatherSelect = document.getElementById("weatherSelect");
  const speedRange = document.getElementById("speedRange");
  const speedVal = document.getElementById("speedVal");
  const togglePlay = document.getElementById("togglePlay");
  const resetBtn = document.getElementById("resetDemo");

  let weatherMode = weatherSelect?.value || "sunny";
  let secondsPerDay = Number(speedRange?.value || 12); // "12s/day" default
  if (speedVal) speedVal.textContent = String(secondsPerDay);

  let playing = true;

  // Visibility pause (big perf win on mobile)
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.18 });
  io.observe(section);

  // Canvas sizing
  let W = 0, H = 0, DPR = 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    DPR = clamp(window.devicePixelRatio || 1, 1, PERF.dprCap);
    W = Math.max(320, Math.floor(rect.width));
    H = Math.max(240, Math.floor(rect.height || 320));

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", throttle(resize, 220), { passive: true });

  // Demo state
  let t = 0; // seconds in simulation loop

  // Drawing utils
  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground(cloudiness) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(8, 18, 35, 0.98)");
    g.addColorStop(1, "rgba(10, 28, 58, 0.98)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // clouds
    if (cloudiness > 0.02) {
      ctx.fillStyle = `rgba(190,210,240, ${0.10 + 0.28 * cloudiness})`;
      const blobs = PERF.isMobile ? 2 : 3;
      for (let i = 0; i < blobs; i++) {
        const cx = W * (0.25 + i * 0.3) + Math.sin(t * 0.7 + i) * 10;
        const cy = H * (0.22 + (i % 2) * 0.12);
        ctx.beginPath();
        ctx.ellipse(cx, cy, W * 0.20, H * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ground
    ctx.fillStyle = "rgba(6, 10, 16, 0.92)";
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
  }

  function sunPos(day01) {
    // arc across sky (visual)
    const start = Math.PI * 1.05;
    const end = Math.PI * 1.95;
    const a = start + (end - start) * day01;

    const cx = W * 0.50;
    const cy = H * 0.90;
    const r = Math.min(W, H) * 0.72;

    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
  }

  function drawSun(x, y, cloudiness) {
    const alpha = clamp(1 - cloudiness * 0.65, 0.25, 1);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 220, 120, ${0.80 * alpha})`;
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 220, 160, ${0.12 * alpha})`;
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPanel(x, y, angle, color, label, statusText) {
    // stand
    ctx.strokeStyle = "rgba(220,230,255,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 52);
    ctx.lineTo(x, y);
    ctx.stroke();

    // panel
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const pw = W * 0.20;
    const ph = H * 0.065;
    roundRect(-pw / 2, -ph / 2, pw, ph, 10);
    ctx.fillStyle = "rgba(30, 55, 95, 0.90)";
    ctx.fill();
    ctx.strokeStyle = "rgba(200,220,255,0.30)";
    ctx.stroke();

    // subtle stripes (lighter on mobile)
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(200,220,255,0.22)";
    ctx.lineWidth = 1;
    const cols = PERF.isMobile ? 5 : 8;
    for (let i = 1; i < cols; i++) {
      const xx = -pw/2 + (pw/cols)*i;
      ctx.beginPath();
      ctx.moveTo(xx, -ph/2);
      ctx.lineTo(xx,  ph/2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // label
    ctx.fillStyle = "rgba(235,245,255,0.90)";
    ctx.font = PERF.isMobile ? "12px system-ui" : "13px system-ui";
    ctx.fillText(label, x - (W * 0.15), y - 62);

    // status dot + text
    ctx.fillStyle = color;
    ctx.fillRect(x - (W * 0.15), y - 46, 10, 10);
    ctx.fillStyle = "rgba(235,245,255,0.75)";
    ctx.fillText(statusText, x - (W * 0.15) + 16, y - 37);
  }

  function computeCloudiness(day01) {
    // auto cloudiness if "cloudy", otherwise mostly clear
    if (weatherMode === "sunny") return 0.12;
    if (weatherMode === "cloudy") {
      const mid = Math.exp(-Math.pow((day01 - 0.55) / 0.18, 2));
      const wobble = 0.08 * Math.sin(t * 0.9);
      return clamp(0.20 + 0.75 * mid + wobble, 0, 1);
    }
    // dusty: sky mostly clear, but sensors can fail (dirty)
    return 0.18;
  }

  // Panels tracking models
  const panelState = {
    sensorAngle: 0,
    sunflowerAngle: 0,
    sensorOk: true
  };

  function trackerAngles(sunA, day01, cloudiness) {
    // Map sun direction to "panel rotation"
    const target = clamp((sunA - Math.PI * 1.5) * 0.9, -1.15, 1.15);

    // fixed: constant angle (no tracking)
    const fixed = -0.35;

    // sensor tracker: can fail in cloudy or dusty (dirty sensor)
    const dirtyWindow = (day01 > 0.46 && day01 < 0.62); // midday-ish in demo
    const failByCloud = cloudiness > 0.62;
    const failByDust = (weatherMode === "dusty") && dirtyWindow;
    const sensorFail = failByCloud || failByDust;

    if (!sensorFail) {
      panelState.sensorAngle = lerp(panelState.sensorAngle, target, PERF.isMobile ? 0.12 : 0.18);
      panelState.sensorOk = true;
    } else {
      // stops tracking: keep last angle
      panelState.sensorOk = false;
    }

    // SUNFLOWER: always tracks (small controlled error)
    panelState.sunflowerAngle = lerp(panelState.sunflowerAngle, target, PERF.isMobile ? 0.16 : 0.22);
    const smallErr = (PERF.isMobile ? 0.006 : 0.01) * Math.sin(t * 1.7);
    const sunflower = panelState.sunflowerAngle + smallErr;

    return { fixed, sensor: panelState.sensorAngle, sunflower, sensorOk: panelState.sensorOk };
  }

  function drawLegendHeader(day01, cloudiness) {
    // Day time label
    const hours = Math.floor(day01 * 24);
    const mins = Math.floor((day01 * 24 - hours) * 60);
    const timeStr = `${String(hours).padStart(2,"0")}:${String(mins).padStart(2,"0")}`;

    ctx.fillStyle = "rgba(235,245,255,0.88)";
    ctx.font = PERF.isMobile ? "12px system-ui" : "13px system-ui";
    ctx.fillText(`Time: ${timeStr}`, 14, 22);

    const weatherText =
      weatherMode === "sunny" ? "Sunny" :
      weatherMode === "cloudy" ? "Cloudy" :
      "Dusty (dirty sensor)";

    ctx.fillStyle = "rgba(235,245,255,0.70)";
    ctx.fillText(`Weather mode: ${weatherText}`, 14, 40);

    // tiny cloudiness bar
    const bx = 14, by = 54, bw = 160, bh = 8;
    roundRect(bx, by, bw, bh, 999);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    roundRect(bx, by, bw * clamp(cloudiness, 0, 1), bh, 999);
    ctx.fillStyle = "rgba(120,200,255,0.35)";
    ctx.fill();
  }

  function renderFrame(dt) {
    // dt in seconds
    const dtSafe = PERF.prefersReducedMotion ? dt * 0.6 : dt;
    if (playing) t += dtSafe;

    // Map t to day progress 0..1 based on secondsPerDay
    const day01 = ((t % secondsPerDay) / secondsPerDay);
    const cloudiness = computeCloudiness(day01);

    drawBackground(cloudiness);

    // sun
    const sun = sunPos(day01);
    drawSun(sun.x, sun.y, cloudiness);

    // panels positions
    const baseY = H * 0.78 - 50;
    const x1 = W * 0.20;
    const x2 = W * 0.50;
    const x3 = W * 0.80;

    const ang = trackerAngles(sun.a, day01, cloudiness);

    // FIXED: good mostly before afternoon
    const fixedGood = (day01 > 0.10 && day01 < 0.58);
    const fixedColor = fixedGood ? "rgba(60,220,140,0.92)" : "rgba(255,120,120,0.92)";
    drawPanel(x1, baseY, ang.fixed, fixedColor, "Fixed Panel", fixedGood ? "Working window" : "Low capture");

    // SENSOR: can fail
    const sensorColor = ang.sensorOk ? "rgba(60,220,140,0.92)" : "rgba(255,120,120,0.92)";
    const sensorStatus = ang.sensorOk ? "Tracking OK" : "Tracking lost";
    drawPanel(x2, baseY, ang.sensor, sensorColor, "Sensor Tracker", sensorStatus);

    // SUNFLOWER: stable
    drawPanel(x3, baseY, ang.sunflower, "rgba(60,220,140,0.92)", "SUNFLOWER", "Stable tracking");

    // header text
    drawLegendHeader(day01, cloudiness);

    // If sensor failed, show hint
    if (!ang.sensorOk) {
      ctx.fillStyle = "rgba(255,140,140,0.95)";
      ctx.font = PERF.isMobile ? "12px system-ui" : "13px system-ui";
      ctx.fillText(
        weatherMode === "dusty" ? "Reason: dirty photodetector" : "Reason: heavy clouds",
        W - (PERF.isMobile ? 210 : 230),
        40
      );
    }
  }

  // RAF loop with fixed timestep for stable FPS
  let rafId = 0;
  let last = performance.now();
  let acc = 0;
  const stepMs = 1000 / PERF.targetFPS;

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (!visible) return;

    const dtMs = Math.min(PERF.isMobile ? 40 : 26, now - last);
    last = now;
    acc += dtMs;

    // update at fixed rate
    while (acc >= stepMs) {
      renderFrame(stepMs / 1000);
      acc -= stepMs;
      if (PERF.isMobile) break; // avoid too many iterations on slow phones
    }
  }

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);

  // Controls wiring
  weatherSelect?.addEventListener("change", () => {
    weatherMode = weatherSelect.value;
  }, { passive: true });

  speedRange?.addEventListener("input", () => {
    secondsPerDay = Number(speedRange.value || 12);
    if (speedVal) speedVal.textContent = String(secondsPerDay);
  }, { passive: true });

  togglePlay?.addEventListener("click", () => {
    playing = !playing;
    togglePlay.textContent = playing ? "Pause" : "Play";
    last = performance.now();
  });

  resetBtn?.addEventListener("click", () => {
    t = 0;
    panelState.sensorAngle = 0;
    panelState.sunflowerAngle = 0;
    panelState.sensorOk = true;
    last = performance.now();
  });

  // Pause when tab hidden
  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    last = performance.now();
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

  // Demo animation (YOUR #demo + #trackerDemo)
  initDemoAnimation();
}, { passive: true });

window.addEventListener("resize", throttle(() => {
  initClimateChart();
}, 260), { passive: true });
