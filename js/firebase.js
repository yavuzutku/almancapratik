import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyCGpRMUNNSx4Kla2YrmDOBHlLSt4rOM1wQ",
  authDomain: "lernen-deutsch-bea69.firebaseapp.com",
  projectId: "lernen-deutsch-bea69",
  storageBucket: "lernen-deutsch-bea69.firebasestorage.app",
  messagingSenderId: "653560965391",
  appId: "1:653560965391:web:545142e9be6d130a54b67a",
  measurementId: "G-X1RF550PTV"
};

const app      = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

const provider = new GoogleAuthProvider();


/* ============================
   AUTH — GOOGLE
============================= */

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logoutFirebase() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}


/* ============================
   AUTH — EMAIL / ŞİFRE
============================= */

export async function registerWithEmail(email, password, displayName) {
  if (!email || !password || !displayName)
    throw new Error("Ad, e-posta ve şifre zorunludur.");
  if (password.length < 6)
    throw new Error("Şifre en az 6 karakter olmalıdır.");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred;
}

export async function loginWithEmail(email, password) {
  if (!email || !password)
    throw new Error("E-posta ve şifre zorunludur.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email) {
  if (!email) throw new Error("E-posta adresi zorunludur.");
  return sendPasswordResetEmail(auth, email);
}


/* ============================
   METİN KAYDET
============================= */

export async function saveMetin(userId, text) {
  if (!userId) throw new Error("Kullanıcı kimliği bulunamadı.");
  if (!text || text.trim().length === 0) throw new Error("Metin boş olamaz.");

  try {
    await addDoc(
      collection(db, "users", userId, "texts"),
      { text: text.trim(), created: Date.now() }
    );
  } catch (err) {
    console.error("[saveMetin] Firestore hatası:", err);
    throw new Error("Metin kaydedilemedi. Lütfen tekrar dene.");
  }
}


/* ============================
   METİNLERİ GETİR
============================= */

export async function getMetinler(userId) {
  if (!userId) throw new Error("Kullanıcı kimliği bulunamadı.");

  try {
    const q = query(
      collection(db, "users", userId, "texts"),
      orderBy("created", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("[getMetinler] Firestore hatası:", err);
    throw new Error("Metinler yüklenemedi. Lütfen sayfayı yenile.");
  }
}


/* ============================
   METİN SİL
============================= */

export async function deleteMetin(userId, id) {
  if (!userId || !id) throw new Error("Geçersiz parametre.");

  try {
    await deleteDoc(doc(db, "users", userId, "texts", id));
  } catch (err) {
    console.error("[deleteMetin] Firestore hatası:", err);
    throw new Error("Metin silinemedi. Lütfen tekrar dene.");
  }
}


/* ============================
   KELİME KAYDET
   meanings dizisi destekler — geriye dönük uyumluluk için
   meaning alanı da her zaman kaydedilir.
============================= */

export async function saveWord(userId, word, meaning, tags = [], meanings = []) {
  if (!userId) throw new Error("Kullanıcı kimliği bulunamadı.");
  if (!word || !meaning) throw new Error("Kelime ve anlam boş olamaz.");

  /* meanings dizisini normalleştir:
     - Boş geçildiyse tek elemanlı liste oluştur
     - meaning her zaman ilk eleman olarak garantilenir */
  const normalizedMeanings = meanings.length > 0
    ? meanings
    : [meaning.trim()];

  /* İlk anlam ile meaning alanını senkron tut */
  const primaryMeaning = normalizedMeanings[0];

  try {
    await addDoc(
      collection(db, "users", userId, "words"),
      {
        word:     word.trim(),
        meaning:  primaryMeaning,
        meanings: normalizedMeanings,
        tags:     Array.isArray(tags) ? tags : [],
        date:     new Date().toISOString(),
        created:  Date.now()
      }
    );
  } catch (err) {
    console.error("[saveWord] Firestore hatası:", err);
    throw new Error("Kelime kaydedilemedi. Lütfen tekrar dene.");
  }
}


/* ============================
   KELİMELERİ GETİR
============================= */

export async function getWords(userId) {
  if (!userId) throw new Error("Kullanıcı kimliği bulunamadı.");

  try {
    const q = query(
      collection(db, "users", userId, "words"),
      orderBy("created", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      /* Geriye dönük uyumluluk: eski kayıtlarda meanings yoksa meaning'den üret */
      if (!Array.isArray(data.meanings) || data.meanings.length === 0) {
        data.meanings = data.meaning ? [data.meaning] : [];
      }
      return { id: d.id, ...data };
    });
  } catch (err) {
    console.error("[getWords] Firestore hatası:", err);
    throw new Error("Kelimeler yüklenemedi. Lütfen sayfayı yenile.");
  }
}


/* ============================
   KELİME SİL
============================= */

export async function deleteWord(userId, wordId) {
  if (!userId || !wordId) throw new Error("Geçersiz parametre.");

  try {
    await deleteDoc(doc(db, "users", userId, "words", wordId));
  } catch (err) {
    console.error("[deleteWord] Firestore hatası:", err);
    throw new Error("Kelime silinemedi. Lütfen tekrar dene.");
  }
}


/* ============================
   KELİME GÜNCELLE
   meanings dizisi destekler — meaning alanını otomatik senkronlar.
============================= */

export async function updateWord(userId, wordId, data) {
  if (!userId || !wordId) throw new Error("Geçersiz parametre.");

  const payload = { ...data };

  /* meanings güncellendiyse meaning alanını da ilk eleman ile senkronize et */
  if (Array.isArray(payload.meanings) && payload.meanings.length > 0) {
    payload.meaning = payload.meanings[0];
  }

  /* meaning güncellendiyse ve meanings yoksa meanings dizisini de güncelle */
  if (payload.meaning && !payload.meanings) {
    payload.meanings = [payload.meaning];
  }

  try {
    await updateDoc(doc(db, "users", userId, "words", wordId), payload);
  } catch (err) {
    console.error("[updateWord] Firestore hatası:", err);
    throw new Error("Kelime güncellenemedi. Lütfen tekrar dene.");
  }
}