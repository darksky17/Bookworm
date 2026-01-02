import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch } from "react-redux";
import {
  db, auth,
  collection,
  query,
  where,
  onSnapshot,
} from "../Firebaseconfig";
import { setUnreadCount } from "../redux/userSlice";
import { useQueryClient } from "@tanstack/react-query";

const useUnreadCountListener = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  
  // Local Map to track counts without re-fetching everything
  const chatUnreadCounts = useRef(new Map()); 

  const calculateTotalUnreadCount = () => {
    let total = 0;
    // Iterate through map: if count > 0, increment total chats with unreads
    chatUnreadCounts.current.forEach((count) => {
      if (count > 0) total += 1; 
    });
    return total;
  };

  const subscribeToUnreadChats = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    console.log("📡 Starting single collection listener...");

    // Clean up any previous listener before starting a new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      // 1. Create a query for ALL chats this user is part of
      const q = query(
        collection(db, "Chats"),
        where("participants", "array-contains", userId)
      );

      // 2. Single listener handles ALL updates
      unsubscribeRef.current = onSnapshot(q, (snapshot) => {
        // Fetch current cache once per snapshot event
        const oldData = queryClient.getQueryData(['chats']);
        
        // If cache is empty, we likely haven't fetched chats yet. 
        // We can just update the unread count map.
        let updatedList = oldData ? [...oldData] : [];
        let needsSort = false;

        // 3. Iterate ONLY through what changed (Added, Modified, Removed)
        snapshot.docChanges().forEach((change) => {
          const chatId = change.doc.id;
          const chatData = change.doc.data();
          
          if (change.type === 'removed') {
            // Handle chat deletion
            chatUnreadCounts.current.delete(chatId);
            updatedList = updatedList.filter(c => c.chatid !== chatId);
          } else {
            // Handle 'added' or 'modified'
            const currentCount = chatData.unreadCounts?.[userId] || 0;
            chatUnreadCounts.current.set(chatId, currentCount);

            // Update TanStack Query Cache if data exists
            if (oldData) {
              const index = updatedList.findIndex(chat => chat.chatid === chatId);
              
              if (index !== -1) {
                // UPDATE existing chat
                const oldTime = updatedList[index].timestamp;
                const newTime = chatData.timestamp?.toDate?.() || updatedList[index].timestamp;

                updatedList[index] = {
                  ...updatedList[index],
                  latestMessage: chatData.lastMessage,
                  unreadCount: currentCount,
                  timestamp: newTime,
                  latestSenderId: chatData.lastSenderId,
                };

                if (oldTime !== newTime) needsSort = true;
              } 
              // Note: If index === -1 (new chat), you might want to push it to updatedList here
              // depending on if your initial fetch covers it.
            }
          }
        });

        // 4. Update Redux (Total Count)
        const totalUnread = calculateTotalUnreadCount();
        dispatch(setUnreadCount(totalUnread));

        // 5. Update TanStack Query (List Data) only if we have cache
        if (oldData) {
          if (needsSort) {
            updatedList.sort((a, b) => {
              const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
              const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
              return timeB - timeA;
            });
          }
          queryClient.setQueryData(['chats'], updatedList);
        }
      }, (error) => {
        console.error("❌ Error in chat listener:", error);
      });

    } catch (error) {
      console.error("❌ Error setting up listener:", error);
    }
  };

  const unsubscribeAll = () => {
    if (unsubscribeRef.current) {
      console.log("🔌 Unsubscribing listener...");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    chatUnreadCounts.current.clear();
  };

  useEffect(() => {
    // Start listener on mount if app is active
    if (appStateRef.current === "active") {
      subscribeToUnreadChats();
    }

    const handleAppStateChange = (nextAppState) => {
      const wasInactive = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === "active";

      appStateRef.current = nextAppState;

      if (wasInactive && isNowActive) {
        subscribeToUnreadChats(); // Re-connect on resume
      } else if (!isNowActive) {
        unsubscribeAll(); // Disconnect on background to save battery
      }
    };

    const appStateListener = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      appStateListener.remove();
      unsubscribeAll();
    };
  }, []);

  return { 
    updateChatUnreadCount: (chatId, newCount) => {
      chatUnreadCounts.current.set(chatId, newCount);
      dispatch(setUnreadCount(calculateTotalUnreadCount()));
    }
  };
};

export default useUnreadCountListener;