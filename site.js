async function loadData(){
  const res = await fetch("data.json");
  return await res.json();
}

function fillTable(tableId, rows){
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = "";
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    r.forEach(cell=>{
      const td = document.createElement("td");
      td.innerHTML = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

loadData().then(data=>{
  fillTable("capex-table", data.capex);
  fillTable("energy-table", data.energy);
  fillTable("bom-table", data.bom);
});
