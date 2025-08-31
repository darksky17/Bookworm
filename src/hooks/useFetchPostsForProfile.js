import { useInfiniteQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";


const fetchPostsForProfile = async ({pageParam=null, queryKey}) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const [, userId] = queryKey;
      const url = new URL(`${SERVER_URL}/posts/profile/${userId}`);

      if(pageParam){
        url.searchParams.append('cursor', pageParam.cursor);
      }

      url.searchParams.append('limit', 10);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const response = await res.json();
      return{
        posts: response.posts,
        hasMore: response.hasMore,
        cursor: response.cursor,
    }
     
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      return {
        posts: [],
        hasMore: false,
        cursor: null,
      };
    }
   
  };


  export const useFetchPostsForProfile = (userId) => {
    return useInfiniteQuery({
      queryKey: ["postsforprofile", userId],
      queryFn: fetchPostsForProfile,
      getNextPageParam: (lastPage) => {
        if (!lastPage.hasMore) return undefined;
        return {
            cursor: lastPage.cursor
          };
        
      },
      staleTime: 0,
      cacheTime: 5 * 60 * 1000, // 5 minutes cache for infinite scroll
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      enabled:!!userId
    });
  };