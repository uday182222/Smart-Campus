import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration (same as your Flutter app)
const firebaseConfig = {
  apiKey: 'AIzaSyDAB-Mcf4yuaIzEZovjuTZ4HzKe4sAgnSY',
  authDomain: 'smart-campus-d063f.firebaseapp.com',
  projectId: 'smart-campus-d063f',
  storageBucket: 'smart-campus-d063f.firebasestorage.app',
  messagingSenderId: '830688983522',
  appId: '1:830688983522:web:59dab948d541cb7c4121bb',
  measurementId: 'G-TGENZB678P',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
