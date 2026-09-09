/* Mesai Takip Firebase Authentication + Firestore entegrasyonu
   SmartApart Firebase içinde, mevcut kuralla uyumlu çalışır:
   smartapart/ koleksiyonunda tek seviye dokümanlar kullanır.
*/
const MESAI_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAiIHaFG2bontHJ68CQ6ZShJC7fyJDA8_w",
  authDomain: "smartapart-46e77.firebaseapp.com",
  databaseURL: "https://smartapart-46e77-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smartapart-46e77",
  storageBucket: "smartapart-46e77.firebasestorage.app",
  messagingSenderId: "111524776914",
  appId: "1:111524776914:web:cb042493d94a146979960b",
  measurementId: "G-DVQD8HF36R"
};

const ADMIN_EMAIL = "admin@mesaitakip.app";
const ADMIN_USERNAME = "admin";
// Vercel backend adresi: Vercel deploy ettikten sonra buraya kendi adresini yaz.
const MESAI_BACKEND_URL = "https://mesai-takip-2026.vercel.app";
const SMART_COLLECTION = "smartapart";
const APP_TAG = "mesaiTakip";
let authMode = "login";
let firebaseReady = false;
let cloudUserProfile = null;
window.cloudUserProfile = null;
let isLoadingCloud = false;
let authInProgress = false;
let unsubscribeRecordsSnapshot = null;
let firstSnapshotHandled = false;

function safeDocId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}
function userDocId(uid) { return `mesai_user_${safeDocId(uid)}`; }
function recordDocId(uid, year) { return `mesai_records_${safeDocId(uid)}_${safeDocId(year)}`; }

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}
function legacyUsernameToEmail(username) {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error("Kullanıcı adı boş olamaz.");
  return `${clean}@mesaitakip.app`;
}
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function usernameIndexDoc(username) {
  return firebase.firestore().collection("mesaiUsernames").doc(normalizeUsername(username));
}
async function getLoginEmailForUsername(username) {
  const clean = normalizeUsername(username);
  if (!clean) throw new Error("Kullanıcı adı boş olamaz.");
  try {
    const snap = await usernameIndexDoc(clean).get();
    const data = snap.exists ? (snap.data() || {}) : null;
    if (data && data.email) return normalizeEmail(data.email);
  } catch (e) {
    console.warn("Kullanıcı adı e-posta eşleşmesi okunamadı, eski giriş deneniyor:", e);
  }
  // Eski sürümde kayıtlı kullanıcılar için geriye dönük destek.
  return legacyUsernameToEmail(clean);
}
function setAuthLoading(loading) {
  const submitBtn = document.getElementById("authSubmit");
  const loginBtn = document.getElementById("loginTab");
  const registerBtn = document.getElementById("registerTab");
  const actionBtn = document.getElementById("registerActionBtn");
  const resetBtn = document.getElementById("forgotPasswordBtn");
  [submitBtn, loginBtn, registerBtn, actionBtn, resetBtn].forEach(btn => { if (btn) btn.disabled = loading; });
  if (submitBtn) submitBtn.textContent = loading ? "Lütfen bekleyin..." : (authMode === "register" ? "Kayıt Ol" : "Giriş Yap");
}
function getUsername() {
  try { return cloudUserProfile?.username || (firebase.auth().currentUser?.email || "").split("@")[0]; } catch { return ""; }
}
function authError(msg) {
  const el = document.getElementById("authError");
  if (!el) return alert(msg);
  el.style.display = "block";
  el.textContent = msg;
}
function clearAuthError() {
  const el = document.getElementById("authError");
  if (el) { el.style.display = "none"; el.textContent = ""; }
}
function setAuthMode(mode) {
  authMode = mode;
  clearAuthError();
  const nameWrap = document.getElementById("nameWrap");
  const emailWrap = document.getElementById("emailWrap");
  const passwordLabel = document.getElementById("passwordLabel");
  const forgotBtn = document.getElementById("forgotPasswordBtn");
  const loginBtn = document.getElementById("loginTab");
  const registerBtn = document.getElementById("registerTab");
  const submitBtn = document.getElementById("authSubmit");
  if (nameWrap) nameWrap.style.display = mode === "register" ? "block" : "none";
  if (emailWrap) emailWrap.style.display = mode === "register" ? "block" : "none";
  if (passwordLabel) passwordLabel.textContent = mode === "register" ? "Şifre" : "Şifre";
  if (forgotBtn) forgotBtn.style.display = mode === "register" ? "none" : "block";
  if (loginBtn) loginBtn.classList.toggle("ghost", mode !== "login");
  if (registerBtn) registerBtn.classList.toggle("ghost", mode !== "register");
  if (submitBtn) submitBtn.textContent = mode === "register" ? "Kayıt Ol" : "Giriş Yap";
  const regAction = document.getElementById("registerActionBtn");
  if (regAction) regAction.style.display = mode === "register" ? "none" : "block";
  document.body.classList.toggle("register-mode", mode === "register");
}

