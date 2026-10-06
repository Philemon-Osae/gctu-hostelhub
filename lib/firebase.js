import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA9nbAF_SHTWqltikhLF6NjNyGQ5aTuPdw",
  authDomain: "gctu-hostelhub.firebaseapp.com",
  projectId: "gctu-hostelhub",
  storageBucket: "gctu-hostelhub.firebasestorage.app",
  messagingSenderId: "1071263888206",
  appId: "1:1071263888206:web:ef514a4ff96f08b1432dbd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);