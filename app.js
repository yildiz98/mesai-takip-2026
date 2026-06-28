
// Firebase kullanıcı kayıt/giriş sistemi - Mesai Takip V32 Realtime Database
const ADMIN_EMAIL = "yildiz.21.98@gmail.com";
const USER_DOMAIN = "mesai.local";
const DB_ROOT = "mesaiTakip";
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let appReady = false;
let remoteSaveTimer = null;

function firebaseReady() {
  return !!(window.firebase && window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.databaseURL);
}

function initFirebaseApp() {
  if (!firebaseReady()) {
    console.warn("Firebase config eksik. firebase-config.js dosyasını doldurun.");
    return false;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
    return true;
  } catch (err) {
    console.error("Firebase başlatılamadı", err);
    return false;
  }
}

function nowIso() { return new Date().toISOString(); }
function cleanKey(value) { return String(value || "").replace(/[.#$\[\]/]/g, "_"); }

function cleanUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function usernameToEmail(username) {
  const u = cleanUsername(username);
  if (u.includes("@")) return u;
  return `${u}@${USER_DOMAIN}`;
}

function emailToUsername(email) {
  const e = String(email || "").toLowerCase();
  return e.endsWith(`@${USER_DOMAIN}`) ? e.replace(`@${USER_DOMAIN}`, "") : e;
}

function authMessage(message, ok = false) {
  const el = document.getElementById("authStatus");
  if (!el) return;
  el.style.color = ok ? "#86efac" : "#fecaca";
  el.textContent = message || "";
}

function switchAuthTab(tab) {
  document.getElementById("loginTab")?.classList.toggle("active", tab === "login");
  document.getElementById("registerTab")?.classList.toggle("active", tab === "register");
  document.getElementById("loginForm")?.classList.toggle("active", tab === "login");
  document.getElementById("registerForm")?.classList.toggle("active", tab === "register");
  authMessage("");
}
window.switchAuthTab = switchAuthTab;

async function registerUser() {
  if (!auth || !db) return authMessage("Firebase ayarı eksik. firebase-config.js dosyasını kontrol et.");
  const displayName = document.getElementById("registerName")?.value.trim();
  const username = cleanUsername(document.getElementById("registerUsername")?.value);
  const pass = document.getElementById("registerPassword")?.value || "";
  const pass2 = document.getElementById("registerPassword2")?.value || "";
  if (!displayName || !username || !pass) return authMessage("Ad soyad, kullanıcı adı ve şifre zorunludur.");
  if (username.length < 3) return authMessage("Kullanıcı adı en az 3 karakter olmalı.");
  if (pass.length < 6) return authMessage("Şifre en az 6 karakter olmalı.");
  if (pass !== pass2) return authMessage("Şifreler aynı değil.");
  try {
    const email = usernameToEmail(username);
    const reservedSnap = await db.ref(`${DB_ROOT}/usernameIndex/${cleanKey(username)}`).get();
    if (reservedSnap.exists()) return authMessage("Bu kullanıcı adı zaten kayıtlı.");
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName });
    const role = email === ADMIN_EMAIL ? "admin" : "personel";
    const profile = {
      uid: cred.user.uid, username: emailToUsername(email), email, displayName, role,
      blocked: false, deleted: false,
      createdAt: nowIso(), lastLoginAt: nowIso(), updatedAt: nowIso()
    };
    await db.ref(`${DB_ROOT}/users/${cred.user.uid}`).update(profile);
    await db.ref(`${DB_ROOT}/usernameIndex/${cleanKey(username)}`).set(cred.user.uid);
    authMessage("Kayıt oluşturuldu. Giriş yapılıyor...", true);
  } catch (err) {
    authMessage(firebaseErrorTr(err));
  }
}
window.registerUser = registerUser;

async function loginUser() {
  if (!auth || !db) return authMessage("Firebase ayarı eksik. firebase-config.js dosyasını kontrol et.");
  const username = document.getElementById("loginUsername")?.value;
  const pass = document.getElementById("loginPassword")?.value || "";
  if (!username || !pass) return authMessage("Kullanıcı adı ve şifre yaz.");
  try {
    await auth.signInWithEmailAndPassword(usernameToEmail(username), pass);
  } catch (err) {
    authMessage(firebaseErrorTr(err));
  }
}
window.loginUser = loginUser;

async function logoutUser() {
  if (auth) await auth.signOut();
  location.reload();
}
window.logoutUser = logoutUser;

async function forgotPassword() {
  if (!auth) return authMessage("Firebase ayarı eksik.");
  const username = document.getElementById("loginUsername")?.value || prompt("Kullanıcı adını veya mail adresini yaz:");
  if (!username) return;
  const email = usernameToEmail(username);
  if (email.endsWith(`@${USER_DOMAIN}`)) return authMessage("Kullanıcı adı ile açılan hesaplarda şifre sıfırlama maili çalışmaz. Yeni şifre için admin yeni hesap açmalı veya Firebase Authentication üzerinden işlem yapılmalı.");
  try {
    await auth.sendPasswordResetEmail(email);
    authMessage("Şifre sıfırlama maili gönderildi.", true);
  } catch (err) { authMessage(firebaseErrorTr(err)); }
}
window.forgotPassword = forgotPassword;

function firebaseErrorTr(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Bu kullanıcı adı zaten kayıtlı.";
  if (code.includes("invalid-email")) return "Kullanıcı adı formatı uygun değil.";
  if (code.includes("weak-password")) return "Şifre en az 6 karakter olmalı.";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) return "Kullanıcı adı veya şifre hatalı.";
  if (code.includes("network")) return "İnternet bağlantısını kontrol et.";
  if (code.includes("permission-denied")) return "Firebase Realtime Database izinleri kapalı. Rules bölümünü kontrol et.";
  return err?.message || "İşlem başarısız oldu.";
}

