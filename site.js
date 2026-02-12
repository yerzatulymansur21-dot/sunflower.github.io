// =====================================================
// SUNFLOWER — site.js
// - Bar charts (no libs)
// - Climate chart (Chart.js)
// - 11 formula buttons -> panel (English content)
// =====================================================


// ===============================
// 1) SIMPLE BAR CHARTS (no libs)
// ===============================
function renderBars(containerId, items, maxValue){
  const container = document.getElementById(containerId);
  if(!container) return;

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

    const percent = Math.max(0, Math.min(1, item.value / maxValue));
    fill.style.width = (percent * 100).toFixed(1) + "%";

    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "barValue";
    value.textContent = item.valueText || String(item.value);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);

    container.appendChild(row);
  });
}

// Data (replace later with your final cited sources if needed)
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


// ===================================
// 2) CLIMATE CHART (Chart.js)
// ===================================
function renderClimateChart(){
  const canvas = document.getElementById("tempChartCanvas");
  if(!canvas || typeof Chart === "undefined") return;

  // Demo points (replace with NASA/NOAA dataset later)
  const years = [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2010, 2020, 2025];
  const anomaly = [-0.18, -0.12, -0.08, 0.05, 0.02, 0.18, 0.42, 0.62, 0.98, 1.15];

  new Chart(canvas, {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Global temperature anomaly (°C) — demo",
        data: anomaly,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        x: {
          title: { display: true, text: "Year" },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: "Anomaly (°C)" }
        }
      }
    }
  });
}


// ===================================
// 3) FORMULA PANEL (11 buttons)
// ===================================
const formulaContent = {
  gamma: {
    title: "γ — Fractional Year",
    definition: `
      <p><b>γ</b> converts the day/time into an annual angle (seasonal phase). It is used in
      solar declination and Equation of Time approximations.</p>
    `,
    derivation: `
      <p>The annual cycle is periodic, so we map the day number to an angle:
      one full year corresponds to <b>2π</b> radians.</p>
    `,
    eq: String.raw`
      \[
      \gamma = \frac{2\pi}{365}\left(n - 1 + \frac{h - 12}{24}\right)
      \]
    `
  },

  et: {
    title: "ET — Equation of Time",
    definition: `
      <p><b>ET</b> is the time difference between true solar time and mean clock time,
      mainly due to orbital eccentricity and Earth’s axial tilt.</p>
    `,
    derivation: `
      <p>ET varies periodically through the year, so it is approximated by a sum of
      sine/cosine harmonics of <b>γ</b> (standard NOAA/SPA style).</p>
    `,
    eq: String.raw`
      \[
      ET = 229.18\left(
      0.000075 + 0.001868\cos\gamma - 0.032077\sin\gamma
      - 0.014615\cos(2\gamma) - 0.040849\sin(2\gamma)
      \right)
      \]
    `
  },

  delta: {
    title: "δ — Solar Declination",
    definition: `
      <p><b>δ</b> is the angle between the Sun’s rays and the Earth’s equatorial plane.
      It controls seasonal changes in solar height.</p>
    `,
    derivation: `
      <p>Declination is nearly sinusoidal over the year; higher accuracy uses several
      harmonics of <b>γ</b>.</p>
    `,
    eq: String.raw`
      \[
      \delta =
      0.006918
      - 0.399912\cos\gamma
      + 0.070257\sin\gamma
      - 0.006758\cos(2\gamma)
      + 0.000907\sin(2\gamma)
      - 0.002697\cos(3\gamma)
      + 0.00148\sin(3\gamma)
      \]
    `
  },

  tf: {
    title: "t_f — Time Correction",
    definition: `
      <p><b>t_f</b> corrects local clock time to solar time using longitude difference and ET.</p>
    `,
    derivation: `
      <p>Earth rotates 360° in 24 hours ⇒ <b>1° ≈ 4 minutes</b>. Add ET to account for orbital effects.</p>
    `,
    eq: String.raw`
      \[
      t_f = 4\,(L_{st}-L_{loc}) + ET
      \]
    `
  },

  tst: {
    title: "t_st — True Solar Time",
    definition: `
      <p><b>t_st</b> is time defined by the Sun’s apparent motion (solar time).</p>
    `,
    derivation: `
      <p>It is computed by applying the correction <b>t_f</b> to local time.</p>
    `,
    eq: String.raw`
      \[
      t_{st} = t + \frac{t_f}{60}
      \]
    `
  },

  ha: {
    title: "h_a — Hour Angle",
    definition: `
      <p><b>h_a</b> measures the Sun’s angular displacement from solar noon (when <b>h_a = 0</b>).</p>
    `,
    derivation: `
      <p>Earth rotates 15° per hour, so hour angle is proportional to \((t_{st}-12)\).</p>
    `,
    eq: String.raw`
      \[
      h_a = 15^\circ\,(t_{st}-12)
      \]
    `
  },

  phi: {
    title: "φ — Zenith Angle",
    definition: `
      <p><b>φ</b> is the zenith angle: the angle between the Sun direction and the upward vertical (zenith).</p>
    `,
    derivation: `
      <p>From spherical trigonometry on the celestial sphere (latitude, declination, hour angle),
      we obtain the cosine form for the zenith angle.</p>
    `,
    eq: String.raw`
      \[
      \cos(\varphi) = \sin(lat)\sin(\delta) + \cos(lat)\cos(\delta)\cos(h_a)
      \]
    `
  },

  theta: {
    title: "θ — Azimuth",
    definition: `
      <p><b>θ</b> is the horizontal direction of the Sun (angle in the horizon plane).</p>
    `,
    derivation: `
      <p>Using spherical trigonometry, <b>atan2</b> is used to get the correct quadrant for azimuth.</p>
    `,
    eq: String.raw`
      \[
      \theta = \operatorname{atan2}\left(\sin(h_a),\, \cos(h_a)\sin(lat)-\tan(\delta)\cos(lat)\right)
      \]
    `
  },

  sr: {
    title: "S_r,t — Sunrise & Sunset",
    definition: `
      <p><b>S_{r,t}</b> represent sunrise and sunset times. At sunrise/sunset, solar elevation is ~0°,
      so the zenith angle is ~90°.</p>
    `,
    derivation: `
      <p>Set \(\cos(\varphi)=0\) (horizon condition) and solve for the sunrise/sunset hour angle \(h_{a0}\),
      then convert angle to time (15° per hour).</p>
    `,
    eq: String.raw`
      \[
      \cos(h_{a0}) = -\tan(lat)\tan(\delta)
      \]
      \[
      S_r = 12 - \frac{h_{a0}}{15^\circ}, \quad
      S_t = 12 + \frac{h_{a0}}{15^\circ}
      \]
    `
  },

  snoon: {
    title: "S_noon — Solar Noon",
    definition: `
      <p><b>S_{noon}</b> is the moment when the Sun reaches its highest point (hour angle <b>h_a=0</b>).</p>
    `,
    derivation: `
      <p>Solar noon is 12:00 in true solar time, so the clock-time shift depends on the time correction.</p>
    `,
    eq: String.raw`
      \[
      S_{noon} = 12 - \frac{t_f}{60}
      \]
    `
  },

  dalpha: {
    title: "Δα — Angular Error",
    definition: `
      <p><b>Δα</b> measures the difference between a reference angle and the algorithm output
      (used to quantify tracking accuracy).</p>
    `,
    derivation: `
      <p>The simplest accuracy metric is the absolute difference between angles (and similarly for azimuth).</p>
    `,
    eq: String.raw`
      \[
      \Delta \alpha = \left| \alpha_{\text{ref}} - \alpha_{\text{alg}} \right|
      \]
      \[
      \Delta \theta = \left| \theta_{\text{ref}} - \theta_{\text{alg}} \right|
      \]
    `
  }
};

