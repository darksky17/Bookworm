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
  const queryClient = useQueryClient();
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage ,
    refetch
  } = useFetchMessages(chatId);



  

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

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev); // ✅ This correctly toggles the modal
  };

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

  const onSend = useCallback(
    async (newMessages = []) => {
      if (!chatId || newMessages.length === 0) return;
      
      const message = newMessages[0];

   
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, message)
      );
      const messagesRef = collection(db, "Chats", chatId, "messages");

      try {
        let imageUrl = null;

        // Upload image if message has a pending image
        if (message.image && message.pending) {
          console.log("Uploading image...");
          const tempMessageId = `${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const imagePath = `images/${chatId}/${tempMessageId}.jpg`;
          const storageRef = storage().ref(imagePath);

          try {
            await storageRef.putFile(message.image);
            imageUrl = await storageRef.getDownloadURL();
            
          } catch (uploadError) {
            console.error("❌ Upload failed:", uploadError);
            throw uploadError;
          }
        } else if (message.image && !message.pending) {
          // Image was already uploaded (edge case)
          imageUrl = message.image;
        }

        // Prepare Firestore message object
        const firestoreMessage = {
          content: imageUrl ? "📷 Photo" : message.text || "",
          senderID: userId,
          receiverID: allData.id,
          timestamp: serverTimestamp(),
        };

        if (imageUrl) {
          firestoreMessage.image = imageUrl;
        }

        // Add message document to Firestore
        await addDoc(messagesRef, firestoreMessage);

        const lastMessageText = imageUrl ? "📷 Photo" : message.text;

        // Update the parent chat document
        await updateDoc(doc(db, "Chats", chatId), {
          lastMessage: lastMessageText,
          timestamp: serverTimestamp(),
          [`unreadCounts.${allData.id}`]: increment(1),
          lastSenderId: userId,
          messageCount: increment(1),
        });

        // Send notification to receiver
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
      }
    },
    [chatId, userId, allData.id]
  );

  useEffect(() => {
    if (stopLoad) return;
    

    if (!chatId || !data) {
     
      return;
    }
    
  
    // Flatten all pages of messages and transform to your expected format
    const allMessages = data.pages.flatMap(page => 
      page.messages.map(msg => ({
        _id: msg._id || msg.id, // Adjust based on your API response structure
        text: msg.content || msg.text,
        type:msg.type || undefined,
        createdAt: new Date(msg.timestamp._seconds * 1000),
        user: {
          _id: msg.senderID || msg.senderId,
        },
        // Add image if it exists
        ...(msg.image && { image: msg.image }),
        ...(msg.postId && {postId: msg.postId})
      }))
    );
  
    setMessages(allMessages);
    

    
  }, [chatId, data, stopLoad]);

  useEffect(() => {
    if (!chatId) return;
    
    const messagesRef = collection(db, "Chats", chatId, "messages");
    const latestMessageQuery = query(
      messagesRef, 
      orderBy("timestamp", "desc"), 
      limit(1)
    );
  
    let isFirstLoad = true;
    let lastMessageTimestamp = null;
   
    const unsubscribe = onSnapshot(latestMessageQuery, (snapshot) => {
      if (snapshot.empty) return;
      if (isFirstLoad) {
        isFirstLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const doc = change.doc;
          const data = doc.data();
          
          // Only add if it's from the other user (avoid duplicate from onSend)
          if (data.senderID !== userId) {
            const newMessage = {
              _id: doc.id,
              text: data.content,
              createdAt: data.timestamp?.toDate() || new Date(),
              user: { _id: data.senderID },
              ...(data.image && { image: data.image })
            };

            setMessages(prevMessages => 
              GiftedChat.append(prevMessages, [newMessage])
            );
          }
        }
      });
    });
  
    return () => unsubscribe();
  }, [chatId, refetch]);

  

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

  const loadMore = ()=>{
    if(hasNextPage && !isFetchingNextPage){
      fetchNextPage();
    }
  }

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
          <Text style={styles.bookTitle}>{postData.BookTitle}</Text>
          <Text style={styles.bookAuthor}>by {postData.BookAuthor}</Text>
        </View>
     
        
      ) : (
        <View style={styles.discussionInfo}>
          <Text style={styles.discussionTitle}>{postData.title}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="black"
            style={{ left: horizontalScale(5) }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>
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
      </View>
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
            loadEarlier={hasNextPage}
            onLoadEarlier={loadMore}
            
            
          />
        </GestureDetector>
      </GestureHandlerRootView>

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
              ascend?
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
    </View>
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
    elevation: 4,
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: horizontalScale(10),
    paddingRight: horizontalScale(10),
  },
  headerText: {
    fontWeight: "500",
    fontSize: moderateScale(25),
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