function userRef(uid = currentUser?.uid) { return uid ? db?.ref(`${DB_ROOT}/users/${uid}`) : null; }
function recordsRef(uid = currentUser?.uid) { return uid ? db?.ref(`${DB_ROOT}/mesailer/${uid}/${CURRENT_YEAR}`) : null; }

async function ensureUserProfile(user) {
  const email = String(user.email || "").toLowerCase();
  const ref = userRef(user.uid);
  const snap = await ref.get();
  const base = snap.exists() ? (snap.val() || {}) : {};
  const role = email === ADMIN_EMAIL ? "admin" : (base.role || "personel");
  const profile = {
    uid: user.uid,
    username: base.username || emailToUsername(email),
    email,
    displayName: base.displayName || user.displayName || emailToUsername(email),
    role,
    blocked: !!base.blocked,
    deleted: !!base.deleted,
    createdAt: base.createdAt || nowIso(),
    lastLoginAt: nowIso(),
    updatedAt: nowIso()
  };
  await ref.update(profile);
  await db.ref(`${DB_ROOT}/usernameIndex/${cleanKey(profile.username)}`).set(user.uid).catch(()=>{});
  return profile;
}

async function loadRemoteRecords() {
  if (!recordsRef()) return;
  const snap = await recordsRef().get();
  const data = snap.exists() ? snap.val() : null;
  if (data && Array.isArray(data.records)) {
    records = normalizeRecords(data.records);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } else {
    records = normalizeRecords(records);
    await saveRecordsRemoteNow("first-sync");
  }
}

async function saveRecordsRemoteNow(reason = "save") {
  if (!recordsRef() || !currentProfile || currentProfile.blocked || currentProfile.deleted) return;
  await recordsRef().update({
    uid: currentUser.uid,
    year: CURRENT_YEAR,
    records: normalizeRecords(records),
    updatedAt: nowIso(),
    reason
  });
}

function queueRemoteSave(reason = "save") {
  if (!db || !currentUser) return;
  clearTimeout(remoteSaveTimer);
  remoteSaveTimer = setTimeout(() => saveRecordsRemoteNow(reason).catch(console.error), 350);
}

function updateUserHeader() {
  const el = document.getElementById("userInfo");
  if (!el) return;
  if (!currentProfile) { el.textContent = "Giriş bekleniyor"; return; }
  const badge = currentProfile.role === "admin" ? " <span class='admin-badge'>Admin</span>" : " <span class='admin-badge'>Personel</span>";
  el.innerHTML = `<strong>${escapeHtml(currentProfile.displayName || currentProfile.username)}</strong>${badge}`;
}

function setAppVisible(visible) {
  document.getElementById("authScreen")?.classList.toggle("hidden", !!visible);
  document.querySelector(".app-shell")?.classList.toggle("page-hidden", !visible);
}

async function initAuthFlow() {
  const ok = initFirebaseApp();
  if (!ok) {
    setAppVisible(false);
    authMessage("Firebase config eksik. firebase-config.js içine SmartApart Firebase bilgileri yerleştirildi mi kontrol et.");
    return;
  }
  setAppVisible(false);
  auth.onAuthStateChanged(async user => {
    try {
      if (!user) { currentUser = null; currentProfile = null; setAppVisible(false); return; }
      currentUser = user;
      currentProfile = await ensureUserProfile(user);
      if (currentProfile.blocked || currentProfile.deleted) {
        authMessage("Bu hesap admin tarafından engellenmiş veya silinmiş.");
        await auth.signOut();
        return;
      }
      await loadRemoteRecords();
      appReady = true;
      setAppVisible(true);
      updateUserHeader();
      initMonths();
      initNavigation();
      render();
      updateBackupStatus();
      if (currentProfile.role === "admin") {
        document.getElementById("adminMenuBtn")?.classList.remove("page-hidden");
        listenAdminUsers();
      }
      showPage("dashboard");
    } catch (err) {
      console.error(err);
      authMessage("Giriş sırasında hata oluştu: " + (err.message || err));
    }
  });
}