function backToLogin() {
  setAuthMode("login");
  const nameEl = document.getElementById("authName");
  if (nameEl) nameEl.value = "";
  setTimeout(() => document.getElementById("authUsername")?.focus(), 80);
}

function openRegisterInfo() {
  clearAuthError();
  const modal = document.getElementById("registerInfoModal");
  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }
}
function closeRegisterInfo() {
  const modal = document.getElementById("registerInfoModal");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}
function continueToRegister() {
  closeRegisterInfo();
  setAuthMode("register");
  setTimeout(() => document.getElementById("authName")?.focus(), 80);
}
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeRegisterInfo();
});

function submitAuth() {
  return loginOrRegister();
}
async function loginOrRegister() {
  if (authInProgress) return;
  clearAuthError();
  const usernameEl = document.getElementById("authUsername");
  const passwordEl = document.getElementById("authPassword");
  const rawUsername = usernameEl?.value || "";
  const username = normalizeUsername(rawUsername);
  const password = passwordEl?.value || "";
  const adSoyad = document.getElementById("authName")?.value || "";
  const realEmail = normalizeEmail(document.getElementById("authEmail")?.value || "");
  if (usernameEl) usernameEl.value = username;
  if (!username || !password) return authError("Kullanıcı adı ve şifre gerekli.");
  if (password.length < 6) return authError("Şifre en az 6 karakter olmalı.");
  if (authMode === "register" && !realEmail) return authError("Kayıt için e-posta adresi gerekli.");
  if (authMode === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(realEmail)) return authError("Geçerli bir e-posta adresi yazınız.");
  const email = authMode === "register" ? realEmail : await getLoginEmailForUsername(username);
  authInProgress = true;
  setAuthLoading(true);
  try {
    if (authMode === "register") {
      // ÖNEMLİ: Kayıt olmadan önce Firestore sorgusu yapılmaz.
      // Firestore Rules sadece giriş yapmış kullanıcıya izin verdiği için,
      // kayıt öncesi kullanıcı adı kontrolü "permission-denied" hatasına sebep oluyordu.
      // Aynı kullanıcı adı kontrolünü Firebase Authentication e-posta benzersizliği yapar.
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await createOrUpdateUserProfile(cred.user, { adSoyad: adSoyad || username, username, email, role: "personel" });
      await usernameIndexDoc(username).set({
        username,
        email,
        uid: cred.user.uid,
        app: APP_TAG,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: false });
    } else {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    }
  } catch (e) {
    const map = {
      "auth/user-not-found": "Kullanıcı bulunamadı.",
      "auth/wrong-password": "Şifre hatalı.",
      "auth/invalid-credential": "Kullanıcı adı veya şifre hatalı.",
      "auth/email-already-in-use": "Bu e-posta adresi zaten kayıtlı. Giriş Yap kısmından giriş yapın veya Şifremi Unuttum kullanın.",
      "auth/invalid-email": "E-posta adresi geçersiz.",
      "auth/network-request-failed": "İnternet bağlantısı yok.",
      "permission-denied": "Firebase yetki izni reddedildi. Rules yayınlanmış olmalı ve işlem giriş yaptıktan sonra yapılmalı."
    };
    authError(map[e.code] || e.message || "Giriş yapılamadı.");
  } finally {
    authInProgress = false;
    setAuthLoading(false);
  }
}

function openForgotPasswordModal() {
  clearAuthError();
  const modal = document.getElementById("forgotPasswordModal");
  const emailInput = document.getElementById("forgotEmailInput");
  const currentEmail = document.getElementById("authEmail");
  const status = document.getElementById("forgotStatus");
  if (status) { status.className = "forgot-status"; status.textContent = ""; }
  if (emailInput && currentEmail && currentEmail.value) emailInput.value = currentEmail.value;
  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => emailInput && emailInput.focus(), 80);
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById("forgotPasswordModal");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}

