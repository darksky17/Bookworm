import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
  Pressable,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  Keyboard,
} from "react-native";
import { GiftedChat, Message } from "react-native-gifted-chat";
import * as ImagePicker from "expo-image-picker";
import Menu from "../components/Menu";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
  db,
  auth,
  limit,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  startAfter,
  Timestamp
} from "../Firebaseconfig";
import storage from "@react-native-firebase/storage";
import { Bubble, Send, InputToolbar, Actions } from "react-native-gifted-chat";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SERVER_URL } from "../constants/api";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
import ImageView from "react-native-image-viewing";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchMessages } from "../hooks/useFetchMessages";
import { useFocusEffect } from "@react-navigation/native";
import { useFetchPostsById } from "../hooks/useFetchPostsById";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatDisplay = ({ route, navigation }) => {
  const { allData } = route.params;
  const userId = auth.currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const chatsRef = collection(db, "Chats");
  const [modalState, setModalState] = useState(false);
  let clickedYes = [];
  const [isdisabled, setIsDisabled] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [hasHandledChoice, setHasHandledChoice] = useState(false);
  const [stopLoad, setStopLoad] = useState(false);
  const unsubscribeRef = useRef(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoadingInitial, setIsLoadingInitital] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const listenerUnsubscribeRef = useRef(null);
    



  const fetchLocalChats = async (chatId) => {
    try {
      if (!chatId) return null;
      
      const value = await AsyncStorage.getItem(chatId);
      if (!value) return null;
      
      const parsed = JSON.parse(value);
      
      // ✅ Normalize all messages to have Date objects
      const normalized = parsed.map(normalizeMessage);
      
      console.log(`📦 Loaded ${normalized.length} cached messages`);
      return normalized;
    } catch (e) {
      console.error("Error fetching local chats", e);
      return null;
    }
  };


  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);


