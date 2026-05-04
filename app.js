const money = n => (Number(n)||0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const num = id => Number(document.getElementById(id)?.value || 0);
const pct = id => num(id)/100;

const roles = [
  {name:'Welders', people:1, days:1, hours:8, rate:0, otHrs:0, otRate:0, satDays:0, satRate:0, sunDays:0, sunRate:0},
  {name:'Pipe Fitters', people:0, days:0, hours:8, rate:0, otHrs:0, otRate:0, satDays:0, satRate:0, sunDays:0, sunRate:0},
  {name:'Rigging', people:0, days:0, hours:8, rate:0, otHrs:0, otRate:0, satDays:0, satRate:0, sunDays:0, sunRate:0},
  {name:'General Laborers', people:0, days:0, hours:8, rate:0, otHrs:0, otRate:0, satDays:0, satRate:0, sunDays:0, sunRate:0},
];

function makeInput(value, cls, step='0.01'){
  return `<input class="${cls}" type="number" min="0" step="${step}" value="${value}">`;
}

function addTubeRow(data = {}) {
  const tbody = document.getElementById('tubeBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <select class="tube-size">
        ${['1"','1.5"','2"','2.5"','3"','4"','Custom'].map(s=>`<option ${data.size===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </td>
    <td>${makeInput(data.runFt ?? 0,'run-ft')}</td>
    <td>${makeInput(data.stickFt ?? 20,'stick-ft')}</td>
    <td>${makeInput(data.elbows ?? 0,'elbows','1')}</td>
    <td>${makeInput(data.tees ?? 0,'tees','1')}</td>
    <td>${makeInput(data.ferrules ?? 0,'ferrules','1')}</td>
    <td>${makeInput(data.hangers ?? 0,'hangers','1')}</td>
    <td>${makeInput(data.triClamps ?? 0,'tri-clamps','1')}</td>
    <td>${makeInput(data.gaskets ?? 0,'gaskets','1')}</td>
    <td>${makeInput(data.weldMin ?? 20,'weld-min')}</td>
    <td>${makeInput(data.tubeCost ?? 0,'tube-cost')}</td>
    <td>${makeInput(data.elbowCost ?? 0,'elbow-cost')}</td>
    <td>${makeInput(data.teeCost ?? 0,'tee-cost')}</td>
    <td>${makeInput(data.ferruleCost ?? 0,'ferrule-cost')}</td>
    <td>${makeInput(data.hangerCost ?? 0,'hanger-cost')}</td>
    <td>${makeInput(data.triClampCost ?? 0,'tri-clamp-cost')}</td>
    <td>${makeInput(data.gasketCost ?? 0,'gasket-cost')}</td>
    <td class="calc tube-row-cost">$0.00</td>
    <td class="calc fitting-row-cost">$0.00</td>
    <td class="calc clamp-gasket-row-cost">$0.00</td>
    <td class="calc material-row">$0.00</td>
    <td class="calc weld-count">0</td>
    <td class="calc weld-hours">0.00</td>
    <td><button type="button" class="remove" onclick="this.closest('tr').remove(); calculate()">X</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll('input,select').forEach(el => el.addEventListener('input', calculate));
  calculate();
}

function addExtraPartRow(data = {}) {
  const tbody = document.getElementById('extraPartsBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="part-desc wide-input" type="text" value="${data.desc ?? ''}" placeholder="Example: Pump, valve, reducer, rental, misc"></td>
    <td>
      <select class="part-category">
        ${['Pump','Valve','Instrument','Rental','Misc'].map(c=>`<option ${data.category===c?'selected':''}>${c}</option>`).join('')}
      </select>
    </td>
    <td>${makeInput(data.qty ?? 1,'part-qty','1')}</td>
    <td>${makeInput(data.unitCost ?? 0,'part-unit-cost')}</td>
    <td class="calc part-total">$0.00</td>
    <td><button type="button" class="remove" onclick="this.closest('tr').remove(); calculate()">X</button></td>
  `;
  tbody.appendChild(tr);
  tr.querySelectorAll('input,select').forEach(el => el.addEventListener('input', calculate));
  calculate();
}

function buildLaborRows(){
  const tbody = document.getElementById('laborBody');
  tbody.innerHTML = '';
  roles.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.name}</strong></td>
      <td>${makeInput(r.people,`labor-people-${i}`,'1')}</td>
      <td>${makeInput(r.days,`labor-days-${i}`)}</td>
      <td>${makeInput(r.hours,`labor-hours-${i}`)}</td>
      <td>${makeInput(r.rate,`labor-rate-${i}`)}</td>
      <td>${makeInput(r.otHrs,`labor-ot-hours-${i}`)}</td>
      <td>${makeInput(r.otRate,`labor-ot-rate-${i}`)}</td>
      <td>${makeInput(r.satDays,`labor-sat-days-${i}`)}</td>
      <td>${makeInput(r.satRate,`labor-sat-rate-${i}`)}</td>
      <td>${makeInput(r.sunDays,`labor-sun-days-${i}`)}</td>
      <td>${makeInput(r.sunRate,`labor-sun-rate-${i}`)}</td>
      <td class="calc labor-total-${i}">$0.00</td>
    `;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('input').forEach(el => el.addEventListener('input', calculate));
}

function calculateTubeRows(){
  let totalWelds = 0, totalWeldHours = 0, tubeMaterial = 0, fittingMaterial = 0, clampGasketMaterial = 0;

  document.querySelectorAll('#tubeBody tr').forEach(tr => {
    const runFt = Number(tr.querySelector('.run-ft').value)||0;
    const stickFt = Number(tr.querySelector('.stick-ft').value)||20;
    const elbows = Number(tr.querySelector('.elbows').value)||0;
    const tees = Number(tr.querySelector('.tees').value)||0;
    const ferrules = Number(tr.querySelector('.ferrules').value)||0;
    const hangers = Number(tr.querySelector('.hangers').value)||0;
    const triClamps = Number(tr.querySelector('.tri-clamps').value)||0;
    const gaskets = Number(tr.querySelector('.gaskets').value)||0;
    const weldMin = Number(tr.querySelector('.weld-min').value)||0;

    const straightWelds = runFt > 0 ? Math.max(0, Math.ceil(runFt / stickFt) - 1) : 0;
    const welds = (elbows*2) + (tees*3) + ferrules + hangers + straightWelds;
    const weldHours = welds * weldMin / 60;

    const rowTubeCost = runFt * (Number(tr.querySelector('.tube-cost').value)||0);
    const rowFittingCost =
      elbows * (Number(tr.querySelector('.elbow-cost').value)||0) +
      tees * (Number(tr.querySelector('.tee-cost').value)||0) +
      ferrules * (Number(tr.querySelector('.ferrule-cost').value)||0) +
      hangers * (Number(tr.querySelector('.hanger-cost').value)||0);

    const rowClampGasketCost =
      triClamps * (Number(tr.querySelector('.tri-clamp-cost').value)||0) +
      gaskets * (Number(tr.querySelector('.gasket-cost').value)||0);

    const rowMaterial = rowTubeCost + rowFittingCost + rowClampGasketCost;

    tr.querySelector('.tube-row-cost').textContent = money(rowTubeCost);
    tr.querySelector('.fitting-row-cost').textContent = money(rowFittingCost);
    tr.querySelector('.clamp-gasket-row-cost').textContent = money(rowClampGasketCost);
    tr.querySelector('.material-row').textContent = money(rowMaterial);
    tr.querySelector('.weld-count').textContent = welds.toFixed(0);
    tr.querySelector('.weld-hours').textContent = weldHours.toFixed(2);

    totalWelds += welds;
    totalWeldHours += weldHours;
    tubeMaterial += rowTubeCost;
    fittingMaterial += rowFittingCost;
    clampGasketMaterial += rowClampGasketCost;
  });

  return {totalWelds, totalWeldHours, tubeMaterial, fittingMaterial, clampGasketMaterial};
}

function calculateExtraParts(){
  let total = 0;
  document.querySelectorAll('#extraPartsBody tr').forEach(tr => {
    const qty = Number(tr.querySelector('.part-qty').value)||0;
    const unit = Number(tr.querySelector('.part-unit-cost').value)||0;
    const rowTotal = qty * unit;
    tr.querySelector('.part-total').textContent = money(rowTotal);
    total += rowTotal;
  });
  return total;
}

function calculateLabor(){
  let cost = 0, hours = 0, people = 0;
  roles.forEach((r, i) => {
    const p = Number(document.querySelector(`.labor-people-${i}`).value)||0;
    const d = Number(document.querySelector(`.labor-days-${i}`).value)||0;
    const h = Number(document.querySelector(`.labor-hours-${i}`).value)||0;
    const rate = Number(document.querySelector(`.labor-rate-${i}`).value)||0;
    const otH = Number(document.querySelector(`.labor-ot-hours-${i}`).value)||0;
    const otRate = Number(document.querySelector(`.labor-ot-rate-${i}`).value)||0;
    const satD = Number(document.querySelector(`.labor-sat-days-${i}`).value)||0;
    const satRate = Number(document.querySelector(`.labor-sat-rate-${i}`).value)||0;
    const sunD = Number(document.querySelector(`.labor-sun-days-${i}`).value)||0;
    const sunRate = Number(document.querySelector(`.labor-sun-rate-${i}`).value)||0;

    const regularHours = p*d*h;
    const otHours = p*d*otH;
    const satHours = p*satD*h;
    const sunHours = p*sunD*h;
    const total = regularHours*rate + otHours*otRate + satHours*satRate + sunHours*sunRate;

    document.querySelector(`.labor-total-${i}`).textContent = money(total);
    cost += total;
    hours += regularHours + otHours + satHours + sunHours;
    people += p;
  });
  return {cost, hours, people};
}

function calculate(){
  const tube = calculateTubeRows();
  const extraParts = calculateExtraParts();
  const labor = calculateLabor();

  const materialBeforeWaste = tube.tubeMaterial + tube.fittingMaterial + tube.clampGasketMaterial + extraParts;
  const materialCost = materialBeforeWaste * (1 + pct('wastePct'));
  const materialSell = materialCost * (1 + pct('materialMarkup'));

  const laborCost = labor.cost;
  const laborSell = laborCost * (1 + pct('laborMarkup'));
  const sundries = labor.hours * num('sundriesRate');

  const travelPeople = labor.people;
  const travelRegHours = num('travelHoursDay') * num('travelDays') * travelPeople;
  const travelOtHours = num('travelOtHoursDay') * num('travelDays') * travelPeople;
  const travelCost = travelRegHours * num('travelRate') + travelOtHours * num('travelOtRate');
  const travelSell = travelCost * (1 + pct('travelMarkup'));

  const mileage = num('milesDay') * num('travelDays') * num('mileageRate');
  const rooms = num('overnights') * num('roomCost') * travelPeople;
  const meals = num('mealDays') * num('mealRate') * travelPeople;
  const expenses = mileage + rooms + meals;

  const pmLabor = num('pmDays') * num('pmHoursDay') * num('pmRate');
  const pmMileage = num('pmMiles') * num('pmMileageRate');
  const pmRooms = num('pmOvernights') * num('pmRoomCost');
  const pmMeals = num('pmDays') * num('pmMealRate');
  const pmTotal = pmLabor + pmMileage + pmRooms + pmMeals;

  const totalCost = materialCost + laborCost + sundries + travelCost + mileage + rooms + meals + pmTotal;
  const finalSell = materialSell + laborSell + sundries + travelSell + expenses + pmTotal;
  const profit = finalSell - totalCost;
  const margin = finalSell > 0 ? profit / finalSell : 0;

  document.getElementById('sumWelds').textContent = tube.totalWelds.toFixed(0);
  document.getElementById('sumWeldHours').textContent = tube.totalWeldHours.toFixed(2);
  document.getElementById('sumTubeMaterial').textContent = money(tube.tubeMaterial);
  document.getElementById('sumFittingMaterial').textContent = money(tube.fittingMaterial);
  document.getElementById('sumClampGasketMaterial').textContent = money(tube.clampGasketMaterial);
  document.getElementById('sumExtraParts').textContent = money(extraParts);
  document.getElementById('sumMaterialCost').textContent = money(materialCost);
  document.getElementById('sumMaterialSell').textContent = money(materialSell);
  document.getElementById('sumLaborCost').textContent = money(laborCost);
  document.getElementById('sumLaborSell').textContent = money(laborSell);
  document.getElementById('sumSundries').textContent = money(sundries);
  document.getElementById('sumTravelSell').textContent = money(travelSell);
  document.getElementById('sumExpenses').textContent = money(expenses);
  document.getElementById('sumPM').textContent = money(pmTotal);
  document.getElementById('sumCost').textContent = money(totalCost);
  document.getElementById('sumProfit').textContent = money(profit);
  document.getElementById('sumMargin').textContent = (margin*100).toFixed(2) + '%';
  document.getElementById('sumFinal').textContent = money(finalSell);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('quoteDate').valueAsDate = new Date();
  buildLaborRows();
  addTubeRow({size:'1.5"', runFt:0, stickFt:20, weldMin:18});
  addTubeRow({size:'2"', runFt:0, stickFt:20, weldMin:20});
  addExtraPartRow({desc:'', category:'Valve', qty:1, unitCost:0});
  document.querySelectorAll('input,select').forEach(el => el.addEventListener('input', calculate));
  calculate();

async function saveToSharePoint() {
  const data = getAppData();

  const fileName = `Quote-${data.customer || 'Unknown'}-${Date.now()}.json`;

  await fetch(https://defaultfd6501db952940d2bfb6372e714180.92.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/53b871a031904d778e5afc598438bfa2/triggers/manual/paths/invoke?api-version=1, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fileName: fileName,
      content: JSON.stringify(data)
    })
  });

  alert("Saved to SharePoint");
}
