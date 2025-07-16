import { useQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";

const fetchPosts = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const response = await fetch(`${SERVER_URL}/posts/feed`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  const postsData = await response.json();
  
  // Convert timestamp strings back to Date objects for the formatTimestamp function
  return postsData.map(post => ({
    ...post,
    timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
  }));
};

export const useFetchPosts = () => {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache data
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
}; 