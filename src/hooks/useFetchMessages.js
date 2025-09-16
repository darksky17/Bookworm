import { useQuery } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";


const fetchMessages = async  ({pageParam=null, queryKey})=>{
    const [, chatId] = queryKey;
    if (!chatId) {
        throw new Error("Chat ID is required");
      }
  
    const idToken = await auth.currentUser.getIdToken();
    const url = new URL(`${SERVER_URL}/messages/${chatId}`);
    if(pageParam){
      url.searchParams.append('cursor', pageParam.cursor)
    }
    url.searchParams.append('limit', '30');
    const data = await fetch(url.toString(),{
        method:"GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

      const response = await data.json(); 
   


      return {messages:response.messages, hasMore:response.hasMore, cursor:response.cursor };
   
      
};

export const useFetchMessages = (chatId) =>{
     
    return useInfiniteQuery({
        queryKey: ["messages", chatId],
        queryFn: fetchMessages,
        getNextPageParam: (lastPage) => {
          if (!lastPage.hasMore) return undefined;
          return {
            cursor: lastPage.cursor
          };
        },
        cacheTime: Infinity,
        staleTime: 0,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        enabled: !!chatId,
      });

      

}

