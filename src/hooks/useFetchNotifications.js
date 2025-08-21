import { useQuery } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";


const fetchNotifs = async  ()=>{
    const idToken = await auth.currentUser.getIdToken();
    const data = await fetch(`${SERVER_URL}/notifications/display/${auth.currentUser.uid}`,{
        method:"GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });

      const notification = await data.json(); 
   


      return notification.sort((a, b) => 
        new Date(b.timestamp._seconds * 1000 + b.timestamp._nanoseconds / 1e6) - 
        new Date(a.timestamp._seconds * 1000 + a.timestamp._nanoseconds / 1e6)
      );
   
      
};

export const useFetchNotifications = () =>{
     
    return useQuery({
        queryKey: ["notifications"],
        queryFn: () => fetchNotifs(),
        cacheTime: Infinity,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
      });

}

