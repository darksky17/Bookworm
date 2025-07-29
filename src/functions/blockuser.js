import { Alert } from "react-native";
import { arrayUnion, auth, db, doc, updateDoc } from "../Firebaseconfig";


export const BlockUser = async  (blockid, {navigation}={})=> {
const userId = auth.currentUser.uid;


return new Promise((resolve, reject)=>{

    Alert.alert(
        "Block User?",
        "Are you sure you want to block this user? this action is not reversible.",
        [
          {
            text: "Cancel", 
            onPress: () => {}, 
            style: "cancel" // No action, just closes the alert
          },
          {
            text: "Block", 
            onPress: async () => {
              try {
                const userDocRef = doc(db, "Users", userId);
                await updateDoc(userDocRef, {blockedUsers:arrayUnion(blockid)});
                navigation.navigate("MainTabs", {screen:"Feed"});
                console.log("User successfully blocked:", blockid);
                resolve();
  
              } catch(error){
                console.log("Error blocking user", error);
                reject(error);
            }
         
        
            },
          },
        ]
      );


    });
    }