import { useQuery } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";


const fetchSavedPosts = async  ({pageParam=null})=>{
    const idToken = await auth.currentUser.getIdToken();
    const url = new URL(`${SERVER_URL}/posts/saved`);
    if(pageParam){
      url.searchParams.append('cursor', pageParam.cursor)
    }
    url.searchParams.append('limit', '10');
   
    const data = await fetch(url.toString(),{
        method:"GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

      const response = await data.json(); 
   


      return {posts:response.posts, hasMore:response.hasMore, cursor:response.cursor };
   
      
};

export const useFetchSavedPosts = () =>{
     
    return useInfiniteQuery({
        queryKey: ["savedPosts"],
        queryFn: fetchSavedPosts,
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined;
          return {
            cursor: lastPage.cursor
          };
        },
        cacheTime: Infinity,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
      });

}

