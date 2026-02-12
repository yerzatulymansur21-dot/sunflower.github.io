// =====================================================
// SUNFLOWER — site.js
// - Bar charts (no libs)
// - Climate chart (Chart.js)
// - 11 formula buttons -> panel
// - Tracking demo (optimized for mobile)
// - Web Calculator (sun position + altitude chart)
// =====================================================

// -------------------------------
// Helpers
// -------------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function isMobileLike(){
  return window.matchMedia("(max-width: 900px)").matches || /Mobi|Android/i.test(navigator.userAgent);
}

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
let climateChart = null;

function renderClimateChart(){
  const canvas = document.getElementById("tempChartCanvas");
  if(!canvas || typeof Chart === "undefined") return;

  const years = [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2010, 2020, 2025];
  const anomaly = [-0.18, -0.12, -0.08, 0.05, 0.02, 0.18, 0.42, 0.62, 0.98, 1.15];

  const ctx = canvas.getContext("2d");

  if(climateChart) climateChart.destroy();

  climateChart = new Chart(ctx, {
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
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: "Year" }, grid: { display: false } },
        y: { title: { display: true, text: "Anomaly (°C)" } }
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
    definition: `<p><b>γ</b> converts the day/time into an annual angle (seasonal phase). It is used in solar declination and Equation of Time approximations.</p>`,
    derivation: `<p>The annual cycle is periodic, so we map the day number to an angle: one full year corresponds to <b>2π</b> radians.</p>`,
    eq: String.raw`\[
      \gamma = \frac{2\pi}{365}\left(n - 1 + \frac{h - 12}{24}\right)
    \]`
  },
  et: {
    title: "ET — Equation of Time",
    definition: `<p><b>ET</b> is the time difference between true solar time and mean clock time, due to orbital eccentricity and axial tilt.</p>`,
    derivation: `<p>ET varies periodically through the year and is approximated by harmonics of <b>γ</b> (NOAA-style).</p>`,
    eq: String.raw`\[
      ET = 229.18\left(
      0.000075 + 0.001868\cos\gamma - 0.032077\sin\gamma
      - 0.014615\cos(2\gamma) - 0.040849\sin(2\gamma)
      \right)
    \]`
  },
  delta: {
    title: "δ — Solar Declination",
    definition: `<p><b>δ</b> is the angle between the Sun’s rays and the Earth’s equatorial plane.</p>`,
    derivation: `<p>Declination is nearly sinusoidal; higher accuracy uses several harmonics of <b>γ</b>.</p>`,
    eq: String.raw`\[
      \delta =
      0.006918
      - 0.399912\cos\gamma
      + 0.070257\sin\gamma
      - 0.006758\cos(2\gamma)
      + 0.000907\sin(2\gamma)
      - 0.002697\cos(3\gamma)
      + 0.00148\sin(3\gamma)
    \]`
  },
  tf: {
    title: "t_f — Time Correction",
    definition: `<p><b>t_f</b> corrects local clock time to solar time using longitude difference and ET.</p>`,
    derivation: `<p>Earth rotates 360° in 24 hours ⇒ <b>1° ≈ 4 minutes</b>. Add ET to account for orbital effects.</p>`,
    eq: String.raw`\[
      t_f = 4\,(L_{st}-L_{loc}) + ET
    \]`
  },
  tst: {
    title: "t_st — True Solar Time",
    definition: `<p><b>t_st</b> is time defined by the Sun’s apparent motion (solar time).</p>`,
    derivation: `<p>Computed by applying the correction <b>t_f</b> to local time.</p>`,
    eq: String.raw`\[
      t_{st} = t + \frac{t_f}{60}
    \]`
  },
  ha: {
    title: "h_a — Hour Angle",
    definition: `<p><b>h_a</b> measures the Sun’s angular displacement from solar noon (when <b>h_a = 0</b>).</p>`,
    derivation: `<p>Earth rotates 15° per hour, so hour angle is proportional to \((t_{st}-12)\).</p>`,
    eq: String.raw`\[
      h_a = 15^\circ\,(t_{st}-12)
    \]`
  },
  phi: {
    title: "φ — Zenith Angle",
    definition: `<p><b>φ</b> is the angle between the Sun direction and the upward vertical (zenith).</p>`,
    derivation: `<p>From spherical trigonometry on the celestial sphere we obtain the cosine form.</p>`,
    eq: String.raw`\[
      \cos(\varphi) = \sin(lat)\sin(\delta) + \cos(lat)\cos(\delta)\cos(h_a)
    \]`
  },
  theta: {
    title: "θ — Azimuth",
    definition: `<p><b>θ</b> is the horizontal direction of the Sun (angle in the horizon plane).</p>`,
    derivation: `<p><b>atan2</b> is used to get the correct quadrant.</p>`,
    eq: String.raw`\[
      \theta = \operatorname{atan2}\left(\sin(h_a),\, \cos(h_a)\sin(lat)-\tan(\delta)\cos(lat)\right)
    \]`
  },
  sr: {
    title: "S_r,t — Sunrise & Sunset",
    definition: `<p><b>S_{r,t}</b> represent sunrise and sunset times. At sunrise/sunset, solar elevation is ~0°.</p>`,
    derivation: `<p>Set horizon condition and solve for hour angle \(h_{a0}\), then convert to time.</p>`,
    eq: String.raw`\[
      \cos(h_{a0}) = -\tan(lat)\tan(\delta)
    \]
    \[
      S_r = 12 - \frac{h_{a0}}{15^\circ}, \quad
      S_t = 12 + \frac{h_{a0}}{15^\circ}
    \]`
  },
  snoon: {
    title: "S_noon — Solar Noon",
    definition: `<p><b>S_{noon}</b> is when the Sun reaches its highest point (hour angle <b>h_a=0</b>).</p>`,
    derivation: `<p>Solar noon is 12:00 in true solar time, shifted in clock time by the correction.</p>`,
    eq: String.raw`\[
      S_{noon} = 12 - \frac{t_f}{60}
    \]`
  },
  dalpha: {
    title: "Δα — Angular Error",
    definition: `<p><b>Δα</b> measures tracking accuracy as the difference between reference and algorithm angles.</p>`,
    derivation: `<p>Use absolute differences for elevation and azimuth error metrics.</p>`,
    eq: String.raw`\[
      \Delta \alpha = \left| \alpha_{\text{ref}} - \alpha_{\text{alg}} \right|
    \]
    \[
      \Delta \theta = \left| \theta_{\text{ref}} - \theta_{\text{alg}} \right|
    \]`
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
// 4) INIT BASIC UI
// ===================================
document.addEventListener("DOMContentLoaded", () => {
  renderBars("energyBars", energyData, 1800);
  renderBars("costBars", costData, 1600);
  renderClimateChart();

  document.querySelectorAll(".formulaTile").forEach(btn => {
    btn.addEventListener("click", () => openFormulaPanel(btn.dataset.formula));
  });

  const closeBtn = document.getElementById("panelClose");
  if(closeBtn) closeBtn.addEventListener("click", closeFormulaPanel);

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeFormulaPanel();
  });
});

