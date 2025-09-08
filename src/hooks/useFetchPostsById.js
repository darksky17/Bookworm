import { useQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";

const fetchPosts = async (id, isChat=false) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const url = isChat
  ? `${SERVER_URL}/posts/${id}?chat=true`
  : `${SERVER_URL}/posts/${id}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    if(response.status === 404){

    
    throw new Error("Post Does not exist");
    }
    else if(response.status === 403){
      throw new Error("Not allowed to see this post");
    }
    else{
      throw new Error("Failed to fetch this post");
    }
  }



  const postsData = await response.json();
  
  // Convert timestamp strings back to Date objects for the formatTimestamp function
  // return postsData.map(post => ({
  //   ...post,
  //   timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
  // }));
  return {
    ...postsData,
    timestamp: postsData.timestamp ? new Date(postsData.timestamp) : new Date()
  };

};

export const useFetchPostsById = (id, isChat=false) => {
  return useQuery({
    queryKey: ["post", id, isChat],
    queryFn: () => fetchPosts(id, isChat),
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    enabled:!!id,
  });
}; 