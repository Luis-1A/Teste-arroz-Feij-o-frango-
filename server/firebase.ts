import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firebaseApp: any = null;
let firestoreDb: any = null;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const firebaseConfig = {
      projectId: config.projectId,
      appId: config.appId,
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId
    };

    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApps()[0];
    }

    if (config.firestoreDatabaseId) {
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(firebaseApp);
    }
    console.log('[Firebase] Initialized Firestore successfully with databaseId:', config.firestoreDatabaseId || 'default');
  }
} catch (err) {
  console.error('[Firebase] Failed to initialize Firebase:', err);
}

export { firebaseApp, firestoreDb };
