// Simple bar chart renderer (no external libraries)

function renderBars(containerId, items, maxValue){

  const container = document.getElementById(containerId);
  if(!container) return;

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


// ------------------ DATA ------------------

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


// ------------------ RENDER ------------------

document.addEventListener("DOMContentLoaded", () => {

  // Energy chart
  renderBars("energyBars", energyData, 1800);

  // Cost chart
  renderBars("costBars", costData, 1600);

});

