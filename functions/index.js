const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const APP_TAG = "mesaiTakip";
const SMART_COLLECTION = "smartapart";
const ADMIN_EMAIL = "admin@mesaitakip.app";

exports.adminSetTemporaryPassword = onCall({ region: "europe-west1" }, async (request) => {
  const caller = request.auth;
  if (!caller) throw new HttpsError("unauthenticated", "Admin oturumu bulunamadı.");
  if (String(caller.token.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Bu işlem sadece gerçek admin hesabı tarafından yapılabilir.");
  }

  const { targetUid, temporaryPassword } = request.data || {};
  if (!targetUid || typeof targetUid !== "string" || !temporaryPassword || typeof temporaryPassword !== "string") {
    throw new HttpsError("invalid-argument", "Kullanıcı ve geçici şifre gerekli.");
  }
  if (temporaryPassword.length < 8 || temporaryPassword.length > 128) {
    throw new HttpsError("invalid-argument", "Geçici şifre 8-128 karakter arasında olmalı.");
  }
  if (targetUid === caller.uid) {
    throw new HttpsError("failed-precondition", "Admin kendi hesabını bu işlemle değiştiremez.");
  }

  let target;
  try {
    target = await getAuth().getUser(targetUid);
  } catch (err) {
    if (err.code === "auth/user-not-found") throw new HttpsError("not-found", "Kullanıcının Firebase hesabı bulunamadı.");
    console.error(err);
    throw new HttpsError("internal", "Firebase kullanıcısı okunamadı.");
  }

  const profileRef = db.collection(SMART_COLLECTION).doc(`mesai_user_${targetUid.replace(/[^a-zA-Z0-9_-]/g, "_")}`);
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists) throw new HttpsError("not-found", "Kullanıcının Mesai Takip profili bulunamadı.");
  const profile = profileSnap.data() || {};
  if (profile.app !== APP_TAG || profile.type !== "user") {
    throw new HttpsError("failed-precondition", "Bu hesap Mesai Takip kullanıcısı değil.");
  }
  if (profile.role === "admin" || String(target.email || "").toLowerCase() === ADMIN_EMAIL) {
    throw new HttpsError("failed-precondition", "Admin hesabının şifresi bu işlemle değiştirilemez.");
  }

  await getAuth().updateUser(targetUid, {
    password: temporaryPassword,
    disabled: false
  });

  await profileRef.set({
    forcePasswordChange: true,
    passwordRecoveryAt: FieldValue.serverTimestamp(),
    passwordRecoveryBy: caller.uid,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return {
    ok: true,
    message: `${profile.adSoyad || profile.username || "Kullanıcı"} için geçici şifre atandı. İlk girişte yeni şifre belirlemesi zorunlu.`
  };
});