function setForgotStatus(message, type) {
  const status = document.getElementById("forgotStatus");
  if (!status) return authError(message);
  status.textContent = message;
  status.className = "forgot-status " + (type === "ok" ? "ok" : "warn");
}

async function sendForgotPasswordEmail() {
  const btn = document.getElementById("sendResetBtn");
  try {
    clearAuthError();
    const input = document.getElementById("forgotEmailInput");
    const email = normalizeEmail(input ? input.value : "");
    if (!email) return setForgotStatus("Şifre sıfırlama için kayıtlı e-posta adresinizi yazınız.", "warn");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setForgotStatus("Geçerli bir e-posta adresi yazınız.", "warn");
    if (btn) { btn.disabled = true; btn.textContent = "Gönderiliyor..."; }
    await firebase.auth().sendPasswordResetEmail(email);
    setForgotStatus("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutusu ve Spam / Gereksiz klasörünü kontrol edin.", "ok");
  } catch (e) {
    const map = {
      "auth/user-not-found": "Bu e-posta adresiyle kayıtlı hesap bulunamadı.",
      "auth/invalid-email": "E-posta adresi geçersiz.",
      "auth/too-many-requests": "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.",
      "auth/network-request-failed": "İnternet bağlantısı yok. Bağlantınızı kontrol edip tekrar deneyin."
    };
    setForgotStatus(map[e.code] || "Şifre sıfırlama bağlantısı gönderilemedi.", "warn");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "✈️ Şifre Sıfırlama Bağlantısı Gönder"; }
  }
}

async function resetPasswordByEmail() { return openForgotPasswordModal(); }
async function resetPasswordByUsername() { return openForgotPasswordModal(); }

async function createOrUpdateUserProfile(user, extra = {}) {
  const db = firebase.firestore();
  const ref = db.collection(SMART_COLLECTION).doc(userDocId(user.uid));
  const snap = await ref.get();
  const old = snap.exists ? snap.data() : {};
  const username = normalizeUsername(extra.username || old.username || ((user.email || "").split("@")[0]));
  const isAdminUser = user.email === ADMIN_EMAIL || username === ADMIN_USERNAME || old.role === "admin";
  const base = {
    type: "user",
    app: APP_TAG,
    uid: user.uid,
    email: extra.email || user.email,
    authEmail: user.email,
    username,
    adSoyad: extra.adSoyad || old.adSoyad || username,
    role: isAdminUser ? "admin" : (extra.role || old.role || "personel"),
    blocked: Boolean(old.blocked || extra.blocked || false),
    deleted: Boolean(old.deleted || extra.deleted || false),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!snap.exists) base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  await ref.set(base, { merge: true });
  const fresh = await ref.get();
  return fresh.data();
}

async function loadCloudRecordsState(uid) {
  const ref = firebase.firestore().collection(SMART_COLLECTION).doc(recordDocId(uid, CURRENT_YEAR));
  const snap = await ref.get();
  if (!snap.exists) return { exists: false, records: [], data: null };
  const data = snap.data() || {};
  return { exists: true, records: normalizeRecords(data.records || []), data };
}

