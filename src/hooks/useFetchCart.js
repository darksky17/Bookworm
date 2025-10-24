import { useInfiniteQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";


    const fetchCart = async ({pageParam=null}) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const url = new URL(`${SERVER_URL}/products/cart`); 

      if(pageParam){
        url.searchParams.append('cursor', pageParam.cursor);
      }

      url.searchParams.append('limit', 10);
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const response = await res.json();
      return{
        cart: response.cart,
        hasMore: response.hasMore,
        cursor: response.cursor,
    }
     
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      return {
        cart: [],
        hasMore: false,
        cursor: null,
      };
    }
   
  };


  export const useFetchCart = () => {
    return useInfiniteQuery({
      queryKey: ["cart"],
      queryFn: fetchCart,
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
    });
  };