import { SERVER_URL } from "../constants/api";
import { Alert } from "react-native";
import { auth } from "../Firebaseconfig";


export const DeletePost = async (post) => {
   
   return new Promise((resolve, reject)=>{ Alert.alert(
      "Delete Post?",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel", 
          onPress: () => {resolve();}, 
          style: "cancel" // No action, just closes the alert
        },
        {
          text: "Delete", 
          onPress: async () => {
            try {
           
              const idToken = await auth.currentUser.getIdToken();
              const response = await fetch(`${SERVER_URL}/posts/${post.id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
              });
  
              if (!response.ok) {
                throw new Error("Failed to delete post");
              }
              resolve();
  
              
              
  
            } catch (error) {
              alert("Failed to delete post.");
              reject();
              console.log(error);
            }
            
          },
        },
      ]
    );
});
  };
  