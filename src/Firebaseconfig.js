import { collection, query, where, getDocs, getFirestore } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';  // Firestore import
import auth from '@react-native-firebase/auth';  // Firebase Auth import

const  db = getFirestore();



// Export Firebase services
export { firestore, auth, db };
