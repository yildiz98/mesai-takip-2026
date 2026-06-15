const CURRENT_YEAR = new Date().getFullYear();

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const HOLIDAYS_BY_YEAR = {
  2026: [
    { date: "2026-01-01", name: "Yılbaşı", factor: 1 },
    { date: "2026-03-19", name: "Ramazan Bayramı Arifesi", factor: 0.5 },
    { date: "2026-03-20", name: "Ramazan Bayramı 1. Gün", factor: 1 },
    { date: "2026-03-21", name: "Ramazan Bayramı 2. Gün", factor: 1 },
    { date: "2026-03-22", name: "Ramazan Bayramı 3. Gün", factor: 1 },
    { date: "2026-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", factor: 1 },
    { date: "2026-05-01", name: "Emek ve Dayanışma Günü", factor: 1 },
    { date: "2026-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", factor: 1 },
    { date: "2026-05-26", name: "Kurban Bayramı Arifesi", factor: 0.5 },
    { date: "2026-05-27", name: "Kurban Bayramı 1. Gün", factor: 1 },
    { date: "2026-05-28", name: "Kurban Bayramı 2. Gün", factor: 1 },
    { date: "2026-05-29", name: "Kurban Bayramı 3. Gün", factor: 1 },
    { date: "2026-05-30", name: "Kurban Bayramı 4. Gün", factor: 1 },
    { date: "2026-07-15", name: "Demokrasi ve Millî Birlik Günü", factor: 1 },
    { date: "2026-07-20", name: "Barış ve Özgürlük Bayramı", factor: 1 },
    { date: "2026-08-01", name: "Toplumsal Direniş Bayramı", factor: 1 },
    { date: "2026-08-25", name: "Mevlid Kandili", factor: 1 },
    { date: "2026-08-30", name: "Zafer Bayramı", factor: 1 },
    { date: "2026-10-29", name: "Cumhuriyet Bayramı", factor: 1 },
    { date: "2026-11-15", name: "KKTC Cumhuriyet Bayramı", factor: 1 }
  ],

  2027: [
    { date: "2027-01-01", name: "Yılbaşı", factor: 1 },
    { date: "2027-03-08", name: "Ramazan Bayramı Arifesi", factor: 0.5 },
    { date: "2027-03-09", name: "Ramazan Bayramı 1. Gün", factor: 1 },
    { date: "2027-03-10", name: "Ramazan Bayramı 2. Gün", factor: 1 },
    { date: "2027-03-11", name: "Ramazan Bayramı 3. Gün", factor: 1 },
    { date: "2027-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", factor: 1 },
    { date: "2027-05-01", name: "Emek ve Dayanışma Günü", factor: 1 },
    { date: "2027-05-15", name: "Kurban Bayramı Arifesi", factor: 0.5 },
    { date: "2027-05-16", name: "Kurban Bayramı 1. Gün", factor: 1 },
    { date: "2027-05-17", name: "Kurban Bayramı 2. Gün", factor: 1 },
    { date: "2027-05-18", name: "Kurban Bayramı 3. Gün", factor: 1 },
    { date: "2027-05-19", name: "Kurban Bayramı 4. Gün / Atatürk'ü Anma, Gençlik ve Spor Bayramı", factor: 1 },
    { date: "2027-07-15", name: "Demokrasi ve Millî Birlik Günü", factor: 1 },
    { date: "2027-07-20", name: "Barış ve Özgürlük Bayramı", factor: 1 },
    { date: "2027-08-01", name: "Toplumsal Direniş Bayramı", factor: 1 },
    { date: "2027-08-14", name: "Mevlid Kandili", factor: 1 },
    { date: "2027-08-30", name: "Zafer Bayramı", factor: 1 },
    { date: "2027-10-29", name: "Cumhuriyet Bayramı", factor: 1 },
    { date: "2027-11-15", name: "KKTC Cumhuriyet Bayramı", factor: 1 }
  ],

  2028: [
    { date: "2028-01-01", name: "Yılbaşı", factor: 1 },
    { date: "2028-02-26", name: "Ramazan Bayramı Arifesi", factor: 0.5 },
    { date: "2028-02-27", name: "Ramazan Bayramı 1. Gün", factor: 1 },
    { date: "2028-02-28", name: "Ramazan Bayramı 2. Gün", factor: 1 },
    { date: "2028-02-29", name: "Ramazan Bayramı 3. Gün", factor: 1 },
    { date: "2028-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", factor: 1 },
    { date: "2028-05-01", name: "Emek ve Dayanışma Günü", factor: 1 },
    { date: "2028-05-04", name: "Kurban Bayramı Arifesi", factor: 0.5 },
    { date: "2028-05-05", name: "Kurban Bayramı 1. Gün", factor: 1 },
    { date: "2028-05-06", name: "Kurban Bayramı 2. Gün", factor: 1 },
    { date: "2028-05-07", name: "Kurban Bayramı 3. Gün", factor: 1 },
    { date: "2028-05-08", name: "Kurban Bayramı 4. Gün", factor: 1 },
    { date: "2028-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", factor: 1 },
    { date: "2028-07-15", name: "Demokrasi ve Millî Birlik Günü", factor: 1 },
    { date: "2028-07-20", name: "Barış ve Özgürlük Bayramı", factor: 1 },
    { date: "2028-08-01", name: "Toplumsal Direniş Bayramı", factor: 1 },
    { date: "2028-08-03", name: "Mevlid Kandili", factor: 1 },
    { date: "2028-08-30", name: "Zafer Bayramı", factor: 1 },
    { date: "2028-10-29", name: "Cumhuriyet Bayramı", factor: 1 },
    { date: "2028-11-15", name: "KKTC Cumhuriyet Bayramı", factor: 1 }
  ],

  2029: [
    { date: "2029-01-01", name: "Yılbaşı", factor: 1 },
    { date: "2029-02-13", name: "Ramazan Bayramı Arifesi", factor: 0.5 },
    { date: "2029-02-14", name: "Ramazan Bayramı 1. Gün", factor: 1 },
    { date: "2029-02-15", name: "Ramazan Bayramı 2. Gün", factor: 1 },
    { date: "2029-02-16", name: "Ramazan Bayramı 3. Gün", factor: 1 },
    { date: "2029-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı / Kurban Bayramı Arifesi", factor: 1 },
    { date: "2029-04-24", name: "Kurban Bayramı 1. Gün", factor: 1 },
    { date: "2029-04-25", name: "Kurban Bayramı 2. Gün", factor: 1 },
    { date: "2029-04-26", name: "Kurban Bayramı 3. Gün", factor: 1 },
    { date: "2029-04-27", name: "Kurban Bayramı 4. Gün", factor: 1 },
    { date: "2029-05-01", name: "Emek ve Dayanışma Günü", factor: 1 },
    { date: "2029-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", factor: 1 },
    { date: "2029-07-15", name: "Demokrasi ve Millî Birlik Günü", factor: 1 },
    { date: "2029-07-20", name: "Barış ve Özgürlük Bayramı", factor: 1 },
    { date: "2029-07-23", name: "Mevlid Kandili", factor: 1 },
    { date: "2029-08-01", name: "Toplumsal Direniş Bayramı", factor: 1 },
    { date: "2029-08-30", name: "Zafer Bayramı", factor: 1 },
    { date: "2029-10-29", name: "Cumhuriyet Bayramı", factor: 1 },
    { date: "2029-11-15", name: "KKTC Cumhuriyet Bayramı", factor: 1 }
  ],

  2030: [
    { date: "2030-01-01", name: "Yılbaşı", factor: 1 },
    { date: "2030-02-03", name: "Ramazan Bayramı Arifesi", factor: 0.5 },
    { date: "2030-02-04", name: "Ramazan Bayramı 1. Gün", factor: 1 },
    { date: "2030-02-05", name: "Ramazan Bayramı 2. Gün", factor: 1 },
    { date: "2030-02-06", name: "Ramazan Bayramı 3. Gün", factor: 1 },
    { date: "2030-04-12", name: "Kurban Bayramı Arifesi", factor: 0.5 },
    { date: "2030-04-13", name: "Kurban Bayramı 1. Gün", factor: 1 },
    { date: "2030-04-14", name: "Kurban Bayramı 2. Gün", factor: 1 },
    { date: "2030-04-15", name: "Kurban Bayramı 3. Gün", factor: 1 },
    { date: "2030-04-16", name: "Kurban Bayramı 4. Gün", factor: 1 },
    { date: "2030-04-23", name: "Ulusal Egemenlik ve Çocuk Bayramı", factor: 1 },
    { date: "2030-05-01", name: "Emek ve Dayanışma Günü", factor: 1 },
    { date: "2030-05-19", name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", factor: 1 },
    { date: "2030-07-12", name: "Mevlid Kandili", factor: 1 },
    { date: "2030-07-15", name: "Demokrasi ve Millî Birlik Günü", factor: 1 },
    { date: "2030-07-20", name: "Barış ve Özgürlük Bayramı", factor: 1 },
    { date: "2030-08-01", name: "Toplumsal Direniş Bayramı", factor: 1 },
    { date: "2030-08-30", name: "Zafer Bayramı", factor: 1 },
    { date: "2030-10-29", name: "Cumhuriyet Bayramı", factor: 1 },
    { date: "2030-11-15", name: "KKTC Cumhuriyet Bayramı", factor: 1 }
  ]
};

const HOLIDAYS = HOLIDAYS_BY_YEAR[CURRENT_YEAR] || [];

const RECORDS_KEY = `mesai_kayitlari_${CURRENT_YEAR}_sade_aciklamali`;

let records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");

function saveRecords() {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function initMonths() {
  const select = document.getElementById("monthSelect");
  const historySelect = document.getElementById("historyMonthSelect");
  select.innerHTML = "";
  if (historySelect) historySelect.innerHTML = "";

  months.forEach((m, index) => {
    const opt = document.createElement("option");
    opt.value = index + 1;
    opt.textContent = `${index + 1} - ${m}`;
    select.appendChild(opt);

    if (historySelect) {
      const historyOpt = document.createElement("option");
      historyOpt.value = index + 1;
      historyOpt.textContent = `${index + 1} - ${m}`;
      historySelect.appendChild(historyOpt);
    }
  });

  const currentMonth = new Date().getMonth() + 1;
  select.value = currentMonth;
  if (historySelect) historySelect.value = currentMonth;

  select.addEventListener("change", () => {
    if (historySelect) historySelect.value = select.value;
    render();
  });

  if (historySelect) {
    historySelect.addEventListener("change", () => {
      select.value = historySelect.value;
      render();
      document.getElementById("history-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function selectedMonth() {
  return Number(document.getElementById("monthSelect").value);
}

function parseDate(dateText) {
  return new Date(dateText + "T00:00:00");
}

function getMonth(dateText) {
  return parseDate(dateText).getMonth() + 1;
}

function isHoliday(dateText) {
  return HOLIDAYS.some(h => h.date === dateText);
}

function isWeekend(dateText) {
  const d = parseDate(dateText).getDay();
  return d === 0 || d === 6;
}

function getType(dateText) {
  if (isHoliday(dateText) || isWeekend(dateText)) return "Hafta Sonu";
  return "Hafta İçi";
}

function getMultiplier(dateText) {
  return getType(dateText) === "Hafta İçi" ? 1.10 : 1.50;
}

function getValue(record) {
  return Number(record.hours) * getMultiplier(record.date);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addRecord() {
  const date = document.getElementById("dateInput").value;
  const hours = parseFloat(document.getElementById("hoursInput").value);
  const description = document.getElementById("descInput").value.trim();

  if (!date) return alert("Tarih gir.");
  if (isNaN(hours)) return alert("Mesai değerini sayı olarak gir.");

  records.push({ id: Date.now(), date, hours, description });
  saveRecords();

  document.getElementById("dateInput").value = "";
  document.getElementById("hoursInput").value = "";
  document.getElementById("descInput").value = "";

  render();
}

function deleteRecord(id) {
  if (!confirm("Kaydı silmek istiyor musun?")) return;
  records = records.filter(r => r.id !== id);
  saveRecords();
  render();
}

function datesOfMonth(month) {
  const dates = [];
  let d = new Date(CURRENT_YEAR, month - 1, 1);

  while (d.getMonth() === month - 1) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }

  return dates;
}

function getHolidayFactor(dateText) {
  const sameDay = HOLIDAYS.filter(x => x.date === dateText);
  if (sameDay.length === 0) return 0;
  return Math.max(...sameDay.map(x => Number(x.factor)));
}

function getTarget(month) {
  let normalHours = 0;

  datesOfMonth(month).forEach(date => {
    const d = parseDate(date).getDay();
    const holidayFactor = getHolidayFactor(date);
    const workPart = Math.max(0, 1 - holidayFactor);

    if (d === 4) {
      normalHours += 9.5 * workPart;
    } else if (d >= 1 && d <= 5) {
      normalHours += 7.5 * workPart;
    }
  });

  return normalHours * 0.25;
}

function getTotals(month) {
  const monthRecords = records.filter(r => getMonth(r.date) === month);

  let weekday = 0;
  let weekend = 0;
  let weighted = 0;

  monthRecords.forEach(r => {
    const value = getValue(r);
    weighted += value;

    if (getType(r.date) === "Hafta İçi") {
      weekday += value;
    } else {
      weekend += value;
    }
  });

  return { weekday, weekend, weighted };
}

function selectMonth(month) {
  const select = document.getElementById("monthSelect");
  const historySelect = document.getElementById("historyMonthSelect");
  if (select) select.value = month;
  if (historySelect) historySelect.value = month;
  render();
}

function renderSideMonths(selected) {
  const list = document.getElementById("sideMonthList");
  if (!list) return;

  list.innerHTML = "";
  months.forEach((name, index) => {
    const month = index + 1;
    const target = getTarget(month);
    const totals = getTotals(month);
    const remaining = target - totals.weighted;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `month-item ${month === selected ? "active" : ""}`;
    btn.onclick = () => {
      selectMonth(month);
      document.getElementById("records-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    btn.innerHTML = `
      <strong><span>${name}</span><span>${target.toFixed(2)}</span></strong>
      <small>Girilen: ${totals.weighted.toFixed(2)} • ${remaining >= 0 ? "Kalan" : "Aşım"}: ${Math.abs(remaining).toFixed(2)}</small>
    `;
    list.appendChild(btn);
  });
}

function renderHistoryDetail(month) {
  const box = document.getElementById("historyDetail");
  if (!box) return;

  const monthRecords = records
    .filter(r => getMonth(r.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date));
  const target = getTarget(month);
  const totals = getTotals(month);
  const remaining = target - totals.weighted;

  if (monthRecords.length === 0) {
    box.innerHTML = `
      <div class="history-card">
        <strong>${months[month - 1]} ayı özeti</strong><br>
        Yapılacak mesai: ${target.toFixed(2)} • Girilen mesai: ${totals.weighted.toFixed(2)} • Kalan: ${Math.max(0, remaining).toFixed(2)}
        <p class="small">Bu aya ait kayıt bulunmuyor.</p>
      </div>
    `;
    return;
  }

  const rows = monthRecords.map(r => `
    <tr>
      <td>${formatDate(r.date)}</td>
      <td>${getType(r.date)}</td>
      <td>${Number(r.hours).toFixed(2)}</td>
      <td>${getMultiplier(r.date).toFixed(2)}</td>
      <td>${getValue(r).toFixed(2)}</td>
      <td class="desc">${escapeHtml(r.description || "-")}</td>
    </tr>
  `).join("");

  box.innerHTML = `
    <div class="history-card">
      <strong>${months[month - 1]} ayı detaylı geçmişi</strong><br>
      Yapılacak mesai: ${target.toFixed(2)} • Girilen mesai: ${totals.weighted.toFixed(2)} • ${remaining >= 0 ? "Kalan" : "Limit aşımı"}: ${Math.abs(remaining).toFixed(2)}
    </div>
    <div class="wide">
      <table>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Tür</th>
            <th>Saat</th>
            <th>Çarpan</th>
            <th>Değer</th>
            <th>Açıklama</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function render() {
  const month = selectedMonth();
  const target = getTarget(month);
  const totals = getTotals(month);

  document.getElementById("targetTotal").textContent = target.toFixed(2);
  document.getElementById("weightedTotal").textContent = totals.weighted.toFixed(2);

  const statusBox = document.getElementById("statusBox");

  if (totals.weighted > target) {
    statusBox.className = "status warn";
    statusBox.textContent = `Limit aşıldı: ${(totals.weighted - target).toFixed(2)}`;
  } else {
    statusBox.className = "status ok";
    statusBox.textContent = `Uygun. Kalan: ${(target - totals.weighted).toFixed(2)}`;
  }

  renderRecords(month);
  renderSummary();
  renderDashboard(month, target, totals);
  renderSideMonths(month);
  renderHistoryDetail(month);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderDashboard(month, target, totals) {
  const recordCountEl = document.getElementById("dashRecordCount");
  const monthTotalEl = document.getElementById("dashMonthTotal");
  const remainingEl = document.getElementById("dashRemaining");
  const lastDateEl = document.getElementById("dashLastDate");

  if (!recordCountEl || !monthTotalEl || !remainingEl || !lastDateEl) return;

  const remaining = target - totals.weighted;
  const percent = target > 0 ? Math.min(100, Math.max(0, (totals.weighted / target) * 100)) : 0;
  const last = records.length
    ? [...records].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : "";

  recordCountEl.textContent = records.length;
  monthTotalEl.textContent = totals.weighted.toFixed(2);
  remainingEl.textContent = remaining >= 0 ? remaining.toFixed(2) : `+${Math.abs(remaining).toFixed(2)}`;
  lastDateEl.textContent = last ? formatDate(last) : "-";

  setText("dashTargetTotal", target.toFixed(2));
  setText("dashWeekdayTotal", totals.weekday.toFixed(2));
  setText("dashWeekendTotal", totals.weekend.toFixed(2));
  setText("dashMonthTotalTop", totals.weighted.toFixed(2));
  setText("dashRemainingTop", remaining >= 0 ? remaining.toFixed(2) : `+${Math.abs(remaining).toFixed(2)}`);
  setText("dashPercent", `%${percent.toFixed(0)}`);
  setText("progressPercent", `%${percent.toFixed(1)}`);
  setText("quickTarget", target.toFixed(2));
  setText("quickEntered", totals.weighted.toFixed(2));
  setText("quickRemain", Math.max(0, remaining).toFixed(2));
  setText("donutTotal", totals.weighted.toFixed(2));
  setText("donutWeekday", totals.weekday.toFixed(2));
  setText("donutWeekend", totals.weekend.toFixed(2));
  setText("donutCount", records.filter(r => getMonth(r.date) === month).length);

  renderCharts(month, target, totals, percent);
}


function chartCtx(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  return canvas.getContext("2d");
}

function clearCanvas(ctx) {
  if (!ctx) return;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawLineChart(id, labels, datasets) {
  const ctx = chartCtx(id);
  if (!ctx) return;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  clearCanvas(ctx);
  const pad = 46;
  const max = Math.max(10, ...datasets.flatMap(d => d.values)) * 1.18;

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(248,250,252,.85)";
  ctx.font = "12px Arial";
  for (let i = 0; i <= 4; i++) {
    const y = pad + ((h - pad * 2) / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - 18, y); ctx.stroke();
    const value = Math.round(max - (max / 4) * i);
    ctx.fillText(value, 10, y + 4);
  }

  const step = (w - pad - 25) / Math.max(1, labels.length - 1);
  labels.forEach((label, i) => {
    const x = pad + step * i;
    ctx.fillStyle = "rgba(248,250,252,.9)";
    ctx.fillText(label.slice(0,3), x - 10, h - 14);
  });

  datasets.forEach(ds => {
    ctx.strokeStyle = ds.color;
    ctx.fillStyle = ds.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ds.values.forEach((value, i) => {
      const x = pad + step * i;
      const y = h - pad - (value / max) * (h - pad * 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ds.values.forEach((value, i) => {
      const x = pad + step * i;
      const y = h - pad - (value / max) * (h - pad * 2);
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
    });
  });
}

function drawBarChart(id, labels, targets, entered) {
  const ctx = chartCtx(id);
  if (!ctx) return;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  clearCanvas(ctx);
  const pad = 46;
  const max = Math.max(10, ...targets, ...entered) * 1.25;
  const group = (w - pad - 30) / labels.length;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  for (let i=0;i<=4;i++){
    const y = pad + ((h-pad*2)/4)*i;
    ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-18,y); ctx.stroke();
  }
  labels.forEach((label,i)=>{
    const x = pad + group*i + group*.18;
    const bw = group*.24;
    const th = (targets[i]/max)*(h-pad*2);
    const eh = (entered[i]/max)*(h-pad*2);
    ctx.fillStyle = "#f4b000"; ctx.fillRect(x, h-pad-th, bw, th);
    ctx.fillStyle = "#22c55e"; ctx.fillRect(x+bw+6, h-pad-eh, bw, eh);
    ctx.fillStyle = "rgba(248,250,252,.9)"; ctx.font = "12px Arial"; ctx.fillText(label.slice(0,3), x, h-14);
  });
}

function drawProgress(id, percent) {
  const ctx = chartCtx(id);
  if (!ctx) return;
  const w=ctx.canvas.width, h=ctx.canvas.height;
  clearCanvas(ctx);
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-18;
  ctx.lineWidth=22;
  ctx.strokeStyle="rgba(255,255,255,.12)";
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle="#f4b000";
  ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2, -Math.PI/2 + Math.PI*2*(percent/100)); ctx.stroke();
}

function drawDonut(id, weekday, weekend) {
  const ctx = chartCtx(id);
  if (!ctx) return;
  const w=ctx.canvas.width, h=ctx.canvas.height;
  clearCanvas(ctx);
  const total = Math.max(weekday + weekend, 0.01);
  const cx=w/2, cy=h/2, r=Math.min(w,h)/2-18;
  let start=-Math.PI/2;
  [[weekday,"#22c55e"],[weekend,"#f4b000"]].forEach(part=>{
    const end = start + Math.PI*2*(part[0]/total);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath();
    ctx.fillStyle=part[1]; ctx.fill();
    start=end;
  });
  ctx.beginPath(); ctx.arc(cx,cy,r*.58,0,Math.PI*2); ctx.fillStyle="#081b35"; ctx.fill();
}

function renderCharts(month, target, totals, percent) {
  const targets = months.map((_, i) => getTarget(i + 1));
  const entered = months.map((_, i) => getTotals(i + 1).weighted);
  const remaining = targets.map((t, i) => Math.max(0, t - entered[i]));
  drawLineChart("monthlyChart", months, [
    { values: targets, color: "#f4b000" },
    { values: entered, color: "#22c55e" },
    { values: remaining, color: "#60a5fa" }
  ]);

  const start = Math.max(0, month - 6);
  const labels = months.slice(start, month);
  drawBarChart("lastSixChart", labels, targets.slice(start, month), entered.slice(start, month));
  drawProgress("progressChart", percent);
  drawDonut("donutChart", totals.weekday, totals.weekend);
}

function renderRecords(month) {
  const table = document.getElementById("recordsTable");
  if (table) table.innerHTML = "";

  const monthRecords = records
    .filter(r => getMonth(r.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date));

  monthRecords.forEach(r => {
    if (!table) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDate(r.date)}</td>
      <td>${getType(r.date)}</td>
      <td>${Number(r.hours).toFixed(2)}</td>
      <td>${getValue(r).toFixed(2)}</td>
      <td class="desc">${escapeHtml(r.description || "-")}</td>
      <td><button class="delete" onclick="deleteRecord(${r.id})">Sil</button></td>
    `;
    table.appendChild(tr);
  });

  renderRecentCards(monthRecords);
}

function renderRecentCards(monthRecords) {
  const box = document.getElementById("recentCards");
  if (!box) return;
  const latest = [...monthRecords].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (!latest.length) {
    box.innerHTML = `<div class="empty-state">Bu ay için henüz mesai kaydı yok.</div>`;
    return;
  }
  box.innerHTML = latest.map(r => `
    <div class="recent-item">
      <div><strong>${formatDate(r.date)}</strong><small>${escapeHtml(r.description || getType(r.date))}</small></div>
      <div class="hours">${Number(r.hours).toFixed(2)} Saat</div>
      <div class="money">${getValue(r).toFixed(2)}</div>
    </div>
  `).join("");
}

function renderSummary() {
  const table = document.getElementById("summaryTable");
  table.innerHTML = "";

  months.forEach((name, index) => {
    const month = index + 1;
    const target = getTarget(month);
    const totals = getTotals(month);
    const over = totals.weighted > target;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td>${target.toFixed(2)}</td>
      <td>${totals.weekday.toFixed(2)}</td>
      <td>${totals.weekend.toFixed(2)}</td>
      <td>${totals.weighted.toFixed(2)}</td>
      <td class="${over ? "over" : "under"}">${over ? "Limit Aşımı" : "Uygun"}</td>
    `;
    table.appendChild(tr);
  });
}

function formatDate(dateText) {
  const [y, m, d] = dateText.split("-");
  return `${d}.${m}.${y}`;
}

function clearAll() {
  if (!confirm("Tüm kayıtlar silinsin mi?")) return;
  records = [];
  saveRecords();
  render();
}


function showPage(page = "dashboard") {
  const groups = {
    dashboard: ["dashboard", "dashboard-recent"],
    entry: ["entry-section", "month-summary-section"],
    records: ["month-summary-section", "records-section", "summary-section", "history-section"],
    summary: ["summary-section"],
    charts: ["charts-section"],
    history: ["history-section"],
    settings: ["settings-section"]
  };

  const allSections = [
    "dashboard", "dashboard-recent", "entry-section", "charts-section", "month-summary-section",
    "records-section", "summary-section", "history-section", "settings-section"
  ];

  allSections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("page-hidden");
  });

  (groups[page] || groups.dashboard).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("page-hidden");
  });

  document.querySelectorAll(".menu-btn[data-page]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const firstVisible = document.getElementById((groups[page] || groups.dashboard)[0]);
  if (firstVisible) firstVisible.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initNavigation() {
  document.querySelectorAll(".menu-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", event => {
      event.preventDefault();
      showPage(btn.dataset.page || "dashboard");
    });
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js?v=21");
}

initMonths();
initNavigation();
render();
showPage("dashboard");
