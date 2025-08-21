import { doc, updateDoc, serverTimestamp } from '../Firebaseconfig';
import { auth, db } from '../Firebaseconfig';

export const markNotificationsAsSeen = async () => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;
  
  const userRef = doc(db, "Users", userId);
  await updateDoc(userRef, {
    lastSeenNotificationsAt: serverTimestamp()
  });
  
};