async function saveCloudRecords() {
  if (!firebaseReady || isLoadingCloud) return;
  const user = firebase.auth().currentUser;
  if (!user || cloudUserProfile?.blocked || cloudUserProfile?.deleted) return;
  records = normalizeRecords(records);
  const ref = firebase.firestore().collection(SMART_COLLECTION).doc(recordDocId(user.uid, CURRENT_YEAR));
  await ref.set({
    type: "records",
    app: APP_TAG,
    uid: user.uid,
    username: getUsername(),
    year: CURRENT_YEAR,
    records,
    recordCount: records.length,
    emptyState: records.length === 0,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  // Yazma sonrası kısa doğrulama: Firestore hala eski listeyi tutuyorsa kullanıcıya net hata ver.
  const verify = await ref.get();
  const verifiedRecords = normalizeRecords((verify.data() || {}).records || []);
  if (JSON.stringify(verifiedRecords) !== JSON.stringify(records)) {
    throw new Error("Bulut doğrulaması başarısız. Kayıt Firebase üzerinde güncellenmedi.");
  }
  localStorage.setItem("mesai_cloud_managed", "1");
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  const el = document.getElementById("currentUserInfo");
  if (el) el.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile?.role || "personel"}</span> • Buluta kaydedildi`;
}

function subscribeCloudRecords(uid) {
  if (unsubscribeRecordsSnapshot) unsubscribeRecordsSnapshot();
  firstSnapshotHandled = false;
  const ref = firebase.firestore().collection(SMART_COLLECTION).doc(recordDocId(uid, CURRENT_YEAR));
  unsubscribeRecordsSnapshot = ref.onSnapshot(async (snap) => {
    try {
      localStorage.setItem("mesai_cloud_managed", "1");
      if (!snap.exists) {
        // İlk kurulumda bulutta doküman yoksa mevcut yerel kayıtları bir defaya mahsus buluta taşı.
        if (!firstSnapshotHandled && normalizeRecords(records).length) {
          firstSnapshotHandled = true;
          await saveCloudRecords();
          return;
        }
        records = [];
      } else {
        records = normalizeRecords((snap.data() || {}).records || []);
      }
      firstSnapshotHandled = true;
      isLoadingCloud = true;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      saveAutoBackup("cloud-snapshot");
      isLoadingCloud = false;
      render();
      const el = document.getElementById("currentUserInfo");
      if (el) el.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile?.role || "personel"}</span> • Bulut senkron`;
    } catch (e) {
      isLoadingCloud = false;
      console.error(e);
      authError("Bulut kayıt okuma hatası: " + (e.message || e.code || e));
    }
  }, (err) => {
    console.error(err);
    authError("Firebase canlı senkron hatası: " + (err.message || err.code || err));
  });
}
async function cloudSaveNow() {
  try { await saveCloudRecords(); alert("Buluta kaydedildi."); } catch (e) { alert("Buluta kaydetme hatası: " + e.message); }
}


