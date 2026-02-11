// -------------------------------
// 1) Simple bar chart renderer (no external libraries)
// -------------------------------

function renderBars(containerId, items, maxValue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    // Row
    const row = document.createElement("div");
    row.className = "barRow";

    // Label
    const label = document.createElement("div");
    label.className = "barLabel";
    label.textContent = item.label;

    // Track
    const track = document.createElement("div");
    track.className = "barTrack";

    // Fill
    const fill = document.createElement("div");
    fill.className = "barFill";

    const percent = Math.max(0, Math.min(1, item.value / maxValue));
    fill.style.width = (percent * 100).toFixed(1) + "%";

    track.appendChild(fill);

    // Value
    const value = document.createElement("div");
    value.className = "barValue";
    value.textContent = item.valueText || item.value;

    // Assemble
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);

    container.appendChild(row);
  });
}


// -------------------------------
// 2) DATA
// -------------------------------

// Energy production (kWh/kWp/year)
const energyData = [
  { label: "Fixed system", value: 1350, valueText: "1350" },
  { label: "Conventional tracker", value: 1600, valueText: "1600" },
  { label: "SUNFLOWER", value: 1700, valueText: "1700" }
];

// CAPEX cost (USD/kWp) — midpoint for bar length
const costData = [
  { label: "Fixed system", value: 1225, valueText: "1200–1250" },
  { label: "Sensor-based tracker", value: 1450, valueText: "1400–1500" },
  { label: "SUNFLOWER", value: 1400, valueText: "1350–1450" }
];

// Temperature chart (demo values for now; you can replace later with real NASA/NOAA dataset)
const temperatureData = {
  years: [1880, 1900, 1920, 1940, 1960, 1980, 1990, 2000, 2010, 2020, 2024],
  anomaly: [-0.20, -0.12, -0.05, 0.12, 0.10, 0.28, 0.45, 0.62, 0.85, 1.02, 1.40]
};


// -------------------------------
// 3) TEMPERATURE CHART (Chart.js)
// -------------------------------

function renderTemperatureChart() {
  const canvas = document.getElementById("temperatureChart");
  if (!canvas) return;

  // If Chart.js didn't load, avoid errors
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded. Add <script src='https://cdn.jsdelivr.net/npm/chart.js'></script> in index.html");
    return;
  }

  const ctx = canvas.getContext("2d");

  // Destroy old chart if re-render (safety)
  if (canvas._chartInstance) {
    canvas._chartInstance.destroy();
  }

  canvas._chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: temperatureData.years,
      datasets: [{
        label: "Global Temperature Anomaly (°C)",
        data: temperatureData.anomaly,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        // NOTE: chart colors are set here; if you want, I can align them perfectly with your CSS theme.
        borderColor: "#7ee787",
        backgroundColor: "rgba(126,231,135,0.16)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // allows chartBox to control height
      plugins: {
        legend: {
          labels: { color: "#e9eefc" }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y.toFixed(2)} °C`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#a9b5d6" },
          grid: { color: "rgba(255,255,255,0.06)" }
        },
        y: {
          ticks: { color: "#a9b5d6" },
          grid: { color: "rgba(255,255,255,0.06)" },
          title: {
            display: true,
            text: "Anomaly (°C)",
            color: "#a9b5d6"
          }
        }
      }
    }
  });
}


// -------------------------------
// 4) RENDER ON LOAD
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Bar charts
  renderBars("energyBars", energyData, 1800);
  renderBars("costBars", costData, 1600);

  // Temperature line chart
  renderTemperatureChart();
});
