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
  select.innerHTML = "";

  months.forEach((m, index) => {
    const opt = document.createElement("option");
    opt.value = index + 1;
    opt.textContent = `${index + 1} - ${m}`;
    select.appendChild(opt);
  });

  select.value = new Date().getMonth() + 1;
  select.addEventListener("change", render);
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
}

function renderRecords(month) {
  const table = document.getElementById("recordsTable");
  table.innerHTML = "";

  records
    .filter(r => getMonth(r.date) === month)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(r => {
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

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

initMonths();
render();