function formatProfileDate(value) {
  try {
    const d = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
    if (!d || Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("tr-TR", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch { return "-"; }
}
function setProfileText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "-";
}
function renderProfilePanel() {
  const profile = window.cloudUserProfile || cloudUserProfile;
  if (!profile) return;
  const displayName = profile.adSoyad || profile.username || "Kullanıcı";
  const role = profile.role === "admin" ? "Admin" : "Personel";
  setProfileText("profileDisplayName", displayName);
  setProfileText("profileName", profile.adSoyad || displayName);
  setProfileText("profileUsername", profile.username || getUsername());
  setProfileText("profileEmail", profile.email || profile.authEmail || firebase.auth().currentUser?.email || "-");
  setProfileText("profileCreatedAt", formatProfileDate(profile.createdAt));
  setProfileText("profileLastLogin", formatProfileDate(profile.lastLogin));
  const rolePill = document.getElementById("profileRolePill");
  if (rolePill) rolePill.textContent = (profile.role === "admin" ? "👮 " : "🛡️ ") + role;
  const roleBox = document.getElementById("profileRole");
  if (roleBox) roleBox.innerHTML = `<span class="profile-badge">${profile.role === "admin" ? "👮" : "⭐"} ${role}</span>`;
}


function openAdminPasswordModal(user) {
  const modal = document.getElementById("adminPasswordModal");
  if (!modal) return;
  document.getElementById("adminPasswordUser").textContent = `${user.adSoyad || "Kullanıcı"} • ${user.username || "-"}`;
  document.getElementById("adminPasswordTargetUid").value = user.uid || "";
  document.getElementById("adminPasswordInput").value = "";
  document.getElementById("adminPasswordConfirm").value = "";
  document.getElementById("adminPasswordStatus").textContent = "";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("adminPasswordInput")?.focus(), 80);
}
function closeAdminPasswordModal() {
  const modal = document.getElementById("adminPasswordModal");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}
function setAdminPasswordStatus(message, ok=false) {
  const el = document.getElementById("adminPasswordStatus");
  if (el) { el.textContent = message; el.className = "admin-password-status " + (ok ? "ok" : "warn"); }
}
async function adminSetTemporaryPassword() {
  try {
    if (cloudUserProfile?.role !== "admin") return setAdminPasswordStatus("Bu işlem sadece admin içindir.");
    const targetUid = document.getElementById("adminPasswordTargetUid")?.value || "";
    const password = document.getElementById("adminPasswordInput")?.value || "";
    const confirmPassword = document.getElementById("adminPasswordConfirm")?.value || "";
    if (!targetUid) return setAdminPasswordStatus("Kullanıcı bulunamadı.");
    if (password.length < 8) return setAdminPasswordStatus("Geçici şifre en az 8 karakter olmalı.");
    if (password !== confirmPassword) return setAdminPasswordStatus("Şifreler eşleşmiyor.");
    if (targetUid === firebase.auth().currentUser?.uid) return setAdminPasswordStatus("Kendi admin hesabının şifresini bu ekrandan değiştirme. Firebase hesap ayarlarını kullan.");
    const btn = document.getElementById("adminSetPasswordBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Atanıyor..."; }
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Admin oturumu bulunamadı. Tekrar giriş yapın.");
    if (!MESAI_BACKEND_URL || MESAI_BACKEND_URL.includes("MESAI-TAKIP-BACKEND")) {
      throw new Error("Vercel backend adresi henüz tanımlanmamış.");
    }
    const idToken = await user.getIdToken(true);
    const response = await fetch(`${MESAI_BACKEND_URL.replace(/\/$/, "")}/api/admin-set-temporary-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ targetUid, temporaryPassword: password })
    });
    let result = {};
    try { result = await response.json(); } catch (_) {}
    if (!response.ok) {
      const err = new Error(result?.message || "Geçici şifre atanamadı.");
      err.code = result?.code || `http-${response.status}`;
      throw err;
    }
    setAdminPasswordStatus(result?.message || "Geçici şifre başarıyla atandı.", true);
    setTimeout(() => { closeAdminPasswordModal(); renderAdminPanel(); }, 1200);
  } catch (e) {
    console.error("Admin geçici şifre hatası", e);
    const map = {
      "functions/unauthenticated": "Admin oturumu bulunamadı. Tekrar giriş yapın.",
      "functions/permission-denied": "Bu işlem için admin yetkisi gerekli.",
      "functions/not-found": "Kullanıcının Firebase hesabı bulunamadı.",
      "functions/invalid-argument": "Geçici şifre veya kullanıcı bilgisi geçersiz.",
      "functions/failed-precondition": "Kullanıcının hesap durumu uygun değil.",
      "unauthenticated": "Admin oturumu bulunamadı. Tekrar giriş yapın.",
      "permission-denied": "Bu işlem için admin yetkisi gerekli.",
      "not-found": "Kullanıcının Firebase hesabı bulunamadı.",
      "invalid-argument": "Geçici şifre veya kullanıcı bilgisi geçersiz.",
      "failed-precondition": "Kullanıcının hesap durumu uygun değil.",
      "backend-config": "Vercel backend adresi henüz tanımlanmamış.",
      "http-404": "Vercel backend bulunamadı. Adresi kontrol edin."
    };
    setAdminPasswordStatus(map[e.code] || e.message || "Geçici şifre atanamadı.");
  } finally {
    const btn = document.getElementById("adminSetPasswordBtn");
    if (btn) { btn.disabled = false; btn.textContent = "🔑 Geçici Şifre Ata"; }
  }
}

async function forcePasswordChangeIfNeeded(profile) {
  if (!profile?.forcePasswordChange) return false;
  const modal = document.getElementById("forcePasswordModal");
  if (!modal) return false;
  const user = firebase.auth().currentUser;
  if (!user) return false;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("forcePasswordStatus").textContent = "Admin tarafından verilen geçici şifreyle giriş yaptınız. Devam etmek için yeni şifrenizi belirleyin.";
  return true;
}
async function completeForcedPasswordChange() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const password = document.getElementById("forcePasswordInput")?.value || "";
  const confirmPassword = document.getElementById("forcePasswordConfirm")?.value || "";
  const status = document.getElementById("forcePasswordStatus");
  const btn = document.getElementById("forcePasswordBtn");
  if (password.length < 8) { if (status) status.textContent = "Yeni şifre en az 8 karakter olmalı."; return; }
  if (password !== confirmPassword) { if (status) status.textContent = "Şifreler eşleşmiyor."; return; }
  if (btn) { btn.disabled = true; btn.textContent = "Güncelleniyor..."; }
  try {
    await user.updatePassword(password);
    const ref = firebase.firestore().collection(SMART_COLLECTION).doc(userDocId(user.uid));
    await ref.set({ forcePasswordChange: false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    cloudUserProfile = await createOrUpdateUserProfile(user, {});
    window.cloudUserProfile = cloudUserProfile;
    const modal = document.getElementById("forcePasswordModal");
    if (modal) { modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true"); }
    alert("Şifreniz başarıyla güncellendi. Bundan sonra yeni şifrenizle giriş yapabilirsiniz.");
  } catch (e) {
    console.error(e);
    if (status) status.textContent = e.code === "auth/requires-recent-login" ? "Güvenlik nedeniyle yeniden giriş yapmanız gerekiyor." : (e.message || "Şifre güncellenemedi.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🔐 Yeni Şifremi Kaydet"; }
  }
}

async function renderAdminPanel() {
  const panel = document.getElementById("admin-section");
  if (!panel) return;
  const isAdmin = cloudUserProfile?.role === "admin";
  panel.style.display = isAdmin ? "block" : "none";
  if (!isAdmin) return;
  const snap = await firebase.firestore()
    .collection(SMART_COLLECTION)
    .where("app", "==", APP_TAG)
    .where("type", "==", "user")
    .get();
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Silinen/pasif işaretlenen kullanıcılar admin tablosunda gizlenir.
  const visibleUsers = users.filter(u => !u.deleted);
  const usernameCounts = visibleUsers.reduce((acc, u) => {
    const key = normalizeUsername(u.username || (u.email || "").split("@")[0]);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  visibleUsers.sort((a, b) => {
    const getTime = (u) => {
      if (u?.createdAt?.seconds) return u.createdAt.seconds * 1000;
      if (typeof u?.createdAt === "number") return u.createdAt;
      return new Date(u?.createdAt || 0).getTime() || 0;
    };
    return getTime(b) - getTime(a);
  });
  const active = visibleUsers.filter(u => !u.blocked);
  const totalEl = document.getElementById("adminTotalUsers");
  const activeEl = document.getElementById("adminActiveUsers");
  const lastEl = document.getElementById("adminLastLogin");
  if (totalEl) totalEl.textContent = visibleUsers.length;
  if (activeEl) activeEl.textContent = active.length;
  const latest = visibleUsers.map(u => u.lastLogin?.toDate ? u.lastLogin.toDate() : null).filter(Boolean).sort((a,b)=>b-a)[0];
  if (lastEl) lastEl.textContent = latest ? latest.toLocaleDateString("tr-TR") : "-";
  const tbody = document.getElementById("adminUsersTable");
  if (!tbody) return;
  tbody.innerHTML = visibleUsers.map(u => {
    const last = u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString("tr-TR") : "-";
    const key = normalizeUsername(u.username || (u.email || "").split("@")[0]);
    const duplicateNote = usernameCounts[key] > 1 ? " / Çift kayıt" : "";
    const durum = (u.blocked ? "Engelli" : "Aktif") + duplicateNote;
    const nextRole = u.role === "admin" ? "personel" : "admin";
    return `<tr><td>${escapeHtml(u.username || "-")}</td><td>${escapeHtml(u.adSoyad || "-")}</td><td>${escapeHtml(u.role || "personel")}</td><td>${durum}</td><td>${last}</td><td><div class="admin-actions"><button class="mini-btn" onclick='openAdminPasswordModal(${JSON.stringify(u).replace(/'/g, "&#39;")})'>🔑 Şifre Ata</button><button class="mini-btn" onclick="adminSetRole('${u.id}','${nextRole}')">${nextRole} yap</button><button class="mini-btn" onclick="adminToggleBlock('${u.id}',${u.blocked ? 'false':'true'})">${u.blocked ? 'Aktif et':'Engelle'}</button><button class="mini-btn mini-danger" onclick="adminSoftDelete('${u.id}')">Sil</button></div></td></tr>`;
  }).join("") || `<tr><td colspan="6">Kullanıcı bulunamadı.</td></tr>`;
}
async function adminSetRole(docId, role) {
  if (!confirm(`Yetki ${role} yapılsın mı?`)) return;
  await firebase.firestore().collection(SMART_COLLECTION).doc(docId).set({ role, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  renderAdminPanel();
}
async function adminToggleBlock(docId, blocked) {
  await firebase.firestore().collection(SMART_COLLECTION).doc(docId).set({ blocked, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  renderAdminPanel();
}
async function adminSoftDelete(docId) {
  if (!confirm("Bu kullanıcı sistemde pasif/silinmiş işaretlensin mi?")) return;
  await firebase.firestore().collection(SMART_COLLECTION).doc(docId).set({ deleted: true, blocked: true, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  renderAdminPanel();
}

async function logoutMesai() {
  await firebase.auth().signOut();
}

function initMesaiFirebase() {
  const adminMenu = document.querySelector('.menu-btn[data-page="admin"]');
  if (adminMenu) adminMenu.style.display = "none";
  if (!window.firebase) {
    authError("Firebase kütüphanesi yüklenemedi. İnternet bağlantını kontrol et.");
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(MESAI_FIREBASE_CONFIG);
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  firebase.auth().onAuthStateChanged(async (user) => {
    try {
      if (!user) {
        if (unsubscribeRecordsSnapshot) { unsubscribeRecordsSnapshot(); unsubscribeRecordsSnapshot = null; }
        firebaseReady = false; cloudUserProfile = null; window.cloudUserProfile = null;
        document.body.classList.remove("auth-ok");
        const panel = document.getElementById("admin-section");
        if (panel) panel.style.display = "none";
        return;
      }
      cloudUserProfile = await createOrUpdateUserProfile(user, {});
      window.cloudUserProfile = cloudUserProfile;
      renderProfilePanel();
      if (cloudUserProfile.blocked || cloudUserProfile.deleted) {
        await firebase.auth().signOut();
        authError("Bu kullanıcı admin tarafından engellenmiş/pasif yapılmış.");
        return;
      }
      if (cloudUserProfile.forcePasswordChange) {
        document.body.classList.add("auth-ok");
        firebaseReady = true;
        renderProfilePanel();
        await forcePasswordChangeIfNeeded(cloudUserProfile);
      }
      firebaseReady = true;

      // V61 Performans: Kullanıcı doğrulandıktan sonra ekranı hemen aç.
      // Bulut kayıtları ve admin tablosu arka planda yüklenir.
      document.body.classList.add("auth-ok");
      const adminMenu = document.querySelector('.menu-btn[data-page="admin"]');
      if (adminMenu) adminMenu.style.display = cloudUserProfile.role === "admin" ? "flex" : "none";
      const info = document.getElementById("currentUserInfo");
      if (info) info.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile.role}</span> • Bulut yükleniyor...`;
      try { render(); } catch (renderErr) { console.warn("İlk hızlı render atlandı", renderErr); }

      localStorage.setItem("mesai_cloud_managed", "1");
      // Firestore artık tek ana kaynaktır. Doküman varsa boş dizi bile gerçek durum kabul edilir.
      const cloudState = await loadCloudRecordsState(user.uid);
      const local = normalizeRecords(records);
      if (cloudState.exists) {
        records = cloudState.records;
      } else if (local.length) {
        await saveCloudRecords();
      } else {
        records = [];
        await saveCloudRecords();
      }
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      saveAutoBackup("cloud-login");
      subscribeCloudRecords(user.uid);
      if (info) info.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile.role}</span> • Bulut aktif`;
      renderProfilePanel();
      render();
      if (cloudUserProfile.role === "admin") {
        renderAdminPanel().catch(err => console.warn("Admin paneli arka planda yüklenemedi", err));
      }
    } catch (e) {
      isLoadingCloud = false;
      console.error(e);
      authError("Firebase bağlantı hatası: " + (e.message || e.code || e));
    }
  });
}

// Mevcut saveRecords fonksiyonunu bulut kaydıyla genişlet.
const _localSaveRecords = saveRecords;
saveRecords = function() {
  _localSaveRecords();
  if (!firebaseReady) return Promise.resolve();
  return saveCloudRecords().catch(err => {
    console.warn("Bulut kayıt hatası", err);
    const el = document.getElementById("currentUserInfo");
    if (el) el.innerHTML = `⚠️ Bulut kayıt hatası: ${escapeHtml(err.message || err)}`;
    throw err;
  });
};

window.addEventListener("load", initMesaiFirebase);


// V59: Şifremi Unuttum modalı dış tık / ESC kapatma
document.addEventListener("keydown", function(e){
  if (e.key === "Escape") closeForgotPasswordModal();
});
document.addEventListener("click", function(e){
  const modal = document.getElementById("forgotPasswordModal");
  if (modal && modal.classList.contains("show") && e.target === modal) closeForgotPasswordModal();
});