let adminUnsubRef = null;
function listenAdminUsers() {
  if (!db || currentProfile?.role !== "admin") return;
  if (adminUnsubRef) adminUnsubRef.off();
  adminUnsubRef = db.ref(`${DB_ROOT}/users`);
  adminUnsubRef.on("value", snap => {
    const val = snap.val() || {};
    const users = Object.entries(val).map(([id, u]) => ({ id, ...(u || {}) }))
      .sort((a,b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    renderAdminUsers(users);
  }, err => console.error(err));
}

function dateFromTs(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return isNaN(d) ? "-" : d.toLocaleString("tr-TR");
}

function renderAdminUsers(users) {
  const activeUsers = users.filter(u => !u.deleted);
  setText("adminTotalUsers", String(activeUsers.length));
  setText("adminCount", String(activeUsers.filter(u => u.role === "admin").length));
  setText("personelCount", String(activeUsers.filter(u => (u.role || "personel") !== "admin").length));
  setText("blockedCount", String(activeUsers.filter(u => u.blocked).length));
  const table = document.getElementById("adminUsersTable");
  if (!table) return;
  table.innerHTML = activeUsers.map(u => {
    const isSelf = u.uid === currentUser?.uid;
    const role = u.role === "admin" ? "admin" : "personel";
    const blocked = !!u.blocked;
    return `<tr>
      <td><strong>${escapeHtml(u.username || emailToUsername(u.email))}</strong><br><small>${escapeHtml(u.email || "")}</small></td>
      <td>${escapeHtml(u.displayName || "-")}</td>
      <td><span class="pill ${role}">${role === "admin" ? "Admin" : "Personel"}</span></td>
      <td><span class="pill ${blocked ? "blocked" : "personel"}">${blocked ? "Engelli" : "Aktif"}</span></td>
      <td>${dateFromTs(u.lastLoginAt)}</td>
      <td>${dateFromTs(u.createdAt)}</td>
      <td><div class="mini-actions">
        <button type="button" onclick="setUserRole('${u.uid}','${role === "admin" ? "personel" : "admin"}')" ${isSelf ? "disabled" : ""}>${role === "admin" ? "Personel Yap" : "Admin Yap"}</button>
        <button type="button" onclick="toggleUserBlock('${u.uid}',${!blocked})" ${isSelf ? "disabled" : ""}>${blocked ? "Aç" : "Engelle"}</button>
        <button class="danger" type="button" onclick="softDeleteUser('${u.uid}')" ${isSelf ? "disabled" : ""}>Sil</button>
      </div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="7">Kullanıcı bulunamadı.</td></tr>`;
}

async function setUserRole(uid, role) {
  if (currentProfile?.role !== "admin") return;
  await userRef(uid).update({ role, updatedAt: nowIso() });
}
window.setUserRole = setUserRole;

async function toggleUserBlock(uid, blocked) {
  if (currentProfile?.role !== "admin") return;
  await userRef(uid).update({ blocked, updatedAt: nowIso() });
}
window.toggleUserBlock = toggleUserBlock;

async function softDeleteUser(uid) {
  if (currentProfile?.role !== "admin") return;
  if (!confirm("Bu kullanıcı uygulama içinden silinmiş işaretlenecek ve giriş yapması engellenecek. Devam edilsin mi?")) return;
  await userRef(uid).update({ deleted: true, blocked: true, updatedAt: nowIso() });
}
window.softDeleteUser = softDeleteUser;

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
const AUTO_BACKUP_KEY = `mesai_yedek_${CURRENT_YEAR}_otomatik`;
const LAST_GOOD_BACKUP_KEY = `mesai_yedek_${CURRENT_YEAR}_son_saglam`;
const LEGACY_KEY_PREFIXES = ["mesai_kayitlari_", "mesai_yedek_"];

function safeJsonParse(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeRecord(record) {
  if (!record || !record.date) return null;
  const hours = Number(record.hours ?? record.hour ?? record.mesai ?? 0);
  if (Number.isNaN(hours)) return null;
  return {
    id: Number(record.id) || Date.now() + Math.floor(Math.random() * 100000),
    date: String(record.date),
    hours,
    description: String(record.description ?? record.desc ?? record.aciklama ?? "")
  };
}

function normalizeRecords(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map(normalizeRecord).filter(Boolean).filter(r => {
    const key = `${r.date}|${r.hours}|${r.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.id) - Number(b.id));
}

function readRecordsFromValue(value) {
  const parsed = safeJsonParse(value, null);
  if (Array.isArray(parsed)) return normalizeRecords(parsed);
  if (parsed && Array.isArray(parsed.records)) return normalizeRecords(parsed.records);
  if (parsed && parsed.data && Array.isArray(parsed.data.records)) return normalizeRecords(parsed.data.records);
  return [];
}

function makeBackupPayload(reason = "auto", recordsList = []) {
  return {
    app: "Mesai Takip 2026",
    version: "V10-yedekli",
    reason,
    year: CURRENT_YEAR,
    recordsKey: RECORDS_KEY,
    createdAt: new Date().toISOString(),
    records: normalizeRecords(recordsList)
  };
}

function scanAllLocalBackups() {
  const found = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !LEGACY_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) continue;
    const list = readRecordsFromValue(localStorage.getItem(key));
    if (list.length) found.push({ key, records: list });
  }
  return found.sort((a, b) => b.records.length - a.records.length);
}

function loadInitialRecords() {
  const current = readRecordsFromValue(localStorage.getItem(RECORDS_KEY));
  if (current.length) return current;

  const candidates = scanAllLocalBackups();
  if (candidates.length) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(candidates[0].records));
    localStorage.setItem(LAST_GOOD_BACKUP_KEY, JSON.stringify({
      ...makeBackupPayload("otomatik-kurtarma", candidates[0].records),
      recoveredFrom: candidates[0].key
    }));
    setTimeout(() => alert(`Eski/yedek kayıt bulundu ve geri yüklendi: ${candidates[0].records.length} kayıt`), 500);
    return candidates[0].records;
  }

  return [];
}

let records = loadInitialRecords();

function saveAutoBackup(reason = "save") {
  const payload = makeBackupPayload(reason, records);
  localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(payload));
  if (payload.records.length) localStorage.setItem(LAST_GOOD_BACKUP_KEY, JSON.stringify(payload));
}

function saveRecords() {
  records = normalizeRecords(records);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  saveAutoBackup("save");
  updateBackupStatus();
  queueRemoteSave("save");
}

function updateBackupStatus() {
  const el = document.getElementById("backupStatus");
  if (!el) return;
  const last = safeJsonParse(localStorage.getItem(LAST_GOOD_BACKUP_KEY), null);
  if (last?.createdAt) {
    el.textContent = `Son otomatik yedek: ${new Date(last.createdAt).toLocaleString("tr-TR")} • ${last.records?.length || 0} kayıt`;
  } else {
    el.textContent = "Henüz yedek yok. İlk kayıt eklendiğinde otomatik yedek oluşur.";
  }
}

function exportBackup() {
  saveAutoBackup("manual-export");
  const payload = makeBackupPayload("manual-export", records);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  a.href = url;
  a.download = `mesai-takip-2026-yedek-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  updateBackupStatus();
}

function triggerImportBackup() {
  document.getElementById("backupFileInput")?.click();
}

function importBackupFile(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const imported = readRecordsFromValue(reader.result);
    if (!imported.length) {
      alert("Bu dosyada geçerli mesai kaydı bulunamadı.");
      input.value = "";
      return;
    }
    if (!confirm(`${imported.length} kayıt geri yüklensin mi? Mevcut kayıtların üzerine yazılır.`)) {
      input.value = "";
      return;
    }
    records = imported;
    saveRecords();
    input.value = "";
    render();
    alert("Yedek başarıyla geri yüklendi.");
  };
  reader.readAsText(file);
}

function restoreLastLocalBackup() {
  const candidates = scanAllLocalBackups();
  if (!candidates.length) return alert("Bu cihazda geri yüklenecek yerel yedek bulunamadı.");
  const best = candidates[0];
  if (!confirm(`${best.records.length} kayıt bulundu. Geri yüklensin mi?`)) return;
  records = best.records;
  saveRecords();
  render();
  alert("Yerel yedek geri yüklendi.");
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
  if (!records.length) return alert("Silinecek kayıt yok.");
  saveAutoBackup("silmeden-once");
  const code = prompt("Tüm kayıtları silmek için SİL yaz. Silmeden önce otomatik yerel yedek alındı.");
  if (code !== "SİL" && code !== "SIL") return;
  records = [];
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(makeBackupPayload("bos-kayit", records)));
  queueRemoteSave("clear-all");
  updateBackupStatus();
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
    settings: ["settings-section"],
    admin: ["admin-section"]
  };

  const allSections = [
    "dashboard", "dashboard-recent", "entry-section", "charts-section", "month-summary-section",
    "records-section", "summary-section", "history-section", "settings-section", "admin-section"
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
  navigator.serviceWorker.register("sw.js?v=31");
}

initAuthFlow();
