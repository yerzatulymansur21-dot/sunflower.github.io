/* =========================================================
   SUNFLOWER — site.js (mobile-optimized, no external libs)
   - Bar charts (energy + cost)
   - Climate demo chart (Chart.js)
   - 11 formula buttons -> info panel (English)
   - Performance guardrails for phones:
       * Respects prefers-reduced-motion
       * Avoids heavy loops on scroll
       * Uses minimal DOM updates
       * Passive listeners
       * Safe MathJax typeset (throttled)
   ========================================================= */

/* ------------------ PERF / ENV ------------------ */
const PERF = (() => {
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmall = window.matchMedia?.("(max-width: 900px)")?.matches ?? false;
  const isMobile = isTouch || isSmall;

  // On phones we keep things lighter
  const chartPointsStepHours = isMobile ? 2 : 1; // used if you later add daily curves
  const mathjaxDebounceMs = isMobile ? 180 : 80;

  return { prefersReducedMotion, isMobile, chartPointsStepHours, mathjaxDebounceMs };
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

// Throttle for resize / scroll
function throttle(fn, wait = 120) {
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

// Debounce (used for MathJax)
function debounce(fn, wait = 120) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Safe MathJax typeset (won’t spam on mobile)
const typesetMath = debounce(() => {
  if (!window.MathJax || !window.MathJax.typesetPromise) return;
  // typeset only the panel to keep it light
  const panel = $("#formulaPanel");
  if (!panel) return;
  window.MathJax.typesetPromise([panel]).catch(() => {});
}, PERF.mathjaxDebounceMs);

/* ------------------ SIMPLE BAR CHART ------------------ */
function renderBars(containerId, items, maxValue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Minimal DOM work: build in a fragment
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

  // Keep it simple & light (few points)
  const labels = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];
  const values = [0.87, 0.90, 0.82, 0.95, 1.02, 0.85, 0.89, 1.00, 1.05]; // demo anomalies

  // Destroy previous if any (hot reload safe)
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
      animation: PERF.prefersReducedMotion ? false : { duration: PERF.isMobile ? 350 : 700 },
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: { title: { display: true, text: "°C" } },
        x: { title: { display: true, text: "Year" } }
      }
    }
  });
}

