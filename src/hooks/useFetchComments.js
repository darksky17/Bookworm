import { useQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";

const fetchComments = async (postId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  if (!postId) throw new Error("No postId provided");

  const idToken = await user.getIdToken();
  const response = await fetch(`${SERVER_URL}/posts/${postId}/comments`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }

  const commentsData = await response.json();
  // Convert timestamp strings back to Date objects
  return commentsData.map(comment => ({
    ...comment,
    timestamp: comment.timestamp ? new Date(comment.timestamp) : new Date()
  }));
};

export const useFetchComments = (postId) => {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
    staleTime: 0,
    cacheTime: 0,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}; 