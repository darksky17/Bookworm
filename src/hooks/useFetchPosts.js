// import { useQuery } from "@tanstack/react-query";
// import { SERVER_URL } from "../constants/api";
// import { auth } from "../Firebaseconfig";

// const fetchPosts = async () => {
//   const user = auth.currentUser;
//   if (!user) throw new Error("User not authenticated");

//   const idToken = await user.getIdToken();
//   const response = await fetch(`${SERVER_URL}/posts/${user.uid}/feed`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${idToken}`,
//     },
//   });

//   if (!response.ok) {
//     throw new Error("Failed to fetch posts");
//   }

//   const postsData = await response.json();
  
//   // Convert timestamp strings back to Date objects for the formatTimestamp function
//   return postsData.map(post => ({
//     ...post,
//     timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
//   }));
// };

// export const useFetchPosts = () => {
//   return useQuery({
//     queryKey: ["posts"],
//     queryFn: fetchPosts,
//     staleTime: 0, // Always consider data stale
//     cacheTime: 0, // Don't cache data
//     retry: 3,
//     retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
//     refetchOnMount: true, // Refetch when component mounts
//     refetchOnWindowFocus: true, // Refetch when window gains focus
//   });
// }; 


import { useInfiniteQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";

const fetchPosts = async ({ pageParam = null, queryKey }) => {
  const [, filter] = queryKey;
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  
  // Build URL with pagination parameters
  const url = new URL(`${SERVER_URL}/posts/${user.uid}/feed`);
  if (pageParam) {
    url.searchParams.append('lastPostId', pageParam.lastPostId);
    url.searchParams.append('lastTimestamp', pageParam.lastTimestamp);
  }
  url.searchParams.append('limit', '10'); // Adjust page size as needed

  if (filter && filter !== "") {
    url.searchParams.append('filter', filter);
  }
  
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }

  const data = await response.json();
  
  // Convert timestamp strings back to Date objects
  const posts = data.posts.map(post => ({
    ...post,
    timestamp: post.timestamp ? new Date(post.timestamp) : new Date()
  }));

  return {
    posts,
    hasMore: data.hasMore,
    lastPostId: data.lastPostId,
    lastTimestamp: data.lastTimestamp
  };
};

export const useFetchPosts = (filter = "") => {
  return useInfiniteQuery({
    queryKey: ["posts", filter],
    queryFn: fetchPosts,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return {
        lastPostId: lastPage.lastPostId,
        lastTimestamp: lastPage.lastTimestamp
      };
    },
    staleTime: 0,
    cacheTime: 5 * 60 * 1000, // 5 minutes cache for infinite scroll
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};