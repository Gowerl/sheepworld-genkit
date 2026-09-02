import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'sheep-vertex-ai',
    storageBucket: 'sheep-vertex-ai.firebasestorage.app'
  });
}

export const db = admin.firestore();
export const storage = admin.storage();
