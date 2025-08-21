import { SERVER_URL } from "../constants/api";
import {auth } from "../Firebaseconfig";
import { Modal } from "react-native-paper";
export const ReportProfile = async(targetId, message, type)=>{

    const idToken = await auth.currentUser.getIdToken();
   try{
    const result = await fetch(`${SERVER_URL}/report/${targetId}`,{

        method:'POST',
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            message: message,
            type:type
          }),


    }
    )

    const data = await result.json();

    return data;
}
catch(e){
    return{ error: "Failed to report Profile"};

}






}