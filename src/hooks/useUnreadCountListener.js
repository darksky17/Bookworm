import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch } from "react-redux";
import {
  db, auth,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "../Firebaseconfig";
import { setUnreadCount } from "../redux/userSlice";
import { useQueryClient } from "@tanstack/react-query";

const useUnreadCountListener = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const unsubscribeRefs = useRef([]);
  const appStateRef = useRef(AppState.currentState);
  const chatUnreadCounts = useRef(new Map()); // Track individual chat counts

  const calculateTotalUnreadCount = () => {
    let total = 0;
    chatUnreadCounts.current.forEach((count) => {
      if (count > 0) {
        total += 1; // Each chat with unread messages contributes only 1
      }
    });
    return total;
  };

  const subscribeToUnreadChats = async () => {
    console.log("Subscribing to unread chats…");
    // Clean up any existing listeners
    unsubscribeRefs.current.forEach((unsub) => unsub());
    unsubscribeRefs.current = [];
    chatUnreadCounts.current.clear(); // Reset the map

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const q = query(
        collection(db, "Chats"),
        where("participants", "array-contains", userId)
      );
    
      const querySnapshot = await getDocs(q);
      console.log("✅ Fetched chats", querySnapshot.size);

      querySnapshot.docs.forEach((docSnap) => {
        const chatId = docSnap.id;
        const chatRef = docSnap.ref;
    
        const unsub = onSnapshot(chatRef, (doc) => {
          const previousData = queryClient.getQueryData(['chats'])
          try {
            
            if (doc.exists()) {
              const chatData = doc.data();
              const currentChatUnreadCount = chatData.unreadCounts?.[userId] || 0;
              
              console.log(`Chat ${chatId} unread count:`, currentChatUnreadCount);
              
              // Update this specific chat's unread count
              chatUnreadCounts.current.set(chatId, currentChatUnreadCount);
              
              // Calculate total and dispatch once
              const totalUnreadCount = calculateTotalUnreadCount();
              console.log("Total unread count:", totalUnreadCount);
              
              dispatch(setUnreadCount(totalUnreadCount));
              
              queryClient.setQueryData(['chats'], (oldData) => {                                      
               if (!oldData) return
                const updated = oldData.map(chat =>
                  chat.chatid === chatId 
                    ? { 
                        ...chat, 
                        latestMessage: chatData.lastMessage,
                        unreadCount: chatData.unreadCounts?.[auth.currentUser.uid] || 0,
                        timestamp: chatData.timestamp?.toDate?.() || chat.timestamp
                      }  
                    : chat
                );
                
                // ✅ Sort by most recent
                updated.sort((a, b) => {
                  const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                  const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                  return timeB - timeA;  // Newest first
                });
                
                return updated;
                
              });
           
              
              
              // queryClient.invalidateQueries({ queryKey: ["chats"] });
            }
          } catch (err) {
            console.error("Error processing snapshot for chat:", chatId, err);
            queryClient.setQueryData(['chats'], previousData);
          }
        });
    
        unsubscribeRefs.current.push(unsub);
      });

    } catch (error) {
      console.error("Error setting up chat listeners:", error);
    }
  };

  const unsubscribeAll = () => {
    console.log("Unsubscribing from all chats…");
    unsubscribeRefs.current.forEach((unsub) => unsub());
    unsubscribeRefs.current = [];
    chatUnreadCounts.current.clear();
  };

  useEffect(() => {
    if (appStateRef.current === "active") {
      subscribeToUnreadChats();
    }

    const handleAppStateChange = (nextAppState) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      appStateRef.current = nextAppState;

      if (wasInactive && isNowActive) {
        subscribeToUnreadChats();
      } else if (!isNowActive) {
        unsubscribeAll();
      }
    };

    const appStateListener = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      appStateListener.remove();
      unsubscribeAll();
    };
  }, []);

  // Return a function to manually update a specific chat's unread count
  // This can be called from ChatScreenList when a chat is opened
  const updateChatUnreadCount = (chatId, newCount) => {
    chatUnreadCounts.current.set(chatId, newCount);
    const totalUnreadCount = calculateTotalUnreadCount();
    dispatch(setUnreadCount(totalUnreadCount));
  };

  return { updateChatUnreadCount };
};

export default useUnreadCountListener;