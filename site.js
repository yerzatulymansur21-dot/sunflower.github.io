/* ======================================================
   SUNFLOWER — site.js (STABLE VERSION)
   Optimized for Desktop + Mobile
====================================================== */

"use strict";

/* ------------------ Utils ------------------ */

function isMobileLike(){
  return window.innerWidth < 900 || navigator.userAgent.match(/Android|iPhone|iPad/i);
}

/* ------------------ Climate Chart ------------------ */

document.addEventListener("DOMContentLoaded", () => {

  if(window.Chart){
    const canvas = document.getElementById("tempChartCanvas");
    if(canvas){

      const ctx = canvas.getContext("2d");

      new Chart(ctx, {
        type: "line",
        data: {
          labels: [
            "1980","1990","2000","2010","2020","2024"
          ],
          datasets: [{
            label: "Global Temp Anomaly (°C)",
            data: [-0.1,0.1,0.3,0.6,0.9,1.1],
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{ legend:{ display:false }},
          scales:{
            y:{ title:{ display:true, text:"°C"}}
          }
        }
      });
    }
  }

  initTrackerDemo();
});


/* ======================================================
   TRACKING DEMO (FIXED / SENSOR / SUNFLOWER)
====================================================== */

function initTrackerDemo(){

  const canvas = document.getElementById("trackerDemo");
  if(!canvas) return;

  const ctx = canvas.getContext("2d");

  /* UI */
  const weatherSel = document.getElementById("weatherSelect");
  const speedRange = document.getElementById("speedRange");
  const speedVal = document.getElementById("speedVal");
  const btnToggle = document.getElementById("togglePlay");
  const btnReset = document.getElementById("resetDemo");

  /* State */
  let t = 0;                 // 0..1 day
  let running = true;
  let lastTs = performance.now();

  let secondsPerDay = 12;

  let demoVisible = true;

  /* Resize */

  function resize(){
    const r = canvas.getBoundingClientRect();
    canvas.width  = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }

  resize();
  window.addEventListener("resize", resize);


  /* Intersection observer */

  if("IntersectionObserver" in window){
    const obs = new IntersectionObserver(e=>{
      demoVisible = e[0].isIntersecting;
    },{ threshold:0.2 });

    obs.observe(canvas);
  }


  /* Controls */

  function updateSpeed(){
    secondsPerDay = parseInt(speedRange.value,10);
    speedVal.textContent = secondsPerDay;
  }

  updateSpeed();
  speedRange.addEventListener("input", updateSpeed);

  btnToggle.addEventListener("click", ()=>{
    running = !running;
    btnToggle.textContent = running ? "Pause" : "Play";
  });

  btnReset.addEventListener("click", ()=>{
    t = 0;
  });


  /* Math */

  function sunPos(tt){
    const x = tt * Math.PI * 2;
    return {
      x: Math.cos(x-Math.PI/2),
      y: Math.sin(x-Math.PI/2)
    };
  }


  /* Drawing */

  function draw(){

    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;

    ctx.clearRect(0,0,w,h);

    ctx.fillStyle = "#050a18";
    ctx.fillRect(0,0,w,h);

    const pad = 20;
    const boxW = (w - pad*4)/3;
    const boxH = h - pad*2;

    const boxes = [
      {x:pad, y:pad, title:"Fixed Panel"},
      {x:pad*2+boxW, y:pad, title:"Sensor Tracker"},
      {x:pad*3+boxW*2, y:pad, title:"SUNFLOWER"}
    ];

    const sun = sunPos(t);

    const weather = weatherSel.value;

    boxes.forEach((b,i)=>{

      ctx.save();

      /* Panel box */
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x,b.y,boxW,boxH);

      ctx.fillStyle="#fff";
      ctx.font="14px Segoe UI";
      ctx.fillText(b.title,b.x+8,b.y+18);

      const cx = b.x + boxW/2;
      const cy = b.y + boxH/2;

      /* Sun path */

      ctx.strokeStyle="rgba(255,255,255,.15)";
      ctx.beginPath();

      for(let i=0;i<=100;i++){
        const s = sunPos(i/100);
        const px = cx + s.x*boxW*.35;
        const py = cy - s.y*boxH*.35;
        if(i===0) ctx.moveTo(px,py);
        else ctx.lineTo(px,py);
      }

      ctx.stroke();

      /* Sun */

      const sx = cx + sun.x*boxW*.35;
      const sy = cy - sun.y*boxH*.35;

      ctx.fillStyle="#ffd66b";
      ctx.beginPath();
      ctx.arc(sx,sy,6,0,Math.PI*2);
      ctx.fill();


      /* Panel */

      let ang = 0;

      if(i===0){
        ang = -0.3;
      }

      if(i===1){

        if(weather==="sunny"){
          ang = Math.atan2(sy-cy,sx-cx);
        }else{
          ang = -0.4;
        }
      }

      if(i===2){
        ang = Math.atan2(sy-cy,sx-cx);
      }

      ctx.translate(cx,cy+boxH*.32);
      ctx.rotate(ang);

      ctx.fillStyle =
        i===2 ? "#2ecc71" :
        i===1 ? "#4da3ff" :
        "#ff6b6b";

      ctx.fillRect(-40,-6,80,12);

      ctx.restore();

    });
  }


  /* Animation Loop (FIXED FPS) */

  const targetFrameMs = isMobileLike() ? 33 : 16;

  let accumMs = 0;
  let lastDrawTs = performance.now();

  function tick(ts){

    const dt = Math.min(0.05,(ts-lastTs)/1000);
    lastTs = ts;

    if(demoVisible && running){

      const rate = 1 / Math.max(4,secondsPerDay);

      t += dt*rate;

      if(t>1) t-=1;
    }

    /* FPS throttle */

    accumMs += (ts-lastDrawTs);
    lastDrawTs = ts;

    if(accumMs >= targetFrameMs){
      draw();
      accumMs = 0;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

}


/* ======================================================
   FORMULA PANEL
====================================================== */

(function(){

  const panel = document.getElementById("formulaPanel");
  if(!panel) return;

  const title = document.getElementById("panelTitle");
  const body  = document.getElementById("panelBody");
  const close = document.getElementById("panelClose");

  const data = {
    gamma:{
      t:"Fractional year",
      b:"Defines Earth position in orbit."
    },
    et:{
      t:"Equation of Time",
      b:"Corrects clock time."
    },
    delta:{
      t:"Declination",
      b:"Solar tilt angle."
    },
    tf:{
      t:"Time factor",
      b:"Longitude correction."
    },
    tst:{
      t:"True solar time",
      b:"Local solar clock."
    },
    ha:{
      t:"Hour angle",
      b:"Angular time."
    },
    phi:{
      t:"Zenith",
      b:"Sun vertical angle."
    },
    theta:{
      t:"Azimuth",
      b:"Horizontal direction."
    },
    sr:{
      t:"Sunrise/Sunset",
      b:"Day boundaries."
    },
    snoon:{
      t:"Solar noon",
      b:"Highest sun."
    },
    dalpha:{
      t:"Angular error",
      b:"Tracking deviation."
    }
  };

  document.querySelectorAll(".formulaTile").forEach(btn=>{

    btn.addEventListener("click",()=>{

      const id = btn.dataset.formula;

      if(!data[id]) return;

      title.textContent = data[id].t;

      body.innerHTML = `
        <p>${data[id].b}</p>
        <p class="small">Details loaded from site.js</p>
      `;

      panel.classList.remove("hidden");
    });

  });

  close.addEventListener("click",()=>{
    panel.classList.add("hidden");
  });

})();
