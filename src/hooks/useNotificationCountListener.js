import { useEffect} from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, Timestamp } from '../Firebaseconfig';
import { auth, db } from '../Firebaseconfig';
import { useDispatch, useSelector } from 'react-redux';
import { setUnreadNotifCount } from '../redux/userSlice';

const useNotificationCountListener = () => {
  const lastTimestamp = useSelector(state=>state.user.lastSeenNotificationsAt);
    const dispatch = useDispatch();

    useEffect(() => {
      let unsubscribe = null;
  
      const setup = async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
               
        if (!lastTimestamp) return;
        const lastSeenTimestamp = Timestamp.fromDate(new Date(lastTimestamp));
      
        const q = query(
          collection(db, 'Notifications'),
          where('targetId', '==', userId),
          where('timestamp', '>', lastSeenTimestamp),
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
    }, [lastTimestamp]);
  };
  

export default useNotificationCountListener;