import { db } from "../Firebaseconfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  setDoc,
  queryEqual,
} from "@react-native-firebase/firestore";

export const fetchUserDataById = async (userId) => {
  const userDocRef = doc(db, "Users", userId); //This step fetches the particular document
  const userDocSnap = await getDoc(userDocRef);

  if (!userDocSnap.exists) {
    throw new Error("User not found");
  }
  const data = userDocSnap.data();
  return { data, userDocSnap, userDocRef };
}; // This function returns all the data within a user document.

export const fetchUserDataByQuery = async (
  collectionName,
  ...queryConstraints
) => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};

export const fetchChatsByQuery = async (...queryConstraints) => {
  const chatsRef = doc(db, "Chats"); //This step fetches the particular document
  const q = query(chatsRef, ...queryConstraints);
  const chatsSnap = await getDocs(q);

  if (!chatsSnap.exists) {
    throw new Error("User not found");
  }

  return chatsSnap;
}; // This function returns all the data within a user document.