/* ------------------ FORMULAS (11 tiles) ------------------ */
/*
  Each item has:
  - title
  - definition (short)
  - derivation (short “why this form”)
  - equation (LaTeX)
  - notes (optional)
*/
const FORMULAS = {
  gamma: {
    title: "γ — Fractional year (radians)",
    definition: "A compact way to represent the position within the year for solar geometry approximations.",
    derivation: "NOAA uses γ so periodic terms in Earth’s orbit/tilt can be approximated with sines/cosines.",
    equation: String.raw`\[
\gamma=\frac{2\pi}{365}\left(N-1+\frac{h-12}{24}\right)
\]
\[
N=\text{day of year},\quad h=\text{local clock hour}
\]`,
    notes: "Used as the main input to Equation of Time and declination approximations."
  },

  et: {
    title: "ET — Equation of Time (minutes)",
    definition: "The difference between apparent solar time and mean clock time caused by orbit eccentricity and axial tilt.",
    derivation: "Approximated by a Fourier-like series in γ (NOAA simplified model).",
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
    derivation: "Approximated as periodic terms in γ (NOAA).",
    equation: String.raw`\[
\delta=
0.006918-0.399912\cos\gamma+0.070257\sin\gamma
-0.006758\cos 2\gamma+0.000907\sin 2\gamma
-0.002697\cos 3\gamma+0.00148\sin 3\gamma
\]`
  },

  tf: {
    title: "t₍f₎ — Time correction / time offset (minutes)",
    definition: "Correction that converts clock time to solar time using ET and longitude/time zone.",
    derivation: "1° longitude corresponds to 4 minutes; time zone shifts 60 minutes per hour.",
    equation: String.raw`\[
t_f = ET + 4\lambda - 60\,TZ
\]
\[
\lambda=\text{longitude (deg)},\quad TZ=\text{UTC offset (hours)}
\]`
  },

  tst: {
    title: "tₛₜ — True Solar Time (minutes)",
    definition: "Solar time expressed in minutes from local midnight.",
    derivation: "Add the time correction to clock minutes.",
    equation: String.raw`\[
t_{st} = 60h + m + \frac{s}{60} + t_f
\]`
  },

  ha: {
    title: "hₐ — Hour angle (degrees)",
    definition: "Angular measure of time relative to solar noon (0° at solar noon).",
    derivation: "15° per hour → 1° per 4 minutes. Convert TST minutes to angle.",
    equation: String.raw`\[
h_a = \frac{t_{st}}{4}-180
\]`
  },

  phi: {
    title: "φ — Zenith angle (degrees)",
    definition: "Angle between the vertical direction and the Sun’s rays (0° at the zenith).",
    derivation: "From spherical astronomy: dot product between local zenith and Sun direction.",
    equation: String.raw`\[
\cos\phi = \sin\varphi\sin\delta+\cos\varphi\cos\delta\cos h_a
\]
\[
\phi=\arccos(\cos\phi),\quad \alpha = 90^\circ-\phi
\]
\[
\varphi=\text{latitude}
\]`,
    notes: "Here α is solar elevation/altitude."
  },

  theta: {
    title: "θ — Solar azimuth (degrees)",
    definition: "Compass direction of the Sun projection on the horizontal plane.",
    derivation: "Computed from spherical trig using declination, latitude, and hour angle. Use atan2 for correct quadrant.",
    equation: String.raw`\[
\theta = \operatorname{atan2}(\sin\theta_s,\cos\theta_s)
\]
\[
\sin\theta_s=
-\frac{\sin\varphi\cos\delta-\sin\delta\cos\varphi\cos h_a}{\sin\phi}
,\quad
\cos\theta_s=
\frac{\sin\delta-\sin\varphi\cos\phi}{\cos\varphi\sin\phi}
\]
\[
\text{If }\theta<0,\ \theta\leftarrow\theta+360^\circ
\]`
  },

  sr: {
    title: "Sᵣ,ₜ — Sunrise & sunset (hour angle method)",
    definition: "Approximate sunrise/sunset times based on the hour angle when the Sun reaches the horizon.",
    derivation: "At sunrise/sunset, solar elevation ≈ −0.833° (refraction + solar radius). Solve for hour angle.",
    equation: String.raw`\[
\cos h_{sr}=
\frac{\cos(90.833^\circ)}{\cos\varphi\cos\delta}-\tan\varphi\tan\delta
\]
\[
h_{sr}=\arccos(\cos h_{sr})
\]
\[
t_{sunrise}=720-4(\lambda+h_{sr})-ET,\quad
t_{sunset}=720-4(\lambda-h_{sr})-ET
\]`,
    notes: "Times are in minutes. This is the common NOAA approximation."
  },

  snoon: {
    title: "Sₙₒₒₙ — Solar noon (minutes)",
    definition: "Time when the Sun crosses the local meridian (highest point).",
    derivation: "At solar noon, hour angle is 0° → directly from ET and longitude.",
    equation: String.raw`\[
t_{noon} = 720 - 4\lambda - ET
\]`
  },

  dalpha: {
    title: "Δα — Angular error between Sun and panel",
    definition: "Angular distance between the real Sun direction and the panel normal direction.",
    derivation: "This is the spherical angle between two directions on the celestial sphere (dot product).",
    equation: String.raw`\[
\Delta \alpha =
\arccos\Big(
\sin(h_1)\sin(h_2)+\cos(h_1)\cos(h_2)\cos(A_1-A_2)
\Big)
\]
\[
h_1,A_1:\ \text{Sun elevation & azimuth},\quad
h_2,A_2:\ \text{panel elevation & azimuth}
\]`,
    notes: "A perfect tracker aims for Δα → 0."
  }
};

function buildFormulaHTML(key) {
  const f = FORMULAS[key];
  if (!f) {
    return {
      title: "Not found",
      html: `<p class="small">No content for <b>${escapeHTML(key)}</b>.</p>`
    };
  }

  const html = `
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
      </div>
    ` : ""}
  `;

  return { title: f.title, html };
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
    panel.scrollIntoView({ behavior: PERF.prefersReducedMotion ? "auto" : "smooth", block: "nearest" });

    // Typeset MathJax only inside the panel (throttled)
    typesetMath();
  };

  const close = () => {
    panel.classList.add("hidden");
    panelTitle.textContent = "—";
    panelBody.innerHTML = "";
  };

  // Clicks
  tiles.forEach(btn => {
    btn.addEventListener("click", () => open(btn.dataset.formula), { passive: true });
  });

  // Close
  closeBtn?.addEventListener("click", close, { passive: true });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.classList.contains("hidden")) close();
  });

  // Close on outside click (optional, lightweight)
  panel.addEventListener("click", (e) => {
    if (e.target === panel) close();
  });
}

/* ------------------ OPTIONAL: PAUSE HEAVY WORK OFFSCREEN ------------------
   Right now site.js does NOT run any continuous animation,
   so phones should already be smooth.

   If you later add canvas animations, use this helper:
------------------------------------------------------------------------- */
function makeSectionVisibilityGate(sectionSelector) {
  const el = document.querySelector(sectionSelector);
  if (!el) return { isVisible: () => true, disconnect: () => {} };

  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  }, { threshold: 0.2 });

  io.observe(el);
  return { isVisible: () => visible, disconnect: () => io.disconnect() };
}

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // Bar charts
  renderBars("energyBars", energyData, 1800);
  renderBars("costBars", costData, 1600);

  // Climate chart
  initClimateChart();

  // Formula tiles panel
  initFormulaPanel();
}, { passive: true });

/* Re-init chart on resize (throttled) — avoids layout glitches on mobile rotate */
window.addEventListener("resize", throttle(() => {
  initClimateChart();
}, 250), { passive: true });