function typesetMath(container){
  if(window.MathJax && MathJax.typesetPromise){
    MathJax.typesetPromise([container]).catch(()=>{});
  }
}

function openFormulaPanel(key){
  const panel = document.getElementById("formulaPanel");
  const titleEl = document.getElementById("panelTitle");
  const bodyEl  = document.getElementById("panelBody");
  if(!panel || !titleEl || !bodyEl) return;

  const data = formulaContent[key];
  if(!data) return;

  titleEl.textContent = data.title;

  bodyEl.innerHTML = `
    <div class="panelBlock">
      <h4>Definition</h4>
      ${data.definition}
    </div>

    <div class="panelBlock">
      <h4>Derivation (short)</h4>
      ${data.derivation}
    </div>

    <div class="panelBlock">
      <h4>Formula</h4>
      <div class="mathBox">${data.eq}</div>
    </div>
  `;

  panel.classList.remove("hidden");
  typesetMath(panel);

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeFormulaPanel(){
  const panel = document.getElementById("formulaPanel");
  if(panel) panel.classList.add("hidden");
}


// ===================================
// 4) INIT
// ===================================
document.addEventListener("DOMContentLoaded", () => {

  // Bars
  renderBars("energyBars", energyData, 1800);
  renderBars("costBars", costData, 1600);

  // Climate chart
  renderClimateChart();

  // Formula buttons (11)
  document.querySelectorAll(".formulaTile").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.formula;
      openFormulaPanel(key);
    });
  });

  // Close button
  const closeBtn = document.getElementById("panelClose");
  if(closeBtn) closeBtn.addEventListener("click", closeFormulaPanel);

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeFormulaPanel();
  });
});
