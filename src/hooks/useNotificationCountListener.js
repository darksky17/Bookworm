import { useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from '../Firebaseconfig';
import { auth, db } from '../Firebaseconfig';
import { useDispatch } from 'react-redux';
import { setUnreadNotifCount } from '../redux/userSlice';

const useNotificationCountListener = () => {
    const dispatch = useDispatch();

    useEffect(() => {
      let unsubscribe = null;
  
      const setup = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
  
        const userRef = doc(db, 'Users', userId);
        const userSnap = await getDoc(userRef);
  
        if (!userSnap.exists()) return;
  
        const lastSeen = userSnap.data().lastSeenNotificationsAt;
        if (!lastSeen) return;

        const q = query(
          collection(db, 'Notifications'),
          where('targetId', '==', userId),
          where('timestamp', '>', lastSeen),
          orderBy('timestamp', 'desc')
        );
  
        unsubscribe = onSnapshot(q, (snapshot) => {
          dispatch(setUnreadNotifCount(snapshot.docs.length));
        });
      };
  
      setup();
  
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }, []);
  };
  

export default useNotificationCountListener;