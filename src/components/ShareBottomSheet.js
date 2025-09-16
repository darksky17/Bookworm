import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Share,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  BackHandler,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import useFetchChats from "../hooks/useFetchChats.js";
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SHARE_PREFIX } from "../constants/api.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils.js";
import theme from "../design-system/theme/theme.js";
import { Button } from "react-native-paper";
import Clipboard from '@react-native-clipboard/clipboard';
import {collection, db, auth, serverTimestamp, increment, doc, addDoc, updateDoc} from "../Firebaseconfig.js";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ShareBottomSheet = ({post, onClose, bottomSheetRef, bottomSheetVisible})=>{
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [footerVisible, setFooterVisible] = useState(true);
    const [note, setNote] = useState("");
    const {data:chats} = useFetchChats();
    const inputRef = useRef(null);
    const [modalVisible, setModalVisible]= useState(false);
    const [filteredchats, setFilteredChats] = useState(chats);
    const [searchQuery, setSearchQuery] = useState("");
   

    useEffect(() => {
      const backAction = () => {
          if (bottomSheetVisible) {
              bottomSheetRef.current.close()
              onClose(); // Call your onClose function
              return true; // Prevent default behavior
          }
          return false; // Allow default behavior
      };

      const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction
      );

      return () => backHandler.remove();
  }, [bottomSheetVisible, onClose]);

    const handleShared = async (post) => {
        try {
          const shareUrl = `${SHARE_PREFIX}/posts/${post.id}`;
          const shareTitle = post.type === "BookReview" 
            ? `Check out "${post.BookTitle}"`
            : `Check out "${post.title}"`;
          const message = `${post.Content?.slice(0, 100)}...\n\nCheck this out on Bookworm:\n${shareUrl}`;  ///ORIGINAL AND WORKING
      
          await Share.share({
            message: message,
            url: shareUrl,
            title: shareTitle,
          });
      
      
        } catch (error) {
          console.log("failed to share", error);
          alert("Failed to share the post.");
        }
      };
      const handleChoice = (item) => {
        setSelectedParticipants(prev => {
          const exists = prev.some(p => p.id === item.id); 
          if (exists) {
            // Remove item
            return prev.filter(p => p.id !== item.id);
          } else {
            // Add item
            return [...prev, item];
          }
        });
      };

      const sendMessage = async()=>{

        try{

          for(const participant of selectedParticipants){
            
            const messageColRef = collection(db, "Chats", participant.chatid, "messages");
            const chatDocRef = doc(db,"Chats", participant.chatid);

            
            const messageData ={
              content: note!==""? note : "Shared a Post",
              senderID: auth.currentUser.uid,
              recieverID: participant.id,
              timestamp: serverTimestamp(),
              type:"Post",
              postId:post.id,
            }

            await updateDoc(chatDocRef, {
              lastMessage: note!==""? note : "Shared a Post",
              lastSenderId: auth.currentUser.uid,
              messageCount: increment(1),
              timestamp:serverTimestamp(),
              [`unreadCounts.${participant.id}`]: increment(1),
            });

            await addDoc(messageColRef, messageData);

            Alert.alert("Post sent successfully");

            bottomSheetRef.current?.close();
            setNote("");
            setSelectedParticipants([]); 
            setSearchQuery("");
            setFilteredChats(chats);
            setFooterVisible(true);
            setModalVisible(false);
            onClose();
          
          }

        } catch(e){
          console.log("Error sending post to chats",e);
        }
        
  
      


      }

      const searchChats = useCallback(() => {
        if (searchQuery === "") {
          setFilteredChats(chats);  
        } else {
          const filtered = chats.filter((chat) => {
  
            const name = chat.displayName || chat.name || "";
            return name.toLowerCase().includes(searchQuery.toLowerCase());
          });
          setFilteredChats(filtered);  
        }
      }, [searchQuery, chats]);

 useEffect(()=>{
  searchChats();
 }, [searchQuery, searchChats])


      return (


<BottomSheet
  ref={bottomSheetRef}
  index={bottomSheetVisible ? 0 : -1} // -1 to hide, 0+ to show
  snapPoints={['45%']}
  enablePanDownToClose={true}
  onClose={onClose}
>
  <BottomSheetView >
    <View style={{ flex: 1, padding: horizontalScale(20), gap:15 }}>
    <Text style={{fontSize:theme.fontSizes.large, fontWeight:"bold", color:theme.colors.text}}>Send as a message</Text>
    <TextInput
    style={{height:verticalScale(35), borderColor:theme.colors.muted, borderWidth:1, borderRadius:15, padding:10}}
    placeholder="Search"
    ref={inputRef}
    editable={true}
    onFocus={()=>{Keyboard.dismiss();bottomSheetRef.current.close();setModalVisible(true)}}
    />
    <View>
      <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{gap:12}}
      data={chats}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={({ item, index }) => {


        return (
            
          <Pressable onPress={()=>{handleChoice(item)}}>
                      <View style={{alignItems:"center", gap:5}}>
            {!selectedParticipants.includes(item)?(
          <View style={styles.avatarContainer_list}>
          <Text style={styles.avatarText_list}>
            {(item.displayName || item.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        ):(<>
                <View style={[styles.avatarContainer_list, {position:"relative"}]}>
          <Text style={styles.avatarText_list}>
            {(item.displayName || item.name || "U").charAt(0).toUpperCase()}
          </Text>
          <Ionicons
           style={{position:"absolute", right:-2, bottom:-1}}
           name="checkmark-circle" size={20} color={theme.colors.text} />
   
        </View>
        
            </>)}
       <View style={{width:60}}>
       <Text style={{textAlign:"center",color:theme.colors.text, fontSize:theme.fontSizes.small}} ellipsizeMode="tail" numberOfLines={2} >{item.displayName || item.name}</Text>
        </View>
     
        </View>
        </Pressable>

        
        );
      }}

      />

    </View>
    </View>
    {!selectedParticipants.length>0?(
    
    <View style={{borderTopWidth:1, flex:1, justifyContent:"space-around", padding: horizontalScale(20), borderColor:"lightgrey", flexDirection:"row"}}>
      
      <View style={{alignItems:"center", gap:5}}>
        <Pressable onPress={()=>{handleShared(post)}} style={{backgroundColor:"lightgrey", height:40, width:40, borderRadius:20, justifyContent:"center", alignItems:"center"}}>
        <Ionicons name="share-social-outline" size={26} color="black" />
        </Pressable>
        <Text style={{color:theme.colors.text, fontSize:theme.fontSizes.small}}>Share Via</Text>
          </View>
          <View style={{alignItems:"center", gap:5}}>
          <Pressable onPress={()=>{Clipboard.setString(`${SHARE_PREFIX}/posts/${post.id}`)}}>
        <View style={{backgroundColor:"lightgrey", height:40, width:40, borderRadius:20, justifyContent:"center", alignItems:"center"}}>
        <AntDesign name="paperclip" size={26} color="black" />
        </View>
        </Pressable>      
        <Text style={{color:theme.colors.text, fontSize:theme.fontSizes.small}}>Copy Link</Text>
        
          </View>
          </View>
          ):(    
            <View style={{borderTopWidth:1, flex:1, gap:20, padding: horizontalScale(20), borderColor:"lightgrey"}}>
              <TextInput
              value={note}
              onChangeText={setNote}
    style={{height:verticalScale(35), borderColor:theme.colors.muted, borderWidth:1, borderRadius:15, padding:10}}
    placeholder="Add a message"
    />

    <Button onPress={()=>sendMessage()} mode="contained" buttonColor={theme.colors.primary} textColor={theme.colors.text}>{selectedParticipants.length>1?"Send Separately":"Send"}</Button>

          
                  </View>)}
  </BottomSheetView>


  <Modal visible={modalVisible}
  animationType="slide"
  onRequestClose={()=>{ 
    inputRef.current.blur();
    setSelectedParticipants([]);
    setNote("");
    bottomSheetRef.current.close();
    onClose();
    setModalVisible(false)}}
    statusBarTranslucent={true}
  >
      <KeyboardAvoidingView 
    style={{flex: 1}} 
    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
    <View style={{flex:1, justifyContent:"space-between"}}>
      <View>

    <View style={{paddingTop:StatusBar.currentHeight, 
                  paddingBottom:theme.spacing.vertical.md,
                  paddingHorizontal:theme.spacing.horizontal.lg, 
                  flexDirection:"row",gap:horizontalScale(40),
                  alignItems:"flex-end", shadowColor:"black",
                  shadowOffset: { width: 0, height: 12 }, // Set the shadow to fall at the bottom
                  shadowOpacity: 0.3, // Adjust opacity
                  shadowRadius: 4, // Adjust blur
                  borderBottomWidth: 0, 
                  borderBottomColor: 'white',
                  elevation:1 }}>
        
        <Pressable onPress={()=>{ 
    
    inputRef.current.blur();
    setSelectedParticipants([]);
    setNote("");
    setFilteredChats(chats);
    setSearchQuery("");
    bottomSheetRef.current.close();
    onClose();
    setFooterVisible(true);
    setModalVisible(false)}}>
        <Text style={{fontSize:theme.fontSizes.large, color:theme.colors.muted, fontWeight:"bold"}}>X</Text>
        </Pressable>
        <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.large}}>Send Post</Text>
      </View>
      <View style={{paddingHorizontal:moderateScale(20), paddingVertical:verticalScale(10)}}>
        <TextInput placeholder="Type a name"
        style={{marginBottom:theme.spacing.vertical.lg,height:verticalScale(35), backgroundColor:theme.colors.background, borderColor:theme.colors.muted, borderWidth:1, borderRadius:5, padding:10}}
        value={searchQuery}
        onChangeText={(text)=>setSearchQuery(text)}
        />
      
      <FlatList
      data={filteredchats}
      contentContainerStyle={{gap:12}}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={({ item, index }) => {


        return (
            
            <Pressable onPress={()=>{handleChoice(item)}} style={{flexDirection:"row", justifyContent:"space-between"}}>
              <View style={{flexDirection:"row", gap:horizontalScale(5)}}>
                        <View style={styles.avatarContainer_list}>
          <Text style={styles.avatarText_list}>
            {(item.displayName || item.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{justifyContent:"center"}}>
          <Text style={{fontWeight:"bold", color:theme.colors.text}}>{item.displayName || item.name}</Text>
          </View>
          </View>
          <View style={{justifyContent:"center"}}>
          {selectedParticipants.includes(item)?(
          <MaterialCommunityIcons name="checkbox-marked" size={24} color="black" />
          ):(<MaterialCommunityIcons name="checkbox-blank-outline" size={24} color="black" />)}
            </View>
            </Pressable>
        
        );
      }}

      
      />
      </View>
      </View>
 {selectedParticipants.length>0 && footerVisible && (
      <View style={{borderTopWidth:1, gap:20, padding: horizontalScale(20), borderColor:"lightgrey"}}>
              <TextInput
              value={note}
              onChangeText={setNote}
    style={{height:verticalScale(35), borderColor:theme.colors.muted, borderWidth:1, borderRadius:15, padding:10}}
    placeholder="Add a message"
    />

    <Button onPress={()=>sendMessage()} mode="contained" buttonColor={theme.colors.primary} textColor={theme.colors.text}>{selectedParticipants.length>1?"Send Separately":"Send"}</Button>

          
                  </View>
                  )}
    </View>

    </KeyboardAvoidingView>
  </Modal>
   </BottomSheet>
  

)};

const styles = StyleSheet.create({
avatarContainer_list: {
    width: horizontalScale(40), // was 40
    height: verticalScale(40), // was 40
    borderRadius: moderateScale(20), // was 20
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
});

export default ShareBottomSheet;