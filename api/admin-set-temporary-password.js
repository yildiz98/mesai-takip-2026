const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const APP_TAG = 'mesaiTakip';
const SMART_COLLECTION = 'smartapart';
const ADMIN_EMAIL = 'admin@mesaitakip.app';

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing.');
  }

  const serviceAccount = JSON.parse(raw);
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
  });
}

function json(res, status, body, origin = '*') {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return res.end(JSON.stringify(body));
}

function getOrigin(req) {
  const origin = req.headers.origin;
  return origin || '*';
}

module.exports = async function handler(req, res) {
  const origin = getOrigin(req);

  if (req.method === 'OPTIONS') {
    return json(res, 204, {}, origin);
  }

  if (req.method !== 'POST') {
    return json(res, 405, { code: 'method-not-allowed', message: 'Sadece POST isteği kabul edilir.' }, origin);
  }

  try {
    const authHeader = String(req.headers.authorization || '');
    if (!authHeader.startsWith('Bearer ')) {
      return json(res, 401, { code: 'unauthenticated', message: 'Admin oturumu doğrulanamadı.' }, origin);
    }

    const idToken = authHeader.slice(7).trim();
    if (!idToken) {
      return json(res, 401, { code: 'unauthenticated', message: 'Admin oturumu doğrulanamadı.' }, origin);
    }

    getFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();
    const caller = await auth.verifyIdToken(idToken);

    if (String(caller.email || '').toLowerCase() !== ADMIN_EMAIL) {
      return json(res, 403, { code: 'permission-denied', message: 'Bu işlem sadece gerçek admin hesabı tarafından yapılabilir.' }, origin);
    }

    const body = req.body || {};
    const targetUid = typeof body.targetUid === 'string' ? body.targetUid.trim() : '';
    const temporaryPassword = typeof body.temporaryPassword === 'string' ? body.temporaryPassword : '';

    if (!targetUid || !temporaryPassword) {
      return json(res, 400, { code: 'invalid-argument', message: 'Kullanıcı ve geçici şifre gerekli.' }, origin);
    }

    if (temporaryPassword.length < 8 || temporaryPassword.length > 128) {
      return json(res, 400, { code: 'invalid-argument', message: 'Geçici şifre 8-128 karakter arasında olmalı.' }, origin);
    }

    if (targetUid === caller.uid) {
      return json(res, 400, { code: 'failed-precondition', message: 'Admin kendi hesabının şifresini bu işlemle değiştiremez.' }, origin);
    }

    let target;
    try {
      target = await auth.getUser(targetUid);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        return json(res, 404, { code: 'not-found', message: 'Kullanıcının Firebase hesabı bulunamadı.' }, origin);
      }
      throw err;
    }

    const safeUid = targetUid.replace(/[^a-zA-Z0-9_-]/g, '_');
    const profileRef = db.collection(SMART_COLLECTION).doc(`mesai_user_${safeUid}`);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return json(res, 404, { code: 'not-found', message: 'Kullanıcının Mesai Takip profili bulunamadı.' }, origin);
    }

    const profile = profileSnap.data() || {};
    if (profile.app !== APP_TAG || profile.type !== 'user') {
      return json(res, 400, { code: 'failed-precondition', message: 'Bu hesap Mesai Takip kullanıcısı değil.' }, origin);
    }

    if (profile.role === 'admin' || String(target.email || '').toLowerCase() === ADMIN_EMAIL) {
      return json(res, 400, { code: 'failed-precondition', message: 'Admin hesabının şifresi bu işlemle değiştirilemez.' }, origin);
    }

    await auth.updateUser(targetUid, {
      password: temporaryPassword,
      disabled: false
    });

    await profileRef.set({
      forcePasswordChange: true,
      passwordRecoveryAt: FieldValue.serverTimestamp(),
      passwordRecoveryBy: caller.uid,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // Kullanıcı adı -> e-posta eşleşmesini de hedef Firebase hesabıyla
    // senkronize et. Eski/çift kayıtlarda kullanıcı adı doğru hesabın
    // yerine eski bir e-postaya yönlenmesin.
    const username = String(profile.username || '').trim().toLowerCase();
    if (username && target.email) {
      await db.collection('mesaiUsernames').doc(username).set({
        username,
        email: String(target.email).toLowerCase(),
        uid: target.uid,
        app: APP_TAG,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return json(res, 200, {
      ok: true,
      message: `${profile.adSoyad || profile.username || 'Kullanıcı'} için geçici şifre atandı. İlk girişte yeni şifre belirlemesi zorunlu.`
    }, origin);
  } catch (err) {
    console.error('admin-set-temporary-password error:', err);
    return json(res, 500, { code: 'internal', message: 'Sunucu tarafında beklenmeyen bir hata oluştu.' }, origin);
  }
};
