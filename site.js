/* =====================================================
   SUNFLOWER — site.js
   - Bar charts (no libs)
   - Climate chart (Chart.js)
   - 11 formula buttons -> panel (MathJax)
   - 3-system Tracking Demo (Canvas) optimized for mobile
   - Web Calculator (NOAA-style) + Chart.js altitude curve
   ===================================================== */

(() => {
  "use strict";

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
  function renderClimateChart(){
    const canvas = document.getElementById("tempChartCanvas");
    if(!canvas || typeof window.Chart === "undefined") return;

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
      definition: `<p><b>γ</b> converts the day/time into an annual angle (seasonal phase). It is used in
      solar declination and Equation of Time approximations.</p>`,
      derivation: `<p>The annual cycle is periodic, so we map the day number to an angle:
      one full year corresponds to <b>2π</b> radians.</p>`,
      eq: String.raw`\[
      \gamma = \frac{2\pi}{365}\left(n - 1 + \frac{h - 12}{24}\right)
      \]`
    },
    et: {
      title: "ET — Equation of Time",
      definition: `<p><b>ET</b> is the time difference between true solar time and mean clock time,
      mainly due to orbital eccentricity and Earth’s axial tilt.</p>`,
      derivation: `<p>ET varies periodically through the year, so it is approximated by a sum of
      sine/cosine harmonics of <b>γ</b> (standard NOAA/SPA style).</p>`,
      eq: String.raw`\[
      ET = 229.18\left(
      0.000075 + 0.001868\cos\gamma - 0.032077\sin\gamma
      - 0.014615\cos(2\gamma) - 0.040849\sin(2\gamma)
      \right)
      \]`
    },
    delta: {
      title: "δ — Solar Declination",
      definition: `<p><b>δ</b> is the angle between the Sun’s rays and the Earth’s equatorial plane.
      It controls seasonal changes in solar height.</p>`,
      derivation: `<p>Declination is nearly sinusoidal over the year; higher accuracy uses several
      harmonics of <b>γ</b>.</p>`,
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
      derivation: `<p>It is computed by applying the correction <b>t_f</b> to local time.</p>`,
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
      definition: `<p><b>φ</b> is the zenith angle: the angle between the Sun direction and the upward vertical (zenith).</p>`,
      derivation: `<p>From spherical trigonometry on the celestial sphere (latitude, declination, hour angle),
      we obtain the cosine form for the zenith angle.</p>`,
      eq: String.raw`\[
      \cos(\varphi) = \sin(lat)\sin(\delta) + \cos(lat)\cos(\delta)\cos(h_a)
      \]`
    },
    theta: {
      title: "θ — Azimuth",
      definition: `<p><b>θ</b> is the horizontal direction of the Sun (angle in the horizon plane).</p>`,
      derivation: `<p>Using spherical trigonometry, <b>atan2</b> is used to get the correct quadrant for azimuth.</p>`,
      eq: String.raw`\[
      \theta = \operatorname{atan2}\left(\sin(h_a),\, \cos(h_a)\sin(lat)-\tan(\delta)\cos(lat)\right)
      \]`
    },
    sr: {
      title: "S_r,t — Sunrise & Sunset",
      definition: `<p><b>S_{r,t}</b> represent sunrise and sunset times. At sunrise/sunset, solar elevation is ~0°,
      so the zenith angle is ~90°.</p>`,
      derivation: `<p>Set \(\cos(\varphi)=0\) (horizon condition) and solve for the sunrise/sunset hour angle \(h_{a0}\),
      then convert angle to time (15° per hour).</p>`,
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
      definition: `<p><b>S_{noon}</b> is the moment when the Sun reaches its highest point (hour angle <b>h_a=0</b>).</p>`,
      derivation: `<p>Solar noon is 12:00 in true solar time, so the clock-time shift depends on the time correction.</p>`,
      eq: String.raw`\[
      S_{noon} = 12 - \frac{t_f}{60}
      \]`
    },
    dalpha: {
      title: "Δα — Angular Error",
      definition: `<p><b>Δα</b> measures the difference between a reference angle and the algorithm output
      (used to quantify tracking accuracy).</p>`,
      derivation: `<p>The simplest accuracy metric is the absolute difference between angles.</p>`,
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

  // ============================
  // 4) TRACKING DEMO (Canvas) — optimized
  // ============================
function initTrackerDemo(){
  // --- find demo root ---
  const demoSection = document.getElementById("demo") || document.querySelector("#demo, .demoCard");
  if(!demoSection) return;

  // controls (ids from your html)
  const weatherSelect = document.getElementById("weatherSelect");
  const speedRange = document.getElementById("speedRange");
  const speedVal = document.getElementById("speedVal");
  const togglePlay = document.getElementById("togglePlay");
  const resetDemo = document.getElementById("resetDemo");

  // 1) Try "single canvas" layout
  let canvasMain = document.getElementById("trackerDemo");

  // 2) Try "3 canvas" layout (old template variants)
  let cFixed  = document.getElementById("fixedCanvas")  || document.getElementById("fixedPanelCanvas");
  let cSensor = document.getElementById("sensorCanvas") || document.getElementById("sensorTrackerCanvas");
  let cAlgo   = document.getElementById("algoCanvas")   || document.getElementById("sunflowerCanvas");

  // 3) If nothing found, create a canvas in the demo wrap
  if(!canvasMain && !(cFixed && cSensor && cAlgo)){
    const wrap =
      demoSection.querySelector(".demoWrap") ||
      demoSection.querySelector(".demo") ||
      demoSection.querySelector(".demoContainer") ||
      demoSection.querySelector(".trackingDemo") ||
      demoSection.querySelector(".card") ||
      demoSection;

    canvasMain = document.createElement("canvas");
    canvasMain.id = "trackerDemo";
    canvasMain.style.width = "100%";
    canvasMain.style.display = "block";
    canvasMain.height = 320;
    wrap.appendChild(canvasMain);
  }

  // Decide drawing mode
  const mode = (cFixed && cSensor && cAlgo) ? "triple" : "single";

  // Canvas contexts
  const ctxMain = canvasMain ? canvasMain.getContext("2d", { alpha:false }) : null;
  const ctxF = cFixed  ? cFixed.getContext("2d", { alpha:false }) : null;
  const ctxS = cSensor ? cSensor.getContext("2d", { alpha:false }) : null;
  const ctxA = cAlgo   ? cAlgo.getContext("2d", { alpha:false }) : null;

  // --- runtime settings ---
  const isMobile = matchMedia("(max-width: 900px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const dprCap = isMobile ? 1.5 : 2;

  let weather = (weatherSelect && weatherSelect.value) || "sunny";
  let secondsPerDay = Number((speedRange && speedRange.value) || 12);
  let running = true;

  // time state
  let t = 0;                 // 0..1 day
  let last = performance.now();

  // sensor behavior
  let sensorLocked = true;
  let sensorAngle = 0;
  let huntPhase = 0;

  function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
  function rad(deg){ return deg*Math.PI/180; }
  function sunPos(norm){
    // smooth half-sine path
    const x = norm;
    const y = Math.sin(Math.PI * norm);
    return {x,y};
  }

  function setupCanvas(c, ctx){
    if(!c || !ctx) return;
    const cssW = c.clientWidth || c.parentElement?.clientWidth || 900;
    const cssH = Number(c.getAttribute("height") || c.height || 320);
    const dpr = Math.min(dprCap, window.devicePixelRatio || 1);

    c.width  = Math.floor(cssW * dpr);
    c.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function resizeAll(){
    if(mode === "single"){
      setupCanvas(canvasMain, ctxMain);
    } else {
      setupCanvas(cFixed,  ctxF);
      setupCanvas(cSensor, ctxS);
      setupCanvas(cAlgo,   ctxA);
    }
  }

  function drawOneCard(ctx, W, H, label, status, statusBad, color, panelAngle, sunXn, sunYn, extras){
    // background
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0,0,W,H);

    // soft vignette
    const vg = ctx.createRadialGradient(W*0.35, H*0.20, 10, W*0.5, H*0.45, Math.max(W,H));
    vg.addColorStop(0, "rgba(70,120,255,0.14)");
    vg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,W,H);

    // title
    ctx.fillStyle = "rgba(233,238,252,0.92)";
    ctx.font = "700 15px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(label, 14, 24);

    // status pill
    const pillText = status;
    ctx.font = "700 11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const pillW = ctx.measureText(pillText).width + 18;
    const pillX = W - pillW - 12;
    const pillY = 10;

    ctx.fillStyle = statusBad ? "rgba(255,120,120,0.16)" : "rgba(255,255,255,0.06)";
    ctx.strokeStyle = statusBad ? "rgba(255,120,120,0.35)" : "rgba(255,255,255,0.10)";
    roundRect(ctx, pillX, pillY, pillW, 20, 999); ctx.fill(); ctx.stroke();

    ctx.fillStyle = statusBad ? "rgba(255,170,170,0.95)" : "rgba(233,238,252,0.75)";
    ctx.fillText(pillText, pillX+9, pillY+14);

    // sky box
    const skyX = 12, skyY = 38, skyW = W-24, skyH = Math.floor(H*0.56);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    roundRect(ctx, skyX, skyY, skyW, skyH, 14); ctx.fill(); ctx.stroke();

    // arc
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let k=0;k<=48;k++){
      const tt = k/48;
      const p = sunPos(tt);
      const px = skyX + p.x * skyW;
      const py = skyY + (1 - p.y) * (skyH*0.78) + skyH*0.08;
      if(k===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();

    // sun position (actual)
    const sunPx = skyX + sunXn * skyW;
    const sunPy = skyY + (1 - sunYn) * (skyH*0.78) + skyH*0.08;

    // glow
    const g = ctx.createRadialGradient(sunPx, sunPy, 4, sunPx, sunPy, 46);
    g.addColorStop(0, "rgba(255,220,140,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sunPx, sunPy, 46, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "rgba(255,220,140,0.92)";
    ctx.beginPath(); ctx.arc(sunPx, sunPy, 6, 0, Math.PI*2); ctx.fill();

    // weather visuals
    if(extras.cloudy){
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(200,220,255,0.10)";
      for(let c=0;c<(isMobile?2:4);c++){
        const cx = skyX + ((t*0.6 + c*0.33) % 1) * skyW;
        const cy = skyY + 26 + c*10;
        roundRect(ctx, cx-40, cy, 86, 24, 999); ctx.fill();
        roundRect(ctx, cx-10, cy-14, 56, 22, 999); ctx.fill();
      }
      ctx.restore();
    }

    // ground line
    const groundY = skyY + skyH + 12;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath(); ctx.moveTo(12, groundY); ctx.lineTo(W-12, groundY); ctx.stroke();

    // stand
    const baseX = W*0.5;
    const baseY = groundY + 82;

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(baseX, groundY+10); ctx.lineTo(baseX, baseY-10); ctx.stroke();

    // sensor head (only for sensor)
    if(extras.sensorHead){
      ctx.fillStyle = extras.dusty ? "rgba(255,170,120,0.65)" : "rgba(233,238,252,0.35)";
      ctx.beginPath(); ctx.arc(baseX-10, baseY-2, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(baseX+10, baseY-2, 3, 0, Math.PI*2); ctx.fill();
      if(extras.dusty){
        ctx.fillStyle = "rgba(255,170,120,0.12)";
        roundRect(ctx, baseX-34, baseY-30, 68, 18, 8); ctx.fill();
        ctx.fillStyle = "rgba(255,190,160,0.85)";
        ctx.font = "700 11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        ctx.fillText("DIRTY", baseX-22, baseY-18);
      }
    }

    // sun ray
    if(sunYn > 0.02){
      ctx.strokeStyle = `rgba(255,220,140,${0.14 + 0.10*extras.irradiance})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sunPx, sunPy); ctx.lineTo(baseX, baseY); ctx.stroke();
    }

    // panel
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(panelAngle);

    const pw=112, ph=54;
    ctx.fillStyle = "rgba(15,23,48,0.88)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    roundRect(ctx, -pw/2, -ph/2, pw, ph, 10); ctx.fill(); ctx.stroke();

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for(let gx=-pw/2+18; gx<pw/2; gx+=18){
      ctx.beginPath(); ctx.moveTo(gx, -ph/2+6); ctx.lineTo(gx, ph/2-6); ctx.stroke();
    }

    // outline color
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, -pw/2, -ph/2, pw, ph, 10); ctx.stroke();
    ctx.restore();

    // yield bar
    const sunAngle = extras.sunAngle;
    const err = Math.abs(sunAngle - panelAngle);
    let align = clamp(Math.cos(err), 0, 1);
    if(extras.sensorLost) align *= 0.35;
    const yv = (sunYn > 0.02) ? align * extras.irradiance : 0;

    const bx=14, by=H-28, bw=W-28, bh=12;
    ctx.fillStyle="rgba(255,255,255,0.06)";
    ctx.strokeStyle="rgba(255,255,255,0.12)";
    roundRect(ctx,bx,by,bw,bh,999); ctx.fill(); ctx.stroke();

    ctx.fillStyle=color;
    roundRect(ctx,bx,by,bw*yv,bh,999); ctx.fill();

    ctx.fillStyle="rgba(233,238,252,0.75)";
    ctx.font="600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`Yield: ${Math.round(yv*100)}%`, 14, H-36);

    if(extras.sensorLost){
      ctx.fillStyle="rgba(255,170,170,0.85)";
      ctx.font="700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText("Lost → hunting", 14, H-8);
    }
  }

  function roundRect(ctx, x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function computeAngles(){
    // weather parameters
    let irradiance = 1.0;
    let cloudy = false;
    let dusty = false;

    if(weather === "cloudy"){ cloudy = true; irradiance *= 0.55; }
    if(weather === "dusty"){ dusty = true; irradiance *= 0.85; }

    const sp = sunPos(t);
    const dayFactor = 0.65 + 0.35 * sp.y; // stronger at noon
    irradiance *= dayFactor;

    const sunAngle = rad(-60 + 120 * sp.x);
    const fixedAngle = rad(20);

    // "pressure" that breaks sensor lock
    const lossPressure = clamp(0.15 + (cloudy?0.7:0) + (dusty?0.9:0) + (sp.y<0.25?0.25:0), 0, 1);

    const wobble = 0.5 + 0.5*Math.sin(12.0*t + 1.7);

    if(sensorLocked){
      if(wobble < (0.18 * lossPressure)) sensorLocked = false;
    } else {
      const regain = (1 - lossPressure) * (sp.y > 0.25 ? 1 : 0.35);
      if(wobble > (0.65 - 0.35*regain)) sensorLocked = true;
    }

    if(sensorLocked){
      sensorAngle += (sunAngle - sensorAngle) * 0.08;
    } else {
      huntPhase += 0.10;
      const hunt = Math.sin(huntPhase) * rad(35);
      sensorAngle += (hunt - sensorAngle) * 0.06;
    }

    return {
      sp,
      irradiance,
      cloudy,
      dusty,
      sunAngle,
      fixedAngle,
      sensorAngle,
      algoAngle: sunAngle,
      sensorLost: !sensorLocked
    };
  }

  function draw(){
    const a = computeAngles();

    if(mode === "single"){
      const W = canvasMain.clientWidth || 1000;
      const H = Number(canvasMain.getAttribute("height") || 320);

      // draw 3 cards inside one canvas (like your screenshot)
      const pad=14, gap=12;
      const colW = (W - pad*2 - gap*2) / 3;
      const colH = H - pad*2;

      ctxMain.clearRect(0,0,W,H);

      // background for whole area
      ctxMain.fillStyle = "#050913";
      ctxMain.fillRect(0,0,W,H);

      const labels = ["Fixed Panel", "Sensor Tracker", "SUNFLOWER"];
      const statuses = ["OK", a.sensorLost ? "LOST" : "TRACKING", "LOCKED"];
      const bad = [false, a.sensorLost, false];
      const colors = ["rgba(255,255,255,.65)", "rgba(110,168,255,.85)", "rgba(126,231,135,.90)"];
      const angles = [a.fixedAngle, a.sensorAngle, a.algoAngle];

      for(let i=0;i<3;i++){
        const x = pad + i*(colW+gap);
        const y = pad;

        // sub-viewport draw by translating
        ctxMain.save();
        ctxMain.translate(x,y);

        drawOneCard(
          ctxMain,
          colW,
          colH,
          labels[i],
          statuses[i],
          bad[i],
          colors[i],
          angles[i],
          a.sp.x,
          a.sp.y,
          {
            sunny: weather==="sunny",
            cloudy: a.cloudy,
            dusty: a.dusty,
            irradiance: a.irradiance,
            sunAngle: a.sunAngle,
            sensorHead: i===1,
            sensorLost: i===1 && a.sensorLost
          }
        );

        ctxMain.restore();
      }
    } else {
      // triple canvases
      const Wf = cFixed.clientWidth || 320;
      const Hf = Number(cFixed.getAttribute("height") || 260);

      drawOneCard(ctxF, Wf, Hf, "Fixed Panel", "OK", false,
        "rgba(255,255,255,.65)", a.fixedAngle, a.sp.x, a.sp.y,
        { sunny: weather==="sunny", cloudy: a.cloudy, dusty: a.dusty, irradiance: a.irradiance, sunAngle: a.sunAngle, sensorHead:false, sensorLost:false }
      );

      drawOneCard(ctxS, Wf, Hf, "Sensor Tracker", a.sensorLost ? "LOST" : "TRACKING", a.sensorLost,
        "rgba(110,168,255,.85)", a.sensorAngle, a.sp.x, a.sp.y,
        { sunny: weather==="sunny", cloudy: a.cloudy, dusty: a.dusty, irradiance: a.irradiance, sunAngle: a.sunAngle, sensorHead:true, sensorLost:a.sensorLost }
      );

      drawOneCard(ctxA, Wf, Hf, "SUNFLOWER", "LOCKED", false,
        "rgba(126,231,135,.90)", a.algoAngle, a.sp.x, a.sp.y,
        { sunny: weather==="sunny", cloudy: a.cloudy, dusty: a.dusty, irradiance: a.irradiance, sunAngle: a.sunAngle, sensorHead:false, sensorLost:false }
      );
    }
  }

  function step(now){
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if(running){
      const dayRate = 1 / Math.max(4, secondsPerDay);
      t += dt * dayRate;
      if(t > 1) t -= 1;
    }
    draw();
    requestAnimationFrame(step);
  }

  // controls
  function setSpeed(v){
    secondsPerDay = Number(v);
    if(speedVal) speedVal.textContent = String(secondsPerDay);
  }

  if(weatherSelect){
    weatherSelect.addEventListener("change", (e) => {
      weather = e.target.value;
      sensorLocked = true;
      huntPhase = 0;
    });
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
    resetDemo.addEventListener("click", () => {
      t = 0;
      sensorLocked = true;
      sensorAngle = 0;
      huntPhase = 0;
      draw();
    });
  }

  window.addEventListener("resize", () => {
    resizeAll();
    draw();
  });

  // start
  resizeAll();
  draw();
  last = performance.now();
  requestAnimationFrame(step);
}

  // ============================
  // 5) WEB CALCULATOR + ALT CHART
  // ============================
  function initWebCalculator(){
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
    if(typeof window.Chart === "undefined") return;

    const degToRad = (deg) => deg * Math.PI / 180;
    const radToDeg = (rad) => rad * 180 / Math.PI;

    function dayOfYearUTC(d){
      const start = Date.UTC(d.getUTCFullYear(), 0, 0);
      const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return Math.floor((now - start) / 86400000);
    }

    function pad2(n){ return String(n).padStart(2,'0'); }

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

      const cosZenClamped = Math.max(-1, Math.min(1, cosZen));
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

    function renderChart(lat, lon, tz, dateStr){
      const labels = [];
      const points = [];

      for(let h = 0; h <= 24; h += 0.25){
        const hh = Math.floor(h);
        const mm = Math.round((h - hh) * 60);
        labels.push(`${pad2(hh)}:${pad2(mm)}`);

        const d = new Date(`${dateStr}T${pad2(hh)}:${pad2(mm)}:00`);
        const r = computeFor(d, lat, lon, tz);
        points.push(r.altitude);
      }

      const c = altCanvas.getContext("2d");
      if(altitudeChart) altitudeChart.destroy();

      altitudeChart = new Chart(c, {
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
            tooltip: { callbacks: { label: (ctx) => `Altitude: ${ctx.parsed.y.toFixed(2)}°` } }
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

      renderChart(lat, lon, tz, dateStr);
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
  }

  // ===================================
  // INIT (DOMContentLoaded)
  // ===================================
  document.addEventListener("DOMContentLoaded", () => {
    // bars
    renderBars("energyBars", energyData, 1800);
    renderBars("costBars", costData, 1600);

    // climate
    renderClimateChart();

    // formulas
    document.querySelectorAll(".formulaTile").forEach(btn => {
      btn.addEventListener("click", () => openFormulaPanel(btn.dataset.formula));
    });

    const closeBtn = document.getElementById("panelClose");
    if(closeBtn) closeBtn.addEventListener("click", closeFormulaPanel);

    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape") closeFormulaPanel();
    });

    // demo + calculator
    initTrackerDemo();
    initWebCalculator();
  });

})();