const normalizeMessage = (msg) => ({
  ...msg,
  createdAt: msg.createdAt instanceof Date 
    ? msg.createdAt 
    : new Date(msg.createdAt)
});



  // Check if the Messages in Local Storage are Latest or not


  const fetchNewMessagesSinceCache = async (chatId, cachedMessages) => {
    try {
      if (!cachedMessages || cachedMessages.length === 0) {
        return [];
      }
  
      const lastCachedMessage = cachedMessages[cachedMessages.length - 1];
      const lastCachedDate = new Date(lastCachedMessage.createdAt);
      
      console.log("🔍 Last cached ID:", lastCachedMessage._id);
      console.log("🔍 Last cached time:", lastCachedDate.toISOString());
  
      // Query for messages AFTER the last cached timestamp
      const newMessagesQuery = query(
        collection(db, "Chats", chatId, "messages"),
        where("timestamp", ">", Timestamp.fromDate(lastCachedDate)),
        orderBy("timestamp", "asc")
      );
  
      const snapshot = await getDocs(newMessagesQuery);
  
      if (snapshot.empty) {
        console.log("✅ Cache is up to date");
        return [];
      }
  
      console.log(`🔍 Found ${snapshot.size} messages in Firestore`);
  
      // Map Firestore messages
      const firestoreMessages = snapshot.docs.map(doc => ({
        _id: doc.id,
        text: doc.data().content,
        type: doc.data().type || undefined,
        createdAt: doc.data().timestamp?.toDate() || new Date(),
        user: { _id: doc.data().senderID },
        ...(doc.data().image && { image: doc.data().image }),
        ...(doc.data().postId && { postId: doc.data().postId })
      }));
  
      // ✅ Filter using fuzzy duplicate detection
      const newMessages = firestoreMessages.filter(msg => {
        const isDupe = isDuplicateMessage(cachedMessages, msg);
        if (isDupe) {
          console.log("⏭️ Skipping duplicate:", msg._id);
        }
        return !isDupe;
      });
  
      console.log(`✅ ${newMessages.length} truly new messages`);
      return newMessages;
  
    } catch (error) {
      console.error("Error fetching new messages:", error);
      return [];
    }
  };
  


  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };

  // Initial Loading of Messages Upon opening the chat
  useEffect(() => {
    if (!chatId) return;
  
    let unsubscribe;
    const hasLoadedRef = { current: false }; // Local ref to prevent double-load
  
    const loadMessages = async () => {
      if (hasLoadedRef.current) return; // Prevent double execution
      hasLoadedRef.current = true;
  
      try {
        console.log("🚀 Initializing chat...");
        setIsLoadingInitital(true);
  
        // Step 1: Load from cache FIRST (instant UI)
        const cachedMessages = await fetchLocalChats(chatId);
  
        if (cachedMessages && cachedMessages.length > 0) {
          console.log("⚡ Showing cached messages immediately");
          setMessages(cachedMessages);
          
          setIsLoadingInitital(false); // UI ready instantly
  
          // Step 2: Check for NEW messages while user was offline
          const newMessages = await fetchNewMessagesSinceCache(chatId, cachedMessages);
  
          if (newMessages.length > 0) {
            console.log("🔄 Merging new messages with cache");
            const mergedMessages = [...cachedMessages, ...newMessages];
            
            // Update both state and cache
            setMessages(mergedMessages);
            await storeChatInAsync(chatId, mergedMessages);
            
            console.log(`✅ Synced: ${cachedMessages.length} cached + ${newMessages.length} new`);
          }
  
          // Set pagination
          setHasMore(cachedMessages.length >= 30);
  
          // Step 3: Set up real-time listener for FUTURE messages
          setupRealtimeListener();
          
        } else {
          // No cache - fetch from Firestore
          console.log("📡 No cache, fetching from Firestore");
          await fetchInitialMessages();
        }
  
      } catch (error) {
        console.error("Error loading messages:", error);
        setIsLoadingInitital(false);
      }
    };
  
    // Fetch initial batch (no cache scenario)
    const fetchInitialMessages = async () => {
      const messageRef = collection(db, "Chats", chatId, "messages");
      const initialQuery = query(
        messageRef,
        orderBy("timestamp", "desc"),
      );
  
      unsubscribe = onSnapshot(initialQuery, async (snapshot) => {
        if (snapshot.empty) {
          setMessages([]);
          setIsLoadingInitital(false);
          setHasMore(false);
          return;
        }
  
        const newMessages = snapshot.docs.map(doc => ({
          _id: doc.id,
          text: doc.data().content,
          type: doc.data().type || undefined,
          createdAt: doc.data().timestamp?.toDate() || new Date(),
          user: { _id: doc.data().senderID },
          ...(doc.data().image && { image: doc.data().image }),
          ...(doc.data().postId && { postId: doc.data().postId })
        }));
  
        const reversedMessages = newMessages.reverse();
        setMessages(reversedMessages);
        
        // Cache the initial fetch
        await storeChatInAsync(chatId, reversedMessages);
        
        const lastDoc = snapshot.docs[snapshot.docs.length - 1];
        setLastVisible(lastDoc);
        setHasMore(snapshot.docs.length === 30);
        setIsLoadingInitital(false);
      });
  
      listenerUnsubscribeRef.current = unsubscribe;
    };
  
    // Set up listener for NEW messages only (when cache exists)
    const setupRealtimeListener = () => {
      const messagesRef = collection(db, "Chats", chatId, "messages");
      const latestMessageQuery = query(
        messagesRef,
        orderBy("timestamp", "desc"),
        limit(1)
      );
    
      let isFirstSnapshot = true;
    
      const unsubscribe = onSnapshot(latestMessageQuery, (snapshot) => {
        if (snapshot.empty) return;
        
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          console.log("⏭️ Skipping first snapshot");
          return;
        }
    
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const doc = change.doc;
            const data = doc.data();
    
            console.log("🔔 Listener detected message:", doc.id, "from:", data.senderID);
    
            // Only add messages from OTHER users
            if (data.senderID !== userId) {
              const newMessage = {
                _id: doc.id,
                text: data.content,
                type: data.type || undefined,
                createdAt: data.timestamp?.toDate() || new Date(), // ✅ Always Date object
                user: { _id: data.senderID },
                ...(data.image && { image: data.image }),
                ...(data.postId && { postId: data.postId })
              };
    
              setMessages(prevMessages => {
                // ✅ Normalize all existing messages first
                const normalized = prevMessages.map(normalizeMessage);
    
                // Check for duplicates
                if (isDuplicateMessage(normalized, newMessage)) {
                  console.log("⚠️ Duplicate detected:", newMessage._id);
                  return prevMessages;
                }
    
                console.log("✅ Adding message from other user:", newMessage._id);
                
                // Add new message
                const updated = [...normalized, newMessage];
                
                // ✅ CRITICAL: Sort by timestamp (oldest → newest)
                updated.sort((a, b) => {
                  const timeA = a.createdAt.getTime();
                  const timeB = b.createdAt.getTime();
                  return timeA - timeB;
                });
    
                console.log("📊 Message order after adding:");
                updated.forEach((m, i) => {
                  console.log(`  ${i}: ${m._id} at ${m.createdAt.toISOString()}`);
                });
                
                // Update cache
                storeChatInAsync(chatId, updated);
                
                return updated;
              });
            } else {
              console.log("⏭️ Ignoring own message:", doc.id);
            }
          }
        });
      });
    
      return unsubscribe;
    };
  
    loadMessages();
  
    return () => {
      console.log("🧹 Cleaning up listeners");
      if (unsubscribe) unsubscribe();
      if (listenerUnsubscribeRef.current) {
        listenerUnsubscribeRef.current();
        listenerUnsubscribeRef.current = null;
      }
    };
  
  }, [chatId, userId]);

  // Handle image picking (just selection, not sending)
  const handleImagePick = async () => {
    try {
      // Ask for permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "Camera roll access is required.");
        return [];
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const image = result.assets[0];
        

        return [
          {
            _id: Math.round(Math.random() * 1000000),
            text: "",
            createdAt: new Date(),
            user: {
              _id: userId,
            },
            image: image.uri, // local file URI
            pending: true, // mark as not yet uploaded
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("💥 Error picking image:", error);
      return [];
    }
  };

  // Fetch or create chat between users
  const getChatId = async () => {
    console.log("Fetching chat ID...");

    
    let chatId = allData.chatid;
    

    if (!chatId) {
      console.log("No existing chat found. Creating a new chat...");
      const newChat = await addDoc(chatsRef, {
        participants: [userId, allData.id],
        ascended: false,
        lastMessage: "",
        timestamp: serverTimestamp(),
        choices: [],
        unreadCounts: {
          [userId]: 0,
          [allData.id]: 0,
        },
      });
      chatId = newChat.id;
      
    }

    return chatId;
  };

  useEffect(() => {
    const fetchChatId = async () => {
      const id = await getChatId();
      setChatId(id);
     
    };
    fetchChatId();
  }, []);

  const isDuplicateMessage = (existingMessages, newMessage) => {
    return existingMessages.some(existing => {
      // 1. Check by ID (exact match)
      if (existing._id === newMessage._id) {
        return true;
      }
  
      // 2. Check by content + user + timestamp (fuzzy match for optimistic vs real)
      const sameUser = existing.user._id === newMessage.user._id;
      const sameText = existing.text === newMessage.text;
      
      // Allow 5 second timestamp difference (optimistic vs server time)
      const timeDiff = Math.abs(
        new Date(existing.createdAt).getTime() - 
        new Date(newMessage.createdAt).getTime()
      );
      const similarTime = timeDiff < 5000; // 5 seconds tolerance
  
      // If same user, same text, and similar time → it's a duplicate
      if (sameUser && sameText && similarTime) {
        console.log("🔍 Fuzzy duplicate detected:");
        console.log("   Existing:", existing._id, existing.text, new Date(existing.createdAt).toISOString());
        console.log("   New:", newMessage._id, newMessage.text, new Date(newMessage.createdAt).toISOString());
        return true;
      }
  
      return false;
    });
  };

  const onSend = useCallback(
    async (newMessages = []) => {
      if (!chatId || newMessages.length === 0) return;
  
      const message = newMessages[0];
      const tempId = message._id;
  
      console.log("📤 Sending message:", tempId);
  
      // Optimistic UI update
      setMessages((previousMessages) => {
        const normalized = previousMessages.map(normalizeMessage);
        const updated = [...normalized, normalizeMessage(message)];
        
        // ✅ Sort to ensure correct order
        updated.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        return updated;
      });
  
      const messagesRef = collection(db, "Chats", chatId, "messages");
  
      try {
        let imageUrl = null;
  
        if (message.image && message.pending) {
          console.log("📤 Uploading image...");
          const tempMessageId = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const imagePath = `images/${chatId}/${tempMessageId}.jpg`;
          const storageRef = storage().ref(imagePath);
  
          await storageRef.putFile(message.image);
          imageUrl = await storageRef.getDownloadURL();
        } else if (message.image && !message.pending) {
          imageUrl = message.image;
        }
  
        const firestoreMessage = {
          content: imageUrl ? "📷 Photo" : message.text || "",
          senderID: userId,
          receiverID: allData.id,
          timestamp: serverTimestamp(),
        };
  
        if (imageUrl) firestoreMessage.image = imageUrl;
        if (message.type) firestoreMessage.type = message.type;
        if (message.postId) firestoreMessage.postId = message.postId;
  
        const docRef = await addDoc(messagesRef, firestoreMessage);
        const realFirestoreId = docRef.id;
        
        console.log("✅ Sent! Replacing", tempId, "with", realFirestoreId);
  
        // Replace optimistic with real message
        setMessages(prevMessages => {
          const normalized = prevMessages.map(normalizeMessage);
          const withoutOptimistic = normalized.filter(m => m._id !== tempId);
  
          const confirmedMessage = {
            _id: realFirestoreId,
            text: message.text || "",
            type: message.type || undefined,
            createdAt: new Date(), // Current time
            user: { _id: userId },
            ...(imageUrl && { image: imageUrl }),
            ...(message.postId && { postId: message.postId }),
          };
  
          const updated = [...withoutOptimistic, confirmedMessage];
          
          // ✅ Sort by timestamp
          updated.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
          storeChatInAsync(chatId, updated);
  
          return updated;
        });
  
        const lastMessageText = imageUrl ? "📷 Photo" : message.text;
  
        await updateDoc(doc(db, "Chats", chatId), {
          lastMessage: lastMessageText,
          timestamp: serverTimestamp(),
          [`unreadCounts.${allData.id}`]: increment(1),
          lastSenderId: userId,
          messageCount: increment(1),
        });
  
        const idToken = await auth.currentUser.getIdToken();
        await fetch(`${SERVER_URL}/send-message-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            receiverId: allData.id,
            message: lastMessageText,
          }),
        });
  
      } catch (error) {
        console.error("❌ Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
        
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    },
    [chatId, userId, allData.id]
  );

  const storeChatInAsync = async (chatId, messagesArray) => {
    try {
      if (!chatId || !Array.isArray(messagesArray)) {
        console.warn("Invalid params for storeChatInAsync");
        return;
      }
      
      // ✅ Convert Date objects to ISO strings for storage
      const serializable = messagesArray.map(msg => ({
        ...msg,
        createdAt: msg.createdAt instanceof Date 
          ? msg.createdAt.toISOString() 
          : msg.createdAt
      }));
      
      const jsonVal = JSON.stringify(serializable);
      await AsyncStorage.setItem(chatId, jsonVal);
      console.log(`💾 Cached ${serializable.length} messages`);
    } catch (e) {
      console.error("Error storing chats to local store", e);
    }
  };

  


  

  useEffect(() => {
    if (!chatId) return;
   
    const messagesDocRef = doc(db, "Chats", chatId);
    let chatData = {};
 
    const unsubscribe = onSnapshot(messagesDocRef, async (docSnap) => {
     
      
      chatData = docSnap.data();
      if(chatData.ascended) return;
      const choice = Array.isArray(docSnap.data().choices)
        ? docSnap.data().choices
        : [];

        const hasAnswered = choice.some((c) => c.startsWith(userId));
        setHasHandledChoice(hasAnswered);
        const bothAnswered = choice.length === 2;
        const messageCount = chatData.messageCount ?? 0;
        const atThreshold = messageCount > 0 && messageCount % 70 === 0;
        const shouldShow = !chatData.ascended && (atThreshold || choice.length === 1);
    setModalState(shouldShow);

    // If this user already answered, just disable the buttons
    setIsDisabled(hasAnswered);

    // Resolve when both have answered
    if (bothAnswered) {
      const anyNo = choice.some((c) => c.endsWith(":No"));

      if (!anyNo) {
        if (!chatData.ascended) {
          await updateDoc(messagesDocRef, { ascended: true });
          Alert.alert("WOOHOO, this chat is now ascended!");
        }
      } else {
        // Reset the round; bump count to get out of the threshold
        await updateDoc(messagesDocRef, { choices: [] , messageCount: increment(1) });
        Alert.alert("Looks like one of you chose not to Ascend. We will ask again later.");
      }

      // Close locally for both users
      setModalState(false);
      setIsDisabled(false);
    }
    });

    return () => {
      unsubscribe();
      
    };
  }, [chatId]);

  const handleModal = async (value) => {
    console.log("Tap registered:", value);

    if (!chatId) return;

    const messagesDocRef = doc(db, "Chats", chatId);
    const messageDocRefSnap = await getDoc(messagesDocRef);

    let choice = messageDocRefSnap.data().choices || [];

    // Prevent duplicate choices for the same user
    if (choice.includes(userId)) return;

    // Add user choice with their ID to prevent duplicate voting
    const updatedChoices = [...choice, userId + ":" + value];

    await updateDoc(messagesDocRef, { choices: updatedChoices });

    setIsDisabled(true); // Disable button after selection
  };

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -50) {
        console.log("Swiped Left");
        runOnJS(navigation.navigate)("ProfileDisplay", { allData });
      } else if (event.translationX > 50) {
        return;
      }
    })
    .activeOffsetX([-10, 10]);

  useEffect(() => {
    const markChatAsRead = async () => {
      if (!chatId || !userId) return;

      const chatDocRef = doc(db, "Chats", chatId);
      try {
        await updateDoc(chatDocRef, {
          [`unreadCounts.${userId}`]: 0,
        });
      } catch (error) {
        console.error("Error updating unread count:", error);
      }
    };

    markChatAsRead(); // ✅ Actually call the function
  }, [chatId, userId, messages]); // ✅ Run when chatId or userId changes

  const renderSend = useCallback((props) => {
    const messageLength = props.text?.trim().length || 0;
    return (
      <Send
        {...props}
        containerStyle={{ justifyContent: "center", paddingHorizontal: 10 }}
        alwaysShowSend="true"
        disabled={messageLength === 0}
      >
        <MaterialIcons
          size={30}
          color={messageLength ? theme.colors.primary : "grey"}
          name={"send"}
        />
      </Send>
    );
  }, []);

  // Custom Actions component for image picker
  const renderActions = useCallback(
    (props) => {
      if (!allData.ascended || allData.isBlocked || allData.hasBlocked) {
        return;
      }
      return (
        <Actions
          {...props}
          containerStyle={{
            width: horizontalScale(44),
            height: verticalScale(44),
            alignItems: "center",
            justifyContent: "center",
            marginLeft: horizontalScale(2),
            marginBottom: 0,
          }}
          icon={() => (
            <Ionicons name="camera" size={24} color={theme.colors.primary} />
          )}
          onPressActionButton={async () => {
            const messages = await handleImagePick();
            if (messages.length > 0) {
              // show message in chat immediately
              setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, messages)
              );
              // upload image + send to Firestore
              await onSend(messages);
            }
          }}
        />
      );
    },
    [onSend]
  ); // 💡 include onSend in dependencies

  const CustomInputToolbar = useCallback(
    (props) => {
      return (
        <View style={styles.inputContainer}>
          <ScrollView>
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              primaryStyle={{ flex: 1 }}
              renderSend={() => <View />}
              renderActions={renderActions}
            />
          </ScrollView>
          {renderSend(props)}
        </View>
      );
    },
    [renderActions, renderSend]
  );

  const renderMessageImage = useCallback((props) => {
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedImage([{ uri: props.currentMessage.image }]);
          setImageViewerVisible(true);
        }}
      >
        <Image
          source={{ uri: props.currentMessage.image }}
          style={{
            width: horizontalScale(200),
            height: verticalScale(200),
            borderRadius: moderateScale(10),
          }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }, []);

  const renderBubble = useCallback(
    (props) => (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: theme.colors.primary }, // Sent messages (you)
          left: { backgroundColor: theme.colors.text }, // Received messages (other party)
        }}
        textStyle={{
          right: { color: theme.colors.text },
          left: { color: theme.colors.background },
        }}
      />
    ),
    []
  );

  // Memoize the user object to prevent unnecessary re-renders
  const user = useMemo(
    () => ({
      _id: userId,
      name: "You",
    }),
    [userId]
  );

  const placeHolder= ()=>{

    if (allData.isDeleted){
      return "You cant reply to this chat because the user deleted their account"
    }
    else if(allData.isBlocked){
      return "You cant reply to this chat"
    }

    else if (allData.hasBlocked){
      return "You cant reply to this chat because you have blocked this user"
    }

    else return "Type a message..."

  };

  const loadMore = async  ()=>{
    if (!chatId || !lastVisible || !hasMore || isLoadingMore) return;
 console.log("Load earlier was pressed");
    setIsLoadingMore(true);

    try {
      const messagesRef = collection(db, "Chats", chatId, "messages");
      
      // Query for next batch, starting after the last visible document
      const nextQuery = query(
        messagesRef,
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(30)
      );

      const snapshot = await getDocs(nextQuery);

      if (snapshot.empty) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
      }

      // Transform new batch
      const olderMessages = snapshot.docs.map(doc => ({
        _id: doc.id,
        text: doc.data().content,
        type: doc.data().type || undefined,
        createdAt: doc.data().timestamp?.toDate() || new Date(),
        user: {
          _id: doc.data().senderID,
        },
        ...(doc.data().image && { image: doc.data().image }),
        ...(doc.data().postId && { postId: doc.data().postId })
      }));

      

      // Append older messages to the end (they're already in desc order)
      setMessages(prev => {
        const combined = [...prev, ...olderMessages];
        // Sort ascending (oldest → newest)
        combined.sort((a, b) => a.createdAt - b.createdAt);
        return combined;
      });
      
      // Update pagination markers
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastDoc);
      setHasMore(snapshot.docs.length === 30);
      
    } catch (error) {
      console.error("Error loading more messages:", error);
      Alert.alert("Error", "Failed to load older messages");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const customMessage = (props) => {
    
    const { currentMessage } = props;
    const [expanded, setExpanded] = useState(false);
 
    const userMessage = currentMessage.user._id === auth.currentUser.uid;
    const { data: postData, isLoading, error } = useFetchPostsById(currentMessage.postId || null, true);
   
    if (currentMessage.type === "Post") { 
      
      if(isLoading){
        return(
          <View style={[ styles.postContainer, userMessage?styles.postContainerRight : styles.postContainerLeft]}>
                  <Text>Loading</Text>
          </View>
        )
      }

      if (error) {
         return(
        <View style={[ styles.postContainer, userMessage?styles.postContainerRight : styles.postContainerLeft]}>
        <Text>{error.message}</Text>
</View>
         )
      }
      
      // Example: Customize messages from a specific user
      return (<>
        
        <View style={[ styles.postContainer, userMessage?styles.postContainerRight : styles.postContainerLeft]}>
          <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:moderateScale(14), marginBottom:verticalScale(10)}}>{currentMessage.text}</Text>
         <Pressable onPress={()=>navigation.navigate('DisplayProfile', { userId: postData.authorId })} style={{flexDirection:"row",  alignItems:"center"}}>
          <View style={styles.avatarContainer_list}>
          <Text style={styles.avatarText_list}>
            {(postData.displayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={{fontWeight:"bold", color:theme.colors.text, maxWidth:"75%"}}numberOfLines={1} ellipsizeMode="tail">{postData.displayName}</Text>
        </Pressable>
    
        <Pressable onPress={()=>navigation.navigate('PostDetail', { id: currentMessage.postId })}style={{marginTop:verticalScale(10)}}>
        <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
        {postData.type === "BookReview" ? (
     
        <View style={styles.bookInfo}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.bookTitle}>{postData.BookTitle}</Text>
          <Text style={styles.bookAuthor}>by {postData.BookAuthor}</Text>
        </View>
     
        
      ) : (
        <View style={styles.discussionInfo}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.discussionTitle}>{postData.title}</Text>
        </View>
      )}
       <View style={styles.postTypeContainer}>
            <Text style={styles.postType}>{postData.type}</Text>
          </View>
      </View>
          <Text style={{fontSize:moderateScale(14),color:theme.colors.text,}}numberOfLines={expanded?undefined:3} ellipsizeMode="tail">{postData.content}</Text>
        </Pressable>
        <Pressable onPress={() => setExpanded(!expanded)}>
        <Text style={{fontSize:theme.fontSizes.small, fontWeight:"bold", color:theme.colors.muted}}>
          {expanded ? "Show less" : "Read more"}
        </Text>
      </Pressable>
        {postData.images.length>0 &&(
      
        <View style={{ flexDirection: "row", borderRadius: moderateScale(10), overflow: "hidden", marginTop:verticalScale(10) }}>
  {/* Left side - Big image */}
  <View style={{ flex: 1 }}>
    <Image
      source={{ uri: postData.images[0] }}
      style={{ width: "100%", height: verticalScale(200) }}
      resizeMode="cover"
    />
  </View>

  {postData.images.length>1 && (
  <View style={{ flex: 1, flexDirection: "column" }}>
    {[1, 2].map((index) => (
      <View key={index} style={{ flex: 1 }}>
        <Image
          source={{ uri: postData.images[index] || postData.images[0] }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    ))}
  </View>
  )}
</View>

      )}
        </View>
        </>
      );
    }
    return <Message {...props} />; // Render default message for others
  };

  return (
    <SafeAreaView  style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            style={{ left: horizontalScale(5) }}
          />
        </TouchableOpacity>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerText}>
          {allData.ascended ? allData.name : allData.displayName}
        </Text>
        <TouchableOpacity onPress={toggleMenu}>
          <Feather name="more-vertical" size={24} color="black" />
        </TouchableOpacity>
        <Menu
          visible={isMenuVisible}
          setvisible={setMenuVisible}
          onClose={toggleMenu}
          allData={allData.id}
          chatId={chatId}
          stopload={stopLoad}
          setstopload={setStopLoad}
          navigation={navigation}
          unsubscribeRef={unsubscribeRef}
        />
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          alignItems: "flex-end",
          height: verticalScale(30),
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            fontWeight: "bold",
            color: theme.colors.text,
            fontSize: moderateScale(14),
          }}
        >
          Chat
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProfileDisplay", { allData })}
        >
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>{!isLoadingInitial && (
      <GestureHandlerRootView>
        <GestureDetector gesture={swipeGesture}>
          
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={user}
            disableComposer={allData.isDeleted || allData.hasBlocked || allData.isBlocked}
            renderInputToolbar={CustomInputToolbar}
            renderMessageImage={renderMessageImage}
            renderMessage={customMessage}
            renderBubble={renderBubble}
            renderAvatar={null}
            alwaysShowSend={false}
            keyboardShouldPersistTaps="handled"
            minInputToolbarHeight={44}
            bottomOffset={0}
            maxInputLength={1000}
            placeholder={ placeHolder()}
            isAnimated={false}
            extraData={isKeyboardVisible}
            inverted={false}
            
          />
        
        </GestureDetector>
      </GestureHandlerRootView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalState}
        onRequestClose={() => navigation.goBack()}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Congratulations! This chat can be ascended, would you like to
              ascend?{"\n"}{"\n"}
             <Text style={{color:theme.colors.error, fontWeight:"bold"}}> Note: </Text>Ascension will reveal your photos to your friend!
            </Text>
            <View style={{ flexDirection: "row", gap: horizontalScale(15) }}>
             {hasHandledChoice ? (<Text>You have already answered!</Text>):( 
              <>
              <Pressable
                disabled={isdisabled}
                style={[styles.button, styles.buttonClose]}
                onPress={() => handleModal("Yes")}
              >
                <Text style={styles.textStyle}>YES</Text>
              </Pressable>
              <Pressable
                disabled={isdisabled}
                style={[styles.button, styles.buttonClose]}
                onPress={() => handleModal("No")}
              >
                <Text style={styles.textStyle}>NO</Text>
              </Pressable>
              </>
             )}
            </View>
          </View>
        </View>
      </Modal>
      <ImageView
        images={selectedImage || []}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(6),
    alignItems: "center",
    maxHeight: verticalScale(120),
  },
  inputToolbar: {
    flex: 1,
    marginRight: horizontalScale(1),
    borderTopWidth: moderateScale(1),
    borderTopColor: "#ddd",
    borderRadius: theme.borderRadius.lg,
    minHeight: verticalScale(44), // Ensure minimum height
    maxHeight: "auto",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    height: verticalScale(60),
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: horizontalScale(10),
    paddingRight: horizontalScale(10),
  },
  headerText: {
    fontWeight: "500",
    fontSize: moderateScale(25),
    flexShrink:1,
    textAlign:"center"
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: moderateScale(20),
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: moderateScale(10),
    padding: 15,
    elevation: 3,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
  postContainer:{
    flex:1,
    backgroundColor: theme.colors.background,
    borderRadius: moderateScale(12),
    marginVertical: verticalScale(4),
    marginHorizontal: horizontalScale(8),
    padding: moderateScale(12),
    maxWidth: '75%',
    minWidth:'75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 1,
    borderWidth: 1,
    borderColor: theme.colors.border || '#E5E5E5',
  },
  postContainerRight: {
    alignSelf: 'flex-end',
    
    borderColor: theme.colors.primary + '30',
  },
  postContainerLeft: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background,
  },
  avatarContainer_list: {
    width: horizontalScale(30), // was 40
    height: verticalScale(30), // was 40
    borderRadius: moderateScale(15), // was 20
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.horizontal.xs, // was sm

  },
  avatarText_list: {
    fontSize: theme.fontSizes.medium, // was medium
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  bookInfo: {
    marginBottom: theme.spacing.vertical.xs,
    flex:1
  },
  bookTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.xs,
  },
  bookAuthor: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.muted,
  },
  discussionInfo: {
    marginBottom: theme.spacing.vertical.xs,
    flex:1
  },
  discussionTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.xs,
  },
  postTypeContainer: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.horizontal.xs,
    paddingVertical: theme.spacing.vertical.xs,
    borderRadius: theme.borderRadius.sm,
  },
  postType: {
    fontSize: moderateScale(9),
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
});

export default ChatDisplay;
