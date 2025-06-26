import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  where,
  setDoc,
  collection,
  query,
  getDocs,
  serverTimestamp,
  onSnapshot,
  deleteField,
  orderBy,
  increment,
  addDoc,
  arrayUnion,
  arrayRemove,
} from "@react-native-firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "@react-native-firebase/storage";

import { getAuth } from "@react-native-firebase/auth";
import { getApp } from "@react-native-firebase/app";

const app = getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export Firebase services
export {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  where,
  setDoc,
  getDocs,
  query,
  collection,
  serverTimestamp,
  onSnapshot,
  deleteField,
  orderBy,
  increment,
  addDoc,
  arrayRemove,
  arrayUnion,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
};
