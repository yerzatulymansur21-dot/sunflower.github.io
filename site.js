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

/* ============================
   3-System Tracking Demo
   ============================ */

(function initTrackerDemo(){
  const canvas = document.getElementById("trackerDemo");
  if(!canvas) return;

  const weatherSelect = document.getElementById("weatherSelect");
  const speedRange = document.getElementById("speedRange");
  const speedVal = document.getElementById("speedVal");
  const togglePlay = document.getElementById("togglePlay");
  const resetDemo = document.getElementById("resetDemo");

  const ctx = canvas.getContext("2d", { alpha: false });

  // State
  let weather = (weatherSelect && weatherSelect.value) || "sunny";
  let secondsPerDay = Number((speedRange && speedRange.value) || 12);
  let running = true;

  // timeOfDay: 0..1 (sunrise..sunset)
  let t = 0;                 // normalized day progress
  let lastTs = performance.now();

  // sensor tracker internal states
  let sensorLocked = true;
  let sensorAngle = 0;
  let sensorHuntPhase = 0;

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function resize(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssW = canvas.clientWidth || 1000;
    const cssH = canvas.height; // CSS height comes from attribute
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setWeather(v){
    weather = v;
    // reset sensor lock a bit (so user sees behavior change)
    sensorLocked = true;
    sensorHuntPhase = 0;
  }

  function setSpeed(v){
    secondsPerDay = Number(v);
    if(speedVal) speedVal.textContent = String(secondsPerDay);
  }

  function reset(){
    t = 0;
    sensorLocked = true;
    sensorAngle = 0;
    sensorHuntPhase = 0;
  }

  function sunPos(norm){
    // arc: left -> right, higher in middle
    // norm 0..1
    const x = norm;
    const y = Math.sin(Math.PI * norm); // 0..1..0
    return { x, y };
  }

  function smoothStep(a, b, x){
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function drawRoundedRect(x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function draw(){
    const W = canvas.clientWidth || 1000;
    const H = canvas.height; // CSS pixels

    // Background (dark, blue)
    ctx.fillStyle = "#070a14";
    ctx.fillRect(0,0,W,H);

    // subtle gradient stripe
    const g = ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0, "rgba(30,90,160,0.20)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(50,130,220,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const pad = 16;
    const colGap = 14;
    const cols = 3;
    const colW = (W - pad*2 - colGap*(cols-1)) / cols;
    const cardH = H - pad*2;
    const top = pad;
    const lefts = [
      pad,
      pad + (colW + colGap),
      pad + 2*(colW + colGap)
    ];

    // Sun path area inside each card
    const skyTop = top + 14;
    const skyH = cardH * 0.58;
    const groundY = skyTop + skyH;

    // Sun position
    const sp = sunPos(t);
    const sunXn = sp.x;
    const sunYn = sp.y; // 0..1..0

    // Weather: irradiance and effects
    let irradiance = 1.0;
    let cloudCover = 0.0;   // 0..1
    let sensorDirty = 0.0;  // 0..1

    if(weather === "cloudy"){
      cloudCover = 0.7;
      irradiance = 0.55;
    } else if(weather === "dusty"){
      sensorDirty = 0.9;
      irradiance = 0.85; // still sunny, but sensor is blocked
    }

    // If near sunrise/sunset, lower irradiance a bit (soft)
    const edgeDim = 1 - smoothStep(0.05, 0.18, t) * smoothStep(0.95, 0.82, t);
    // edgeDim ~ 1 at edges; invert to dim edges
    const dayFactor = 0.65 + 0.35 * Math.sin(Math.PI*t);
    irradiance *= dayFactor;

    // calculate "true" sun angle for panels
    // Map sun position to an angle for tracking: -60..+60 degrees
    const sunAngle = (-60 + 120 * sunXn) * Math.PI/180;

    // 1) Fixed panel: constant tilt
    const fixedAngle = 20 * Math.PI/180;

    // 2) Sensor tracker: follows when locked, loses in cloudy/dusty, hunts
    // Losing probability depends on cloudCover or sensorDirty.
    // Also add higher loss at low sun (morning/evening).
    const lowSun = (sunYn < 0.25) ? 1 : 0;
    const lossPressure = clamp(0.15 + 0.95*(cloudCover + sensorDirty) + 0.25*lowSun, 0, 1);

    // randomly drop lock sometimes
    if(sensorLocked){
      // chance per frame scaled by lossPressure
      const p = 0.0025 * lossPressure;
      if(Math.random() < p) sensorLocked = false;
    } else {
      // regain lock if weather ok-ish and sun high
      const regain = (1 - lossPressure) * (sunYn > 0.25 ? 1 : 0.35);
      const p = 0.015 * regain;
      if(Math.random() < p) sensorLocked = true;
    }

    // update sensor angle
    if(sensorLocked){
      // smooth follow
      sensorAngle += (sunAngle - sensorAngle) * 0.08;
    } else {
      // hunting motion
      sensorHuntPhase += 0.12;
      const hunt = Math.sin(sensorHuntPhase) * (35*Math.PI/180);
      sensorAngle += (hunt - sensorAngle) * 0.06;
    }

    // 3) Algorithm tracker: always follows precisely
    const algoAngle = sunAngle;

    // Draw 3 cards
    const systems = [
      { name:"Fixed Panel", angle: fixedAngle, mode:"STATIC", color:"rgba(255,255,255,.65)", status:"OK" },
      { name:"Sensor Tracker", angle: sensorAngle, mode:"SENSOR", color:"rgba(110,168,255,.85)", status: sensorLocked ? "TRACKING" : "LOST" },
      { name:"SUNFLOWER", angle: algoAngle, mode:"ALGO", color:"rgba(126,231,135,.90)", status:"LOCKED" }
    ];

    for(let i=0;i<3;i++){
      const x0 = lefts[i];
      const y0 = top;
      const w = colW;
      const h = cardH;

      // card
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      drawRoundedRect(x0,y0,w,h,18);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // title
      ctx.fillStyle = "rgba(233,238,252,0.92)";
      ctx.font = "700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(systems[i].name, x0+14, y0+26);

      // status pill
      const st = systems[i].status;
      const pillW = ctx.measureText(st).width + 20;
      const pillX = x0 + w - pillW - 14;
      const pillY = y0 + 12;
      ctx.fillStyle = (i===1 && st==="LOST") ? "rgba(255,120,120,0.16)" : "rgba(255,255,255,0.06)";
      ctx.strokeStyle = (i===1 && st==="LOST") ? "rgba(255,120,120,0.35)" : "rgba(255,255,255,0.10)";
      drawRoundedRect(pillX, pillY, pillW, 22, 999);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = (i===1 && st==="LOST") ? "rgba(255,170,170,0.95)" : "rgba(233,238,252,0.78)";
      ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(st, pillX+10, pillY+15);

      // sky region
      const skyX = x0 + 12;
      const skyY = skyTop;
      const skyW = w - 24;
      const skyH2 = skyH - 10;

      // sky background
      const skyG = ctx.createLinearGradient(skyX, skyY, skyX, skyY+skyH2);
      skyG.addColorStop(0, "rgba(12,18,40,0.95)");
      skyG.addColorStop(1, "rgba(8,10,22,0.95)");
      ctx.fillStyle = skyG;
      drawRoundedRect(skyX, skyY, skyW, skyH2, 16);
      ctx.fill();

      // sun arc (path)
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let k=0;k<=60;k++){
        const tt = k/60;
        const p = sunPos(tt);
        const px = skyX + p.x * skyW;
        const py = skyY + (1 - p.y) * (skyH2*0.78) + skyH2*0.08;
        if(k===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
      }
      ctx.stroke();

      // clouds (only cloudy)
      if(weather === "cloudy"){
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(200,220,255,0.10)";
        const baseY = skyY + 34 + Math.sin(t*6.28 + i)*6;
        for(let c=0;c<4;c++){
          const cx = skyX + ( (t*0.6 + c*0.28) % 1 ) * skyW;
          const cy = baseY + c*8;
          drawRoundedRect(cx-40, cy, 86, 26, 999);
          ctx.fill();
          drawRoundedRect(cx-10, cy-14, 56, 24, 999);
          ctx.fill();
        }
        ctx.restore();
      }

      // sun position in this card
      const sunPx = skyX + sunXn * skyW;
      const sunPy = skyY + (1 - sunYn) * (skyH2*0.78) + skyH2*0.08;

      // sun glow (dimmed by clouds)
      const sunAlpha = clamp(0.25 + 0.75*(1-cloudCover), 0.15, 1);
      ctx.save();
      const glow = ctx.createRadialGradient(sunPx, sunPy, 4, sunPx, sunPy, 52);
      glow.addColorStop(0, `rgba(255,220,140,${0.30*sunAlpha})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sunPx, sunPy, 52, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // sun disk
      ctx.fillStyle = `rgba(255,220,140,${0.90*sunAlpha})`;
      ctx.beginPath();
      ctx.arc(sunPx, sunPy, 6, 0, Math.PI*2);
      ctx.fill();

      // ground line
      const gy = groundY;
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.moveTo(x0+12, gy);
      ctx.lineTo(x0+w-12, gy);
      ctx.stroke();

      // draw panel + stand
      const panelBaseX = x0 + w*0.5;
      const panelBaseY = gy + 84;

      // stand
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(panelBaseX, gy+10);
      ctx.lineTo(panelBaseX, panelBaseY-10);
      ctx.stroke();

      // tracker head
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      drawRoundedRect(panelBaseX-26, panelBaseY-14, 52, 28, 12);
      ctx.fill(); ctx.stroke();

      // sensors (only for sensor tracker)
      if(i===1){
        ctx.save();
        ctx.fillStyle = sensorDirty > 0.5 ? "rgba(255,160,120,0.65)" : "rgba(233,238,252,0.35)";
        ctx.beginPath(); ctx.arc(panelBaseX-10, panelBaseY-2, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(panelBaseX+10, panelBaseY-2, 3, 0, Math.PI*2); ctx.fill();

        // dirty overlay indicator
        if(weather === "dusty"){
          ctx.fillStyle = "rgba(255,170,120,0.12)";
          drawRoundedRect(panelBaseX-30, panelBaseY-30, 60, 18, 8);
          ctx.fill();
          ctx.fillStyle = "rgba(255,190,160,0.85)";
          ctx.font = "700 11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
          ctx.fillText("DIRTY SENSOR", panelBaseX-26, panelBaseY-18);
        }
        ctx.restore();
      }

      // panel rectangle rotated by system angle
      const ang = systems[i].angle;

      // ray from sun to panel direction indicator (only if sun above horizon)
      const sunAbove = (sunYn > 0.02);
      if(sunAbove){
        ctx.save();
        const rayAlpha = 0.10 + 0.18 * irradiance;
        ctx.strokeStyle = `rgba(255,220,140,${rayAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sunPx, sunPy);
        ctx.lineTo(panelBaseX, panelBaseY);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(panelBaseX, panelBaseY);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(15,23,48,0.85)";
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;

      // panel (w x h)
      const pw = 120, ph = 58;
      drawRoundedRect(-pw/2, -ph/2, pw, ph, 10);
      ctx.fill();
      ctx.stroke();

      // panel grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for(let gx= -pw/2 + 18; gx < pw/2; gx += 18){
        ctx.beginPath();
        ctx.moveTo(gx, -ph/2+6);
        ctx.lineTo(gx, ph/2-6);
        ctx.stroke();
      }
      for(let gy2= -ph/2 + 18; gy2 < ph/2; gy2 += 18){
        ctx.beginPath();
        ctx.moveTo(-pw/2+6, gy2);
        ctx.lineTo(pw/2-6, gy2);
        ctx.stroke();
      }

      // highlight border (system color)
      ctx.strokeStyle = systems[i].color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      drawRoundedRect(-pw/2, -ph/2, pw, ph, 10);
      ctx.stroke();
      ctx.restore();

      // compute yield (cos of angular error) * irradiance
      // treat sun below horizon -> 0
      const err = Math.abs(sunAngle - ang);
      let align = Math.cos(err);
      align = clamp(align, 0, 1);
      let sysIrr = irradiance;

      // in cloudy, all systems receive less irradiance (already applied),
      // but sensor tracker when LOST produces additional loss (unnecessary movement / misalignment)
      if(i===1 && !sensorLocked) align *= 0.35;

      // fixed panel loses in afternoon (misalignment naturally)
      // already captured by cos(err)

      const yieldVal = (sunAbove ? (align * sysIrr) : 0);

      // yield bar
      const barX = x0 + 14;
      const barY = y0 + h - 46;
      const barW = w - 28;
      const barH = 14;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      drawRoundedRect(barX, barY, barW, barH, 999);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = systems[i].color;
      const fillW = barW * yieldVal;
      drawRoundedRect(barX, barY, fillW, barH, 999);
      ctx.fill();

      ctx.fillStyle = "rgba(233,238,252,0.75)";
      ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      const pct = Math.round(yieldVal*100);
      ctx.fillText(`Yield: ${pct}%`, barX, barY + 32);

      // small caption about failure
      if(i===1 && !sensorLocked){
        ctx.fillStyle = "rgba(255,170,170,0.85)";
        ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.fillText("Sensor lost the Sun → hunting", barX, barY + 52);
      }
    }

    // Footer hint line
    ctx.fillStyle = "rgba(233,238,252,0.55)";
    ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const label = (weather === "sunny") ? "Sunny conditions" : (weather === "cloudy") ? "Cloudy (sensor instability)" : "Dusty (dirty sensor)";
    ctx.fillText(label, 18, H - 10);
  }

  function tick(ts){
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if(running){
      const dayRate = 1 / Math.max(4, secondsPerDay);
      t += dt * dayRate;
      if(t > 1) t -= 1;
    }

    draw();
    requestAnimationFrame(tick);
  }

  // Events
  window.addEventListener("resize", () => { resize(); });

  if(weatherSelect){
    weatherSelect.addEventListener("change", (e) => setWeather(e.target.value));
  }
  if(speedRange){
    speedRange.addEventListener("input", (e) => setSpeed(e.target.value));
    setSpeed(speedRange.value);
  }
  if(togglePlay){
    togglePlay.addEventListener("click", () => {
      running = !running;
      togglePlay.textContent = running ? "Pause" : "Play";
    });
  }
  if(resetDemo){
    resetDemo.addEventListener("click", () => reset());
  }

  // Init
  resize();
  draw();
  requestAnimationFrame((ts)=>{ lastTs = ts; tick(ts); });
})();
