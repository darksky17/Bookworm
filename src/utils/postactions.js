import { updateCacheOnLike, updateCacheOnDislike } from "./tanstackqueryhelpers";
import { auth } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";



export const handleDislike = async (postId, queryKey, queryClient) => {
    const previousData = queryClient.getQueryData(queryKey);
    try {
      updateCacheOnDislike({queryClient, queryKey:queryKey, postId} );
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SERVER_URL}/posts/${postId}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
  
      if(!response.ok){
        queryClient.setQueryData(queryKey, previousData);
      }
  
    } catch (error) {
      alert("Failed to dislike post.");
      queryClient.setQueryData(queryKey, previousData);
    }
  };
  
  export const handleLike = async (postId, queryKey, queryClient) => {
    
    const previousData = queryClient.getQueryData(queryKey);
    try {
      updateCacheOnLike({queryClient, queryKey:queryKey, postId} );
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SERVER_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
  
   
      if(!response.ok){
        queryClient.setQueryData(queryKey, previousData);
      }
     
    } catch (error) {
      alert("Failed to like post.");
      console.log(error);
      queryClient.setQueryData(queryKey, previousData);
    }
  };
  