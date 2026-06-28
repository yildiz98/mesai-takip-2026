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
const SMART_COLLECTION = "smartapart";
const APP_TAG = "mesaiTakip";
let authMode = "login";
let firebaseReady = false;
let cloudUserProfile = null;
let isLoadingCloud = false;

function safeDocId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}
function userDocId(uid) { return `mesai_user_${safeDocId(uid)}`; }
function recordDocId(uid, year) { return `mesai_records_${safeDocId(uid)}_${safeDocId(year)}`; }

function usernameToEmail(username) {
  const clean = String(username || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  if (!clean) throw new Error("Kullanıcı adı boş olamaz.");
  return `${clean}@mesaitakip.app`;
}
function getUsername() {
  try { return (firebase.auth().currentUser?.email || "").split("@")[0]; } catch { return ""; }
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
  const loginBtn = document.getElementById("loginTab");
  const registerBtn = document.getElementById("registerTab");
  const submitBtn = document.getElementById("authSubmit");
  if (nameWrap) nameWrap.style.display = mode === "register" ? "block" : "none";
  if (loginBtn) loginBtn.classList.toggle("ghost", mode !== "login");
  if (registerBtn) registerBtn.classList.toggle("ghost", mode !== "register");
  if (submitBtn) submitBtn.textContent = mode === "register" ? "Kayıt Ol" : "Giriş Yap";
}
function submitAuth() {
  return loginOrRegister();
}
async function loginOrRegister() {
  clearAuthError();
  const username = document.getElementById("authUsername").value;
  const password = document.getElementById("authPassword").value;
  const adSoyad = document.getElementById("authName")?.value || "";
  if (!username || !password) return authError("Kullanıcı adı ve şifre gerekli.");
  if (password.length < 6) return authError("Şifre en az 6 karakter olmalı.");
  const email = usernameToEmail(username);
  try {
    if (authMode === "register") {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await createOrUpdateUserProfile(cred.user, { adSoyad: adSoyad || username, role: "personel" });
    } else {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    }
  } catch (e) {
    const map = {
      "auth/user-not-found": "Kullanıcı bulunamadı.",
      "auth/wrong-password": "Şifre hatalı.",
      "auth/invalid-credential": "Kullanıcı adı veya şifre hatalı.",
      "auth/email-already-in-use": "Bu kullanıcı adı zaten kayıtlı.",
      "auth/network-request-failed": "İnternet bağlantısı yok.",
      "permission-denied": "Firebase yetki izni reddedildi. Firestore Rules içinde smartapart okuma/yazma izni olmalı."
    };
    authError(map[e.code] || e.message || "Giriş yapılamadı.");
  }
}

async function resetPasswordByUsername() {
  try {
    const username = document.getElementById("authUsername").value;
    if (!username) return authError("Şifre sıfırlama için kullanıcı adını yaz.");
    await firebase.auth().sendPasswordResetEmail(usernameToEmail(username));
    authError("Şifre sıfırlama bağlantısı gönderildi. Not: Bu kullanıcı adı teknik olarak @mesaitakip.app adresine bağlıdır.");
  } catch (e) { authError("Şifre sıfırlama gönderilemedi. Firebase Console üzerinden şifreyi yenileyebilirsin."); }
}

async function createOrUpdateUserProfile(user, extra = {}) {
  const db = firebase.firestore();
  const username = (user.email || "").split("@")[0];
  const ref = db.collection(SMART_COLLECTION).doc(userDocId(user.uid));
  const snap = await ref.get();
  const old = snap.exists ? snap.data() : {};
  const isAdminUser = user.email === ADMIN_EMAIL || username === ADMIN_USERNAME || old.role === "admin";
  const base = {
    type: "user",
    app: APP_TAG,
    uid: user.uid,
    email: user.email,
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

async function loadCloudRecords(uid) {
  const ref = firebase.firestore().collection(SMART_COLLECTION).doc(recordDocId(uid, CURRENT_YEAR));
  const snap = await ref.get();
  if (!snap.exists) return [];
  return normalizeRecords(snap.data().records || []);
}
async function saveCloudRecords() {
  if (!firebaseReady || isLoadingCloud) return;
  const user = firebase.auth().currentUser;
  if (!user || cloudUserProfile?.blocked || cloudUserProfile?.deleted) return;
  records = normalizeRecords(records);
  await firebase.firestore().collection(SMART_COLLECTION).doc(recordDocId(user.uid, CURRENT_YEAR)).set({
    type: "records",
    app: APP_TAG,
    uid: user.uid,
    username: getUsername(),
    year: CURRENT_YEAR,
    records,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  const el = document.getElementById("currentUserInfo");
  if (el) el.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile?.role || "personel"}</span> • Buluta kaydedildi`;
}
async function cloudSaveNow() {
  try { await saveCloudRecords(); alert("Buluta kaydedildi."); } catch (e) { alert("Buluta kaydetme hatası: " + e.message); }
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
  const active = users.filter(u => !u.blocked && !u.deleted);
  const totalEl = document.getElementById("adminTotalUsers");
  const activeEl = document.getElementById("adminActiveUsers");
  const lastEl = document.getElementById("adminLastLogin");
  if (totalEl) totalEl.textContent = users.length;
  if (activeEl) activeEl.textContent = active.length;
  const latest = users.map(u => u.lastLogin?.toDate ? u.lastLogin.toDate() : null).filter(Boolean).sort((a,b)=>b-a)[0];
  if (lastEl) lastEl.textContent = latest ? latest.toLocaleDateString("tr-TR") : "-";
  const tbody = document.getElementById("adminUsersTable");
  if (!tbody) return;
  tbody.innerHTML = users.map(u => {
    const last = u.lastLogin?.toDate ? u.lastLogin.toDate().toLocaleString("tr-TR") : "-";
    const durum = u.deleted ? "Silinmiş/Pasif" : (u.blocked ? "Engelli" : "Aktif");
    const nextRole = u.role === "admin" ? "personel" : "admin";
    return `<tr><td>${escapeHtml(u.username || "-")}</td><td>${escapeHtml(u.adSoyad || "-")}</td><td>${escapeHtml(u.role || "personel")}</td><td>${durum}</td><td>${last}</td><td><div class="admin-actions"><button class="mini-btn" onclick="adminSetRole('${u.id}','${nextRole}')">${nextRole} yap</button><button class="mini-btn" onclick="adminToggleBlock('${u.id}',${u.blocked ? 'false':'true'})">${u.blocked ? 'Aktif et':'Engelle'}</button><button class="mini-btn mini-danger" onclick="adminSoftDelete('${u.id}')">Sil</button></div></td></tr>`;
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
  if (!window.firebase) {
    authError("Firebase kütüphanesi yüklenemedi. İnternet bağlantını kontrol et.");
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(MESAI_FIREBASE_CONFIG);
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  firebase.auth().onAuthStateChanged(async (user) => {
    try {
      if (!user) {
        firebaseReady = false; cloudUserProfile = null;
        document.body.classList.remove("auth-ok");
        const panel = document.getElementById("admin-section");
        if (panel) panel.style.display = "none";
        return;
      }
      cloudUserProfile = await createOrUpdateUserProfile(user, {});
      if (cloudUserProfile.blocked || cloudUserProfile.deleted) {
        await firebase.auth().signOut();
        authError("Bu kullanıcı admin tarafından engellenmiş/pasif yapılmış.");
        return;
      }
      firebaseReady = true;
      isLoadingCloud = true;
      const cloud = await loadCloudRecords(user.uid);
      const local = normalizeRecords(records);
      if (cloud.length) {
        records = cloud;
      } else if (local.length) {
        records = local;
        isLoadingCloud = false;
        await saveCloudRecords();
        isLoadingCloud = true;
      }
      isLoadingCloud = false;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      saveAutoBackup("cloud-login");
      document.body.classList.add("auth-ok");
      const adminMenu = document.querySelector('.menu-btn[data-page="admin"]');
      if (adminMenu) adminMenu.style.display = cloudUserProfile.role === "admin" ? "flex" : "none";
      const info = document.getElementById("currentUserInfo");
      if (info) info.innerHTML = `👤 ${getUsername()} <span class="admin-badge">${cloudUserProfile.role}</span> • Bulut aktif`;
      render();
      await renderAdminPanel();
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
  saveCloudRecords().catch(err => console.warn("Bulut kayıt hatası", err));
};

window.addEventListener("load", initMesaiFirebase);
