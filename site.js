/* site.js — SUNFLOWER (stable on mobile + desktop)
   Includes:
   - Climate chart (Chart.js) if #tempChartCanvas exists
   - Comparison bars if #energyBars / #costBars exist
   - Formula panel if #formulaPanel and .formulaTile exist
   - Tracking demo canvas (3-system comparison) if #trackerDemo exists
   - Web calculator (Sun position) if calculator IDs exist
*/
(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isMobile = () => matchMedia("(max-width: 768px)").matches;
  const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safeText(s) {
    return String(s ?? "");
  }

  // Use lower DPR on mobile to avoid lag
  function getSafeDPR() {
    const dpr = window.devicePixelRatio || 1;
    if (isMobile()) return Math.min(dpr, 1.5);
    return Math.min(dpr, 2);
  }

  function setupHiDPICanvas(canvas) {
    const dpr = getSafeDPR();
    const cssW = canvas.clientWidth || canvas.width || 600;
    const cssH = canvas.clientHeight || canvas.height || 320;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: cssW, h: cssH, dpr };
  }

  // Pause animation when offscreen
  function observeVisibility(el, onChange) {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) onChange(!!e.isIntersecting);
      },
      { threshold: 0.08 }
    );
    io.observe(el);
  }

  // ---------- 1) Climate chart (Chart.js) ----------
  function initClimateChart() {
    const canvas = $("#tempChartCanvas");
    if (!canvas || !window.Chart) return;

    // demo data (lightweight)
    const years = [];
    const vals = [];
    for (let y = 2000; y <= 2025; y++) {
      years.push(String(y));
      // gentle upward demo trend
      vals.push((0.25 + (y - 2000) * 0.02 + (Math.sin((y - 2000) * 0.7) * 0.03)).toFixed(2));
    }

    const ctx = canvas.getContext("2d");
    // Destroy old chart if hot-reload
    if (canvas.__chart) {
      try { canvas.__chart.destroy(); } catch {}
    }

    canvas.__chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: "Global temperature anomaly (demo)",
          data: vals,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // important for mobile
        plugins: { legend: { display: true } },
        scales: {
          x: { ticks: { maxTicksLimit: 7 } },
          y: { title: { display: true, text: "°C" } }
        }
      }
    });
  }

  // ---------- 2) Comparison bars ----------
  function initBars() {
    const energyEl = $("#energyBars");
    const costEl = $("#costBars");
    if (!energyEl && !costEl) return;

    function renderBars(el, items) {
      if (!el) return;
      el.innerHTML = "";
      const max = Math.max(...items.map(i => i.v));
      items.forEach((i) => {
        const row = document.createElement("div");
        row.className = "barRow";
        const label = document.createElement("div");
        label.className = "barLabel";
        label.textContent = i.name;
        const track = document.createElement("div");
        track.className = "barTrack";
        const bar = document.createElement("div");
        bar.className = "barFill";
        bar.style.width = `${(i.v / max) * 100}%`;
        const val = document.createElement("div");
        val.className = "barVal";
        val.textContent = i.txt;
        track.appendChild(bar);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(val);
        el.appendChild(row);
      });
    }

    renderBars(energyEl, [
      { name: "Fixed PV", v: 1350, txt: "1350" },
      { name: "Sensor tracker", v: 1600, txt: "1600" },
      { name: "SUNFLOWER", v: 1700, txt: "1700" }
    ]);

    renderBars(costEl, [
      { name: "Fixed PV", v: 1250, txt: "1200–1250" },
      { name: "Sensor tracker", v: 1500, txt: "1400–1500" },
      { name: "SUNFLOWER", v: 1450, txt: "1350–1450" }
    ]);
  }

  // ---------- 3) Formulas panel (content can be expanded later) ----------
  function initFormulaPanel() {
    const panel = $("#formulaPanel");
    const title = $("#panelTitle");
    const body = $("#panelBody");
    const closeBtn = $("#panelClose");
    const tiles = $$(".formulaTile");

    if (!panel || !title || !body || tiles.length === 0) return;

    const CONTENT = {
      gamma: {
        t: "γ — Fractional year",
        d: "Definition: a normalized angle used to approximate yearly solar changes.",
        p: "Idea: map day-of-year and time into a single phase angle.",
        f: "\\[\\gamma = \\frac{2\\pi}{365}\\left(n - 1 + \\frac{h-12}{24}\\right)\\]"
      },
      et: {
        t: "ET — Equation of Time",
        d: "Definition: difference between solar time and clock time due to Earth’s orbit and tilt.",
        p: "Derived from a harmonic approximation using γ.",
        f: "\\[ET\\,(min)=229.18\\,(0.000075+0.001868\\cos\\gamma-0.032077\\sin\\gamma-0.014615\\cos2\\gamma-0.040849\\sin2\\gamma)\\]"
      },
      delta: {
        t: "δ — Solar declination",
        d: "Definition: angle between solar rays and Earth’s equatorial plane.",
        p: "Approximated as a Fourier series in γ.",
        f: "\\[\\delta=0.006918-0.399912\\cos\\gamma+0.070257\\sin\\gamma-0.006758\\cos2\\gamma+0.000907\\sin2\\gamma-0.002697\\cos3\\gamma+0.00148\\sin3\\gamma\\]"
      },
      tf: {
        t: "t_f — Time correction",
        d: "Definition: correction (minutes) applied to convert local clock time to true solar time.",
        p: "Combines equation of time, longitude, and time zone.",
        f: "\\[t_f = ET + 4\\,\\lambda - 60\\,TZ\\]"
      },
      tst: {
        t: "t_st — True Solar Time",
        d: "Definition: solar time in minutes from local solar midnight.",
        p: "Clock minutes + time correction.",
        f: "\\[t_{st} = 60h + m + s/60 + t_f\\]"
      },
      ha: {
        t: "h_a — Hour angle",
        d: "Definition: angular measure of time relative to solar noon.",
        p: "Each 4 minutes corresponds to 1°.",
        f: "\\[h_a = \\frac{t_{st}}{4} - 180^\\circ\\]"
      },
      phi: {
        t: "φ — Zenith angle",
        d: "Definition: angle between vertical and the Sun direction.",
        p: "From spherical trigonometry of the local sky dome.",
        f: "\\[\\cos\\varphi=\\sin\\phi_{lat}\\sin\\delta+\\cos\\phi_{lat}\\cos\\delta\\cos h_a\\]"
      },
      theta: {
        t: "θ — Azimuth",
        d: "Definition: compass direction of the Sun projection on the horizon.",
        p: "Computed from hour angle, latitude, and declination.",
        f: "\\[\\theta = \\operatorname{atan2}(\\sin\\theta_s,\\cos\\theta_s)\\quad\\text{(normalized to }0..360^\\circ\\text{)}\\]"
      },
      sr: {
        t: "S_r,t — Sunrise & Sunset",
        d: "Definition: times when the Sun crosses the horizon.",
        p: "Solve for hour angle at a chosen zenith (≈ 90.833° for refraction).",
        f: "\\[\\cos h_{sr}=\\frac{\\cos Z - \\sin\\phi_{lat}\\sin\\delta}{\\cos\\phi_{lat}\\cos\\delta}\\]"
      },
      snoon: {
        t: "S_noon — Solar noon",
        d: "Definition: time when Sun is highest (hour angle = 0).",
        p: "From longitude and equation of time.",
        f: "\\[S_{noon}(min)=720-4\\lambda-ET\\]"
      },
      dalpha: {
        t: "Δα — Angular error",
        d: "Definition: angular distance between Sun direction and panel normal.",
        p: "Spherical trigonometry between two sky directions.",
        f: "\\[\\Delta\\alpha=\\arccos\\left(\\sin h_1\\sin h_2+\\cos h_1\\cos h_2\\cos(A_1-A_2)\\right)\\]"
      }
    };

    function openFormula(key) {
      const c = CONTENT[key];
      if (!c) return;
      title.textContent = c.t;
      body.innerHTML = `
        <div class="panelSection"><h4>Definition</h4><p>${safeText(c.d)}</p></div>
        <div class="panelSection"><h4>Derivation / Idea</h4><p>${safeText(c.p)}</p></div>
        <div class="panelSection"><h4>Final equation</h4>${c.f}</div>
      `;
      panel.classList.remove("hidden");
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([body]).catch(() => {});
    }

    function close() {
      panel.classList.add("hidden");
    }

    tiles.forEach((btn) => {
      btn.addEventListener("click", () => openFormula(btn.dataset.formula));
    });
    closeBtn?.addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      if (e.target === panel) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ---------- 4) Tracking demo (optimized) ----------
  function initTrackingDemo() {
    const canvas = $("#trackerDemo");
    if (!canvas) return;

    // Respect reduced motion: show static frame
    const reduced = prefersReduced();

    let { ctx, w, h } = setupHiDPICanvas(canvas);

    const weatherSelect = $("#weatherSelect");
    const speedRange = $("#speedRange");
    const speedVal = $("#speedVal");
    const togglePlay = $("#togglePlay");
    const resetDemo = $("#resetDemo");

    let running = !reduced;
    let visible = true;
    let t = 0;           // 0..1 "day progress"
    let last = 0;
    let fpsCap = isMobile() ? 30 : 60;
    let frameInterval = 1000 / fpsCap;

    let weather = (weatherSelect?.value) || "sunny";
    let daySeconds = Number(speedRange?.value || 12); // seconds per full day

    function readControls() {
      if (weatherSelect) weather = weatherSelect.value;
      if (speedRange) daySeconds = Number(speedRange.value || 12);
      if (speedVal) speedVal.textContent = String(daySeconds);
    }

    function reset() {
      t = 0;
    }

    // Basic sky + sun trajectory
    function sunPos(tt) {
      // tt: 0..1 maps sunrise->sunset across top arc
      // angle from -150deg to -30deg for visual arc (left to right)
      const a = (-150 + 120 * tt) * Math.PI / 180;
      const cx = w * 0.5;
      const cy = h * 0.55;
      const rx = w * 0.38;
      const ry = h * 0.38;
      return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
    }

    function drawBackground() {
      // lightweight background (no heavy gradients per frame)
      ctx.clearRect(0, 0, w, h);

      // sky
      ctx.fillStyle = "rgba(6,14,28,1)";
      ctx.fillRect(0, 0, w, h);

      // subtle vignette (cheap)
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, 0, w, h);

      // clouds/dust overlay based on weather
      if (weather === "cloudy") {
        ctx.fillStyle = "rgba(180,190,210,0.10)";
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const x = w * (0.25 + i * 0.28);
          const y = h * 0.35;
          ctx.ellipse(x, y, w * 0.18, h * 0.13, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (weather === "dusty") {
        ctx.fillStyle = "rgba(200,170,120,0.08)";
        ctx.fillRect(0, 0, w, h);
      }

      // ground
      ctx.fillStyle = "rgba(8,18,36,1)";
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    }

    function drawSun(p) {
      // glow cheap: two circles
      ctx.beginPath();
      ctx.fillStyle = "rgba(255,220,140,0.18)";
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "rgba(255,210,120,0.95)";
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawPanel(x, y, rot, label, statusColor, statusText) {
      // mount
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 38);
      ctx.stroke();

      // panel body
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      const pw = 110, ph = 44;
      ctx.fillStyle = "rgba(40,70,120,0.35)";
      ctx.strokeStyle = "rgba(180,220,255,0.18)";
      ctx.lineWidth = 2;
      roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 8);
      ctx.fill(); ctx.stroke();

      // simple grid
      ctx.strokeStyle = "rgba(180,220,255,0.10)";
      ctx.lineWidth = 1;
      for (let i = -pw/2 + 10; i < pw/2; i += 14) {
        ctx.beginPath();
        ctx.moveTo(i, -ph/2 + 6);
        ctx.lineTo(i, ph/2 - 6);
        ctx.stroke();
      }
      ctx.restore();

      // label
      ctx.fillStyle = "rgba(230,240,255,0.9)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(label, x - 60, y + 72);

      // status
      ctx.fillStyle = statusColor;
      ctx.fillRect(x - 60, y + 82, 10, 10);
      ctx.fillStyle = "rgba(230,240,255,0.75)";
      ctx.fillText(statusText, x - 44, y + 92);
    }

    function roundRect(ctx2, x, y, w2, h2, r) {
      const rr = Math.min(r, w2 / 2, h2 / 2);
      ctx2.beginPath();
      ctx2.moveTo(x + rr, y);
      ctx2.arcTo(x + w2, y, x + w2, y + h2, rr);
      ctx2.arcTo(x + w2, y + h2, x, y + h2, rr);
      ctx2.arcTo(x, y + h2, x, y, rr);
      ctx2.arcTo(x, y, x + w2, y, rr);
      ctx2.closePath();
    }

    function panelRotationTowardsSun(panelX, panelY, sunX, sunY) {
      // rotate panel normal towards sun direction (visual only)
      const dx = sunX - panelX;
      const dy = sunY - panelY;
      const ang = Math.atan2(dy, dx);
      // panel should face sun; subtract 90° to align rectangle look
      return ang;
    }

    function computeTracking(tt) {
      const sun = sunPos(tt);

      // Fixed panel: set to a morning-optimized fixed angle (constant)
      const fixedRot = (-55) * Math.PI / 180;

      // Sensor tracker: follows sun ONLY if weather is sunny; otherwise "loses" (stops updating)
      let sensorRot;
      if (weather === "sunny") {
        sensorRot = panelRotationTowardsSun(w * 0.5, h * 0.80, sun.x, sun.y);
      } else if (weather === "cloudy") {
        // intermittent loss: follows until mid-day then drifts
        if (tt < 0.45) sensorRot = panelRotationTowardsSun(w * 0.5, h * 0.80, sun.x, sun.y);
        else sensorRot = (-35) * Math.PI / 180;
      } else {
        // dusty: dirty sensor loses earlier
        if (tt < 0.30) sensorRot = panelRotationTowardsSun(w * 0.5, h * 0.80, sun.x, sun.y);
        else sensorRot = (-20) * Math.PI / 180;
      }

      // SUNFLOWER: always follows sun
      const algoRot = panelRotationTowardsSun(w * 0.8, h * 0.80, sun.x, sun.y);

      return { sun, fixedRot, sensorRot, algoRot };
    }

    function draw(tt) {
      drawBackground();
      const { sun, fixedRot, sensorRot, algoRot } = computeTracking(tt);
      drawSun(sun);

      // positions for three systems
      const x1 = w * 0.18, x2 = w * 0.50, x3 = w * 0.82;
      const y = h * 0.84;

      // statuses
      const fixedStatus = tt > 0.55 ? ["rgba(255,110,110,0.9)", "Low capture"] : ["rgba(110,255,160,0.9)", "OK"];
      const sensorOk = (weather === "sunny") || (weather === "cloudy" && tt < 0.45) || (weather === "dusty" && tt < 0.30);
      const sensorStatus = sensorOk ? ["rgba(110,255,160,0.9)", "Tracking OK"] : ["rgba(255,200,110,0.9)", "Lost (sensor)"];
      const algoStatus = ["rgba(110,255,160,0.9)", "Stable tracking"];

      drawPanel(x1, y, fixedRot, "Fixed Panel", fixedStatus[0], fixedStatus[1]);
      drawPanel(x2, y, sensorRot, "Sensor Tracker", sensorStatus[0], sensorStatus[1]);
      drawPanel(x3, y, algoRot, "SUNFLOWER", algoStatus[0], algoStatus[1]);

      // top caption
      ctx.fillStyle = "rgba(230,240,255,0.9)";
      ctx.font = "14px system-ui, -apple-system, Segoe UI, Arial";
      const hh = Math.floor(tt * 24);
      const mm = Math.floor((tt * 24 - hh) * 60);
      const timeStr = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      ctx.fillText(`Day simulation — ${timeStr}`, 16, 22);

      // weather label
      ctx.fillStyle = "rgba(230,240,255,0.65)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillText(`Weather: ${weather}`, 16, 40);
    }

    function tick(ts) {
      if (!last) last = ts;
      const dt = ts - last;

      if (running && visible && dt >= frameInterval) {
        last = ts;
        // speed: daySeconds seconds for full cycle
        const step = dt / (daySeconds * 1000);
        t = (t + step) % 1;
        draw(t);
      } else if (!running || !visible) {
        // still draw once so it doesn't go blank
        draw(t);
        last = ts;
      }

      requestAnimationFrame(tick);
    }

    // controls
    weatherSelect?.addEventListener("change", () => { readControls(); });
    speedRange?.addEventListener("input", () => { readControls(); });
    togglePlay?.addEventListener("click", () => {
      running = !running;
      togglePlay.textContent = running ? "Pause" : "Play";
    });
    resetDemo?.addEventListener("click", () => reset());

    // visibility pause
    observeVisibility(canvas, (v) => { visible = v; });

    // resize
    const onResize = () => {
      ({ ctx, w, h } = setupHiDPICanvas(canvas));
      draw(t);
    };
    window.addEventListener("resize", () => {
      // small debounce
      clearTimeout(window.__demoResizeT);
      window.__demoResizeT = setTimeout(onResize, 120);
    });

    readControls();
    draw(t);
    requestAnimationFrame(tick);
  }

  // ---------- 5) Web calculator (Sun position) ----------
  function initCalculator() {
    // IDs can be yours; this supports both old and new naming patterns
    const dateInput = $("#dateInput") || $("#calcDate");
    const timeInput = $("#timeInput") || $("#calcTime");
    const latInput = $("#latInput") || $("#calcLat");
    const lonInput = $("#lonInput") || $("#calcLon");
    const tzInput  = $("#tzInput")  || $("#calcTz");
    const out      = $("#result")   || $("#calcResult");
    const canvas   = $("#chart")    || $("#altitudeCanvas");
    const btn      = $("#calcBtn")  || $("#computeBtn") || $("#calcCompute");
    const demoBtn  = $("#useDemo")  || $("#useUKDemo")  || $("#useUstDemo");

    // If calculator block not present — skip
    if (!dateInput || !timeInput || !latInput || !lonInput || !tzInput || !out || !canvas) return;

    const degToRad = (deg) => deg * Math.PI / 180;
    const radToDeg = (rad) => rad * 180 / Math.PI;

    function dayOfYearUTC(d) {
      const start = Date.UTC(d.getUTCFullYear(), 0, 0);
      const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return Math.floor((now - start) / 86400000);
    }

    function compute(date, lat, lon, tz) {
      const n = dayOfYearUTC(date);
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();

      const gamma = 2 * Math.PI / 365 * (n - 1 + (hour - 12) / 24);

      const eqtime = 229.18 * (
        0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
        - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
      );

      const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
        - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
        - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

      const timeOffset = eqtime + 4 * lon - 60 * tz;
      const tst = hour * 60 + minute + second / 60 + timeOffset;
      const ha = (tst / 4) - 180;

      const haRad = degToRad(ha);
      const latRad = degToRad(lat);

      const cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
      const zenith = radToDeg(Math.acos(clamp(cosZenith, -1, 1)));
      const altitude = 90 - zenith;

      // azimuth
      const sinAz = -(Math.sin(latRad) * Math.cos(decl) - Math.sin(decl) * Math.cos(latRad) * Math.cos(haRad))
        / Math.sin(Math.acos(clamp(cosZenith, -1, 1)));
      const cosAz = (Math.sin(decl) - Math.sin(latRad) * cosZenith)
        / (Math.cos(latRad) * Math.sin(Math.acos(clamp(cosZenith, -1, 1))));

      let azimuth = radToDeg(Math.atan2(sinAz, cosAz));
      if (azimuth < 0) azimuth += 360;

      const solarNoonMin = 720 - 4 * lon - eqtime;
      const snoonH = Math.floor(solarNoonMin / 60);
      const snoonM = Math.floor(solarNoonMin % 60);

      return {
        n, gamma, eqtime, decl,
        timeOffset, tst, ha,
        zenith, azimuth, altitude,
        solarNoon: `${String(snoonH).padStart(2, "0")}:${String(snoonM).padStart(2, "0")}`
      };
    }

    function drawAltitudeChart(lat, lon, tz, date) {
      const { ctx, w, h } = setupHiDPICanvas(canvas);

      // background
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(10,18,36,1)";
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Arial";
      ctx.fillStyle = "rgba(255,255,255,0.75)";

      for (let alt = 0; alt <= 90; alt += 30) {
        const y = h - (alt / 100) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillText(`${alt}°`, 6, y - 4);
      }

      for (let hour = 0; hour <= 24; hour += 6) {
        const x = (hour / 24) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.fillText(`${hour}:00`, x + 4, h - 8);
      }

      // curve (step 15 min)
      const points = [];
      for (let hh = 0; hh <= 24; hh += 0.25) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setHours(Math.floor(hh), Math.floor((hh % 1) * 60), 0, 0);
        const res = compute(d, lat, lon, tz);
        const alt = res.altitude;

        const x = (hh / 24) * w;
        const y = h - ((alt + 10) / 100) * h; // shift up slightly
        points.push({ x, y });
      }

      ctx.beginPath();
      ctx.strokeStyle = "rgba(120,220,255,0.9)";
      ctx.lineWidth = 2;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    function run() {
      const dateStr = dateInput.value;
      const timeStr = timeInput.value;
      const lat = parseFloat(latInput.value);
      const lon = parseFloat(lonInput.value);
      const tz = parseFloat(tzInput.value);

      if (!dateStr || !timeStr || !Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(tz)) {
        out.textContent = "Please fill Date, Time, Latitude, Longitude, and Time zone.";
        return;
      }

      const date = new Date(`${dateStr}T${timeStr}:00`);
      const r = compute(date, lat, lon, tz);

      out.textContent =
        `Equation of Time: ${r.eqtime.toFixed(2)} min\n` +
        `Declination: ${radToDeg(r.decl).toFixed(2)}°\n` +
        `Time correction: ${r.timeOffset.toFixed(2)} min\n` +
        `True Solar Time: ${r.tst.toFixed(2)} min\n` +
        `Hour angle: ${r.ha.toFixed(2)}°\n` +
        `Zenith angle: ${r.zenith.toFixed(2)}°\n` +
        `Azimuth: ${r.azimuth.toFixed(2)}°\n` +
        `Solar altitude: ${r.altitude.toFixed(2)}°\n` +
        `Solar noon: ${r.solarNoon}`;

      drawAltitudeChart(lat, lon, tz, date);
    }

    // default demo values (Ust-Kamenogorsk)
    function setDemo() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      dateInput.value = `${yyyy}-${mm}-${dd}`;
      timeInput.value = "12:00";
      latInput.value = "49.946";
      lonInput.value = "82.604";
      tzInput.value = "5";
      run();
    }

    btn?.addEventListener("click", run);
    demoBtn?.addEventListener("click", setDemo);

    // Render once with demo if empty
    if (!dateInput.value || !timeInput.value) setDemo();
    else run();
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initClimateChart();
    initBars();
    initFormulaPanel();
    initTrackingDemo();
    initCalculator();
  });

})();