// ===================================
// 5) TRACKING DEMO (OPTIMIZED)
// ===================================
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

  let t = 0;
  let lastTs = performance.now();

  let sensorLocked = true;
  let sensorAngle = 0;
  let sensorHuntPhase = 0;

  // Visibility pause
  let demoVisible = true;
  const demoSection = document.getElementById("demo");
  if("IntersectionObserver" in window && demoSection){
    const io = new IntersectionObserver((entries) => {
      demoVisible = !!entries[0]?.isIntersecting;
    }, { threshold: 0.15 });
    io.observe(demoSection);
  }

  // Pause when tab hidden
  document.addEventListener("visibilitychange", () => {
    if(document.hidden) demoVisible = false;
  });

  function resize(){
    const dprRaw = window.devicePixelRatio || 1;
    const dpr = isMobileLike() ? Math.min(1.25, dprRaw) : Math.min(2, dprRaw);

    const cssW = canvas.clientWidth || 1000;
    const cssH = canvas.getAttribute("height") ? Number(canvas.getAttribute("height")) : 320;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setWeather(v){
    weather = v;
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
    const x = norm;
    const y = Math.sin(Math.PI * norm);
    return { x, y };
  }

  function smoothStep(a, b, x){
    const tt = clamp((x - a) / (b - a), 0, 1);
    return tt * tt * (3 - 2 * tt);
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

  // FPS cap on mobile
  const targetFrameMs = isMobileLike() ? 33 : 16;
  let accumMs = 0;

  function draw(){
    const W = canvas.clientWidth || 1000;
    const H = Number(canvas.getAttribute("height")) || 320;

    ctx.fillStyle = "#070a14";
    ctx.fillRect(0,0,W,H);

    const g = ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0, "rgba(30,90,160,0.20)");
    g.addColorStop(0.55, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(50,130,220,0.22)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    const pad = 16, colGap = 14, cols = 3;
    const colW = (W - pad*2 - colGap*(cols-1)) / cols;
    const cardH = H - pad*2;
    const top = pad;
    const lefts = [ pad, pad + (colW + colGap), pad + 2*(colW + colGap) ];

    const skyTop = top + 14;
    const skyH = cardH * 0.58;
    const groundY = skyTop + skyH;

    const sp = sunPos(t);
    const sunXn = sp.x;
    const sunYn = sp.y;

    let irradiance = 1.0;
    let cloudCover = 0.0;
    let sensorDirty = 0.0;

    if(weather === "cloudy"){
      cloudCover = 0.7;
      irradiance = 0.55;
    } else if(weather === "dusty"){
      sensorDirty = 0.9;
      irradiance = 0.85;
    }

    const dayFactor = 0.65 + 0.35 * Math.sin(Math.PI*t);
    irradiance *= dayFactor;

    const sunAngle = (-60 + 120 * sunXn) * Math.PI/180;
    const fixedAngle = 20 * Math.PI/180;

    const lowSun = (sunYn < 0.25) ? 1 : 0;
    const lossPressure = clamp(0.15 + 0.95*(cloudCover + sensorDirty) + 0.25*lowSun, 0, 1);

    // Make behavior deterministic-ish (no heavy random each frame on mobile)
    // Use a pseudo trigger based on time
    const rnd = Math.sin((t*1000) + 1.2345) * 0.5 + 0.5;

    if(sensorLocked){
      const p = 0.0025 * lossPressure;
      if(rnd < p) sensorLocked = false;
    } else {
      const regain = (1 - lossPressure) * (sunYn > 0.25 ? 1 : 0.35);
      const p = 0.015 * regain;
      if(rnd < p) sensorLocked = true;
    }

    if(sensorLocked){
      sensorAngle += (sunAngle - sensorAngle) * 0.08;
    } else {
      sensorHuntPhase += 0.12;
      const hunt = Math.sin(sensorHuntPhase) * (35*Math.PI/180);
      sensorAngle += (hunt - sensorAngle) * 0.06;
    }

    const algoAngle = sunAngle;

    const systems = [
      { name:"Fixed Panel", angle: fixedAngle, color:"rgba(255,255,255,.65)", status:"OK" },
      { name:"Sensor Tracker", angle: sensorAngle, color:"rgba(110,168,255,.85)", status: sensorLocked ? "TRACKING" : "LOST" },
      { name:"SUNFLOWER", angle: algoAngle, color:"rgba(126,231,135,.90)", status:"LOCKED" }
    ];

    for(let i=0;i<3;i++){
      const x0 = lefts[i], y0 = top, w = colW, h = cardH;

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      drawRoundedRect(x0,y0,w,h,18);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "rgba(233,238,252,0.92)";
      ctx.font = "700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(systems[i].name, x0+14, y0+26);

      const st = systems[i].status;
      ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      const pillW = ctx.measureText(st).width + 20;
      const pillX = x0 + w - pillW - 14;
      const pillY = y0 + 12;

      ctx.fillStyle = (i===1 && st==="LOST") ? "rgba(255,120,120,0.16)" : "rgba(255,255,255,0.06)";
      ctx.strokeStyle = (i===1 && st==="LOST") ? "rgba(255,120,120,0.35)" : "rgba(255,255,255,0.10)";
      drawRoundedRect(pillX, pillY, pillW, 22, 999);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = (i===1 && st==="LOST") ? "rgba(255,170,170,0.95)" : "rgba(233,238,252,0.78)";
      ctx.fillText(st, pillX+10, pillY+15);

      const skyX = x0 + 12;
      const skyY = skyTop;
      const skyW = w - 24;
      const skyH2 = skyH - 10;

      const skyG = ctx.createLinearGradient(skyX, skyY, skyX, skyY+skyH2);
      skyG.addColorStop(0, "rgba(12,18,40,0.95)");
      skyG.addColorStop(1, "rgba(8,10,22,0.95)");
      ctx.fillStyle = skyG;
      drawRoundedRect(skyX, skyY, skyW, skyH2, 16);
      ctx.fill();

      // Sun path
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let k=0;k<=40;k++){
        const tt = k/40;
        const p = sunPos(tt);
        const px = skyX + p.x * skyW;
        const py = skyY + (1 - p.y) * (skyH2*0.78) + skyH2*0.08;
        if(k===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();

      if(weather === "cloudy"){
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(200,220,255,0.10)";
        const baseY = skyY + 34 + Math.sin(t*6.28 + i)*6;
        for(let c=0;c<3;c++){
          const cx = skyX + ( (t*0.6 + c*0.33) % 1 ) * skyW;
          const cy = baseY + c*10;
          drawRoundedRect(cx-40, cy, 86, 26, 999); ctx.fill();
          drawRoundedRect(cx-10, cy-14, 56, 24, 999); ctx.fill();
        }
        ctx.restore();
      }

      const sunPx = skyX + sunXn * skyW;
      const sunPy = skyY + (1 - sunYn) * (skyH2*0.78) + skyH2*0.08;

      const sunAlpha = clamp(0.25 + 0.75*(1-cloudCover), 0.15, 1);

      // Glow (reduced radius on mobile)
      const glowR = isMobileLike() ? 34 : 52;
      const glow = ctx.createRadialGradient(sunPx, sunPy, 4, sunPx, sunPy, glowR);
      glow.addColorStop(0, `rgba(255,220,140,${0.26*sunAlpha})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(sunPx, sunPy, glowR, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = `rgba(255,220,140,${0.90*sunAlpha})`;
      ctx.beginPath(); ctx.arc(sunPx, sunPy, 6, 0, Math.PI*2); ctx.fill();

      // ground
      const gy = groundY;
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath(); ctx.moveTo(x0+12, gy); ctx.lineTo(x0+w-12, gy); ctx.stroke();

      const panelBaseX = x0 + w*0.5;
      const panelBaseY = gy + 84;

      // stand
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(panelBaseX, gy+10); ctx.lineTo(panelBaseX, panelBaseY-10); ctx.stroke();

      // head
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      drawRoundedRect(panelBaseX-26, panelBaseY-14, 52, 28, 12);
      ctx.fill(); ctx.stroke();

      // sensors
      if(i===1){
        ctx.save();
        ctx.fillStyle = sensorDirty > 0.5 ? "rgba(255,160,120,0.65)" : "rgba(233,238,252,0.35)";
        ctx.beginPath(); ctx.arc(panelBaseX-10, panelBaseY-2, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(panelBaseX+10, panelBaseY-2, 3, 0, Math.PI*2); ctx.fill();

        if(weather === "dusty"){
          ctx.fillStyle = "rgba(255,170,120,0.12)";
          drawRoundedRect(panelBaseX-30, panelBaseY-30, 60, 18, 8); ctx.fill();
          ctx.fillStyle = "rgba(255,190,160,0.85)";
          ctx.font = "700 11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
          ctx.fillText("DIRTY SENSOR", panelBaseX-26, panelBaseY-18);
        }
        ctx.restore();
      }

      const ang = systems[i].angle;

      // ray
      const sunAbove = (sunYn > 0.02);
      if(sunAbove){
        ctx.save();
        const rayAlpha = 0.10 + 0.18 * irradiance;
        ctx.strokeStyle = `rgba(255,220,140,${rayAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sunPx, sunPy); ctx.lineTo(panelBaseX, panelBaseY); ctx.stroke();
        ctx.restore();
      }

      // panel
      ctx.save();
      ctx.translate(panelBaseX, panelBaseY);
      ctx.rotate(ang);

      ctx.fillStyle = "rgba(15,23,48,0.85)";
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 2;

      const pw = 120, ph = 58;
      drawRoundedRect(-pw/2, -ph/2, pw, ph, 10);
      ctx.fill(); ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for(let gx= -pw/2 + 18; gx < pw/2; gx += 18){
        ctx.beginPath(); ctx.moveTo(gx, -ph/2+6); ctx.lineTo(gx, ph/2-6); ctx.stroke();
      }
      for(let gy2= -ph/2 + 18; gy2 < ph/2; gy2 += 18){
        ctx.beginPath(); ctx.moveTo(-pw/2+6, gy2); ctx.lineTo(pw/2-6, gy2); ctx.stroke();
      }

      ctx.strokeStyle = systems[i].color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      drawRoundedRect(-pw/2, -ph/2, pw, ph, 10);
      ctx.stroke();
      ctx.restore();

      // yield
      const err = Math.abs(sunAngle - ang);
      let align = Math.cos(err);
      align = clamp(align, 0, 1);
      let sysIrr = irradiance;
      if(i===1 && !sensorLocked) align *= 0.35;

      const yieldVal = (sunAbove ? (align * sysIrr) : 0);

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

      if(i===1 && !sensorLocked){
        ctx.fillStyle = "rgba(255,170,170,0.85)";
        ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.fillText("Sensor lost the Sun → hunting", barX, barY + 52);
      }
    }

    ctx.fillStyle = "rgba(233,238,252,0.55)";
    ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const label = (weather === "sunny") ? "Sunny conditions" : (weather === "cloudy") ? "Cloudy (sensor instability)" : "Dusty (dirty sensor)";
    ctx.fillText(label, 18, (Number(canvas.getAttribute("height")) || 320) - 10);
  }

  function tick(ts){
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    if(demoVisible && running){
      const dayRate = 1 / Math.max(4, secondsPerDay);
      t += dt * dayRate;
      if(t > 1) t -= 1;
    }

    // FPS throttle (mobile)
    accumMs += (ts - (tick._lastDrawTs || ts));
    if(accumMs >= targetFrameMs){
      draw();
      accumMs = 0;
      tick._lastDrawTs = ts;
    }

    requestAnimationFrame(tick);
  }

  // Events
  window.addEventListener("resize", resize);
  if(weatherSelect) weatherSelect.addEventListener("change", (e) => setWeather(e.target.value));
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
  if(resetDemo) resetDemo.addEventListener("click", reset);

  resize();
  draw();
  requestAnimationFrame((ts)=>{ lastTs = ts; tick(ts); });
})();

// ===================================
// 6) WEB CALCULATOR (Sun Position)
// ===================================
(function initWebCalculator(){
  const calcBtn = document.getElementById("calcBtn");
  const fillBtn = document.getElementById("calcFillBtn");

  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const latInput  = document.getElementById("latInput");
  const lonInput  = document.getElementById("lonInput");
  const tzInput   = document.getElementById("tzInput");

  const resultEl  = document.getElementById("result");
  const altCanvas = document.getElementById("altChartCanvas");

  if(!calcBtn || !resultEl || !altCanvas) return;

  const degToRad = (deg) => deg * Math.PI / 180;
  const radToDeg = (rad) => rad * 180 / Math.PI;
  const pad2 = (n) => String(n).padStart(2,'0');

  function dayOfYearUTC(d){
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Math.floor((now - start) / 86400000);
  }

  function computeFor(date, lat, lon, tz){
    const day = dayOfYearUTC(date);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const gamma = 2 * Math.PI / 365 * (day - 1 + (hour - 12) / 24);

    const eqtime = 229.18 * (
      0.000075
      + 0.001868 * Math.cos(gamma)
      - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2*gamma)
      - 0.040849 * Math.sin(2*gamma)
    );

    const decl = 0.006918
      - 0.399912 * Math.cos(gamma)
      + 0.070257 * Math.sin(gamma)
      - 0.006758 * Math.cos(2*gamma)
      + 0.000907 * Math.sin(2*gamma)
      - 0.002697 * Math.cos(3*gamma)
      + 0.00148  * Math.sin(3*gamma);

    const timeOffset = eqtime + 4 * lon - 60 * tz;
    const tst = hour * 60 + minute + second / 60 + timeOffset;
    const ha = (tst / 4) - 180;

    const haRad = degToRad(ha);
    const latRad = degToRad(lat);

    const cosZen = Math.sin(latRad) * Math.sin(decl)
      + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);

    const cosZenClamped = clamp(cosZen, -1, 1);
    const zenith = radToDeg(Math.acos(cosZenClamped));
    const altitude = 90 - zenith;

    const zenRad = Math.acos(cosZenClamped);
    const sinZen = Math.sin(zenRad);

    let azimuth = 0;
    if(sinZen > 1e-8){
      const sinAz = -(Math.sin(latRad) * Math.cos(decl) - Math.sin(decl) * Math.cos(latRad) * Math.cos(haRad)) / sinZen;
      const cosAz = (Math.sin(decl) - Math.sin(latRad) * cosZenClamped) / (Math.cos(latRad) * sinZen);
      azimuth = radToDeg(Math.atan2(sinAz, cosAz));
      if(azimuth < 0) azimuth += 360;
    }

    const solarNoonMin = 720 - 4 * lon - eqtime;
    const snoonH = Math.floor(solarNoonMin / 60);
    const snoonM = Math.floor(solarNoonMin % 60);

    return {
      day,
      gamma,
      eqtime,
      decl,
      timeOffset,
      tst,
      ha,
      zenith,
      azimuth,
      altitude,
      solarNoon: `${pad2(snoonH)}:${pad2(snoonM)}`
    };
  }

  let altitudeChart = null;

  function renderChart(lat, lon, tz){
    if(typeof Chart === "undefined") return;

    const dateStr = dateInput.value;
    if(!dateStr) return;

    const labels = [];
    const points = [];

    // 0..24 with 15-min step
    for(let h = 0; h <= 24; h += 0.25){
      const hh = Math.floor(h);
      const mm = Math.round((h - hh) * 60);
      labels.push(`${pad2(hh)}:${pad2(mm)}`);

      const d = new Date(dateStr + `T${pad2(hh)}:${pad2(mm)}:00`);
      const res = computeFor(d, lat, lon, tz);
      points.push(res.altitude);
    }

    const ctx = altCanvas.getContext("2d");

    if(altitudeChart) altitudeChart.destroy();

    altitudeChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Solar Altitude (°)",
          data: points,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            suggestedMin: -10,
            suggestedMax: 90,
            ticks: { color: "rgba(233,238,252,0.75)" },
            grid: { color: "rgba(255,255,255,0.08)" }
          },
          x: {
            ticks: { color: "rgba(233,238,252,0.55)", maxTicksLimit: 9 },
            grid: { color: "rgba(255,255,255,0.06)" }
          }
        },
        plugins: {
          legend: { labels: { color: "rgba(233,238,252,0.75)" } },
          tooltip: { callbacks: { label: (c) => `Altitude: ${c.parsed.y.toFixed(2)}°` } }
        }
      }
    });
  }

  function calc(){
    const dateStr = dateInput.value;
    const timeStr = timeInput.value;

    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    const tz  = parseFloat(tzInput.value);

    if(!dateStr || !timeStr || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(tz)){
      resultEl.textContent = "Please fill all inputs (date, time, latitude, longitude, timezone).";
      return;
    }

    const date = new Date(dateStr + "T" + timeStr + ":00");
    const r = computeFor(date, lat, lon, tz);

    resultEl.textContent =
      `Equation of Time: ${r.eqtime.toFixed(2)} min\n` +
      `Declination: ${radToDeg(r.decl).toFixed(2)}°\n` +
      `Time correction: ${r.timeOffset.toFixed(2)} min\n` +
      `True Solar Time: ${r.tst.toFixed(2)} min\n` +
      `Hour angle: ${r.ha.toFixed(2)}°\n` +
      `Zenith angle: ${r.zenith.toFixed(2)}°\n` +
      `Solar azimuth: ${r.azimuth.toFixed(2)}°\n` +
      `Solar altitude: ${r.altitude.toFixed(2)}°\n` +
      `Solar noon: ${r.solarNoon}`;

    renderChart(lat, lon, tz);
  }

  function fillDemo(){
    if(!dateInput.value){
      const now = new Date();
      dateInput.value = `${now.getFullYear()}-${pad2(now.getMonth()+1)}-${pad2(now.getDate())}`;
    }
    if(!timeInput.value) timeInput.value = "12:00";
    latInput.value = "49.946";
    lonInput.value = "82.604";
    tzInput.value = "5";
    calc();
  }

  calcBtn.addEventListener("click", calc);
  if(fillBtn) fillBtn.addEventListener("click", fillDemo);

  setTimeout(() => {
    if(dateInput.value && timeInput.value && latInput.value && lonInput.value && tzInput.value) calc();
  }, 300);
})();
