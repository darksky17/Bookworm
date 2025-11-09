import React, {useRef, useState, useCallback, useEffect, useMemo} from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable, Share, Alert, ActivityIndicator } from "react-native";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { moderateScale, horizontalScale, verticalScale } from "../design-system/theme/scaleUtils";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { SERVER_URL } from "../constants/api";
import { auth, db, doc, updateDoc, arrayRemove, getDoc } from "../Firebaseconfig";
import PostsList from "../components/postsList";
import { PostItem } from "../components/postsList";
import PostOptionsModal from "../components/postOptionsModal";
import ProfileOptionsModal from "../components/profileOptionsModal";
import { BlockUser } from "../utils/blockuser";
import { DeletePost } from "../utils/deletepost";
import { SHARE_PREFIX } from "../constants/api";
import SwipeableTabs from "../components/SwipeableTabs";
import ReportProfileModal from "../components/reportProfileModal";
import { useFetchPostsForProfile } from "../hooks/useFetchPostsForProfile";
import { useQueryClient } from "@tanstack/react-query";
import { handleDislike, handleLike } from "../utils/postactions";
import _ from 'lodash';
import ChatRequestModal from "../components/chatRequestModal";
import ShareBottomSheet from "../components/ShareBottomSheet";
import { pollUpdate } from "../utils/pollUdate";

const DisplayProfileScreen = ({navigation})=>{
    
    const route = useRoute();
    const { userId } = route.params; 
    const [renderAbout, setRenderAbout] = useState(false);
  
    const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState([]);
  const [isSticky, setIsSticky] = useState(false);
  const [profileHeight, setProfileHeight] = useState(0);
  const [trigger, setTrigger] = useState(false);
  const [initializing, setInitializng] = useState(true);
  const [userData, setUserData] = useState([]);
  const [isfollowing, setIsFollowing] =useState(false);
  const [ isBlocked, setIsBlocked] = useState(false);
  const [ hasBlocked, setHasBlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [type, setType] = useState("Post");
  const renderLimit = useRef(5);
  const queryClient = useQueryClient();
  const [chatRequestsModal, setChatRequestsModal] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const bottomSheetRef = useRef(null); // Control BottomSheet programmatically
  const [sharedPost, setSharedPost] = useState(null);


  const {
    data:datap,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFetchPostsForProfile(userId);
  useEffect(() => {
   
    const fetchAllData = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        
        // Fetch user data
        const res = await fetch(`${SERVER_URL}/displayprofile/${userId}`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            followerId: auth.currentUser.uid
          }),
        });
  
        const data = await res.json();
        setIsBlocked(data.hasbeenblocked);
        setHasBlocked(data.hasblocked);
        setUserData(data);
    
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setInitializng(false);
      }
    };
  
    fetchAllData();
  }, [rerendertool]);

  

  const posts = useMemo(() => {
    if (!datap || isBlocked || hasBlocked) return [];
    return datap.pages.flatMap(page => page.posts) || [];
  }, [datap, isBlocked, hasBlocked]);

  const visiblePosts = useMemo(() => {
    if(!posts) return;
    return posts.slice(0, renderLimit.current);
}, [posts, renderLimit.current]);

  const handleShared = async (post) => {
    try {
      const shareUrl = `${SHARE_PREFIX}/posts/${post.id}`;
      const shareTitle = post.type === "BookReview" 
        ? `Check out "${post.BookTitle}"`
        : `Check out "${post.title}"`;
      const message = `${post.Content?.slice(0, 100)}...\n\nCheck this out on BookWorm:\n${shareUrl}`;
  
      await Share.share({
        message: message,
        url: shareUrl,
        title: shareTitle,
      });
    } catch (error) {
      alert("Failed to share the post.");
    }
  };

  const handleSend = (post) => {

    setSharedPost(post);
    setBottomSheetVisible(true);
    bottomSheetRef.current?.expand(); // Opens the bottom sheet
  };


  const handleSharedProfile = async (profile) => {
    try {
      const shareUrl = `${SHARE_PREFIX}/profile/${userId}`;
      const shareTitle =  `Check out "${profile.displayName}"`

      const message = `\n\nCheck this profile on BookWorm:\n${shareUrl}`;
  
      await Share.share({
        message: message,
        url: shareUrl,
        title: shareTitle,
      });
    } catch (error) {
      alert("Failed to share the post.");
      console.log(error);
    }
  };

  const handlePollUpdate = (postId, newVoterList) => {
    console.log("Atleast I enter the handlePollUpdate frompoll in display profile"); //not showing
    const keysToUpdate = [
      ["savedPosts"],
      ["postsforprofile", userId],
      ["posts",""],
    ];
  
    // Try updating all relevant infinite-query caches independently
    for (const key of keysToUpdate) {
      try {
        pollUpdate(postId, key, queryClient, newVoterList);
      } catch (e) {
        console.warn("pollUpdate failed for key", key, e);
      }
    }
  
    // Keep the single-post cache in sync if it's present
    try {
      queryClient.setQueryData(["post", postId, false], (old)=>{
        if(!old) return old;
        return { ...old, voterList: newVoterList };
      });
    } catch (e) {
      console.warn("single post cache update failed", e);
    }
  };
  



  const handleFollow = async ()=>{

    

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(`${SERVER_URL}/displayprofile/follow`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // make sure idToken is defined
        },
        body: JSON.stringify({
          userId: userId,
          followerId: auth.currentUser.uid
        }),
      });
      setReRenderTool(prevValue => prevValue + 1);

    } catch (error) {
      console.error('Failed to Follow:', error);
    }

  };

  const handleUnfollow = async (overrideuser, overridefollower)=>{

    try {
      const idToken = await auth.currentUser.getIdToken();

     
    const resolveuser = typeof overrideuser === 'string' ? overrideuser : userId;
    const resolvefollower =
      typeof overridefollower === 'string' ? overridefollower : auth.currentUser.uid;
     
      const res = await fetch(`${SERVER_URL}/displayprofile/unfollow`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // make sure idToken is defined
        },
        body: JSON.stringify({
          userId: resolveuser,
          followerId: resolvefollower
        }),
      });
     
      const data = await res.json();
      
      setReRenderTool(prevValue => prevValue + 1);

    } catch (error) {
      console.error('Failed to UnFollow:', error);
    }

  };

  const unBlockUser = async (item)=>{

   

    Alert.alert(
        "Unblock User?",
        `Are you sure you want to Unblock ${item.displayName}?.`,
        [
          {
            text: "Cancel", 
            onPress: () => {}, 
            style: "cancel" // No action, just closes the alert
          },
          {
            text: "Unblock", 
            onPress: async () => {
 
              try {
                const userDocRef = doc(db, "Users", auth.currentUser.uid);
                await updateDoc(userDocRef, {blockedUsers:arrayRemove(userId)});
                
                
                Alert.alert("User Unlbocked!");
                setReRenderTool(prev => prev + 1);
                
                 
  
              } catch(error){
                
                console.log("Error Unblocking user", error);

            }

         
        
            },
          },
        ]
      );
     

 
 
}



const checkChatRequest= async (targetId) =>{

  const userDocref = doc(db, "Users", auth.currentUser.uid);
  const usersnap = await getDoc(userDocref);
  const userChatRequests = usersnap.data().chatRequests || [];
  const exists = userChatRequests.some(
    (request) => request.requestorId === targetId
  );

  if(exists){
    navigation.navigate("ChatRequests");
    return;
  }

  const idToken = await auth.currentUser.getIdToken();

  try{
    
     const response = await fetch(`${SERVER_URL}/chat-request`,{
      method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            targetId: targetId,
            introMessage: "",
          }),

     });
 
if(response.status === 201){
  try{
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch(`${SERVER_URL}/chat-list/${auth.currentUser.uid}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ participantId: targetId }),
  });
  const allData = await response.json();
  navigation.navigate("ChatDisplay", {allData
  });
} catch(e){
  console.log("there an error going to chats from displayprofile", e);
}
}

else{
  setChatRequestsModal(true);
}

  } catch(e){
     console.log("Problem with chatrequestfunction", e);
  }

}


  const profileSection = (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      paddingTop: theme.spacing.vertical.md,
      gap: verticalScale(10)
    }}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {("U").charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={{
        color: theme.colors.text,
        fontWeight: "bold",
        fontSize: theme.fontSizes.medium
      }}>
        {userData.displayName}
      </Text>
      
      <View style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: horizontalScale(55),
        paddingTop: theme.spacing.vertical.md
      }}>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{
            fontSize: theme.fontSizes.medium,
            fontWeight: "bold",
            color: theme.colors.text
          }}>
            {posts.length}
          </Text>
          <Text style={{ color: theme.colors.muted }}>Posts</Text>
        </View>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{
            fontSize: theme.fontSizes.medium,
            fontWeight: "bold",
            color: theme.colors.text
          }}>
            {userData.followers?.length || 0}
          </Text>
          <Text style={{ color: theme.colors.muted }}>Followers</Text>
        </View>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{
            fontSize: theme.fontSizes.medium,
            fontWeight: "bold",
            color: theme.colors.text
          }}>
            {userData.following?.length || 0}
          </Text>
          <Text style={{ color: theme.colors.muted }}>Following</Text>
        </View>
      </View>

      <View style={{
        paddingTop: theme.spacing.vertical.md,
        flexDirection: "row",
        gap: horizontalScale(20),
        paddingHorizontal: horizontalScale(16)
      }}>
        {userId === auth.currentUser.uid ? (
          <>
            <Button
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text}
              mode="contained-tonal"
              style={{ borderRadius: 5, flex: 0.5 }}
              onPress={()=>{handleSharedProfile(userId)}}
            >
              Share Profile
            </Button>
            <Button
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text}
              mode="contained-tonal"
              style={{ borderRadius: 5, flex: 0.5 }}
              onPress={() => navigation.navigate("EditProfile")}
            >
              Edit Profile
            </Button>
          </>
        ) : hasBlocked ? (
          <Button
            buttonColor={theme.colors.primary}
            textColor={theme.colors.text}
            mode="contained-tonal"
            style={{ borderRadius: 5, flex: 1 }}
            onPress={async ()=>{await unBlockUser(userData)}}
          >
            Unblock User
          </Button>
        ) : (
          <>
            {userData.isfollowing ? (
              <Button
                onPress={handleUnfollow}
                buttonColor={theme.colors.primary}
                disabled={isBlocked}
                textColor={theme.colors.text}
                mode="contained-tonal"
                style={{ borderRadius: 5, flex: 0.5 }}
              >
                Unfollow
              </Button>
            ) : (
              <Button
                onPress={handleFollow}
                buttonColor={theme.colors.primary}
                disabled={isBlocked}
                textColor={theme.colors.text}
                mode="contained-tonal"
                style={{ borderRadius: 5, flex: 0.5 }}
              >
                Follow{userData.hasfollowed ? " Back" : ""}
              </Button>
            )}
            <Button
              mode="contained-tonal"
              disabled={isBlocked}
              onPress={() => !userData.hasRequestedChat && checkChatRequest(userId)}
              buttonColor={userData.hasRequestedChat?"grey":theme.colors.primary}
              textColor={theme.colors.text}
              style={{ borderRadius: 5, flex: 0.5 }}
            >
              {userData.hasRequestedChat?"Request Sent":"Message"}
            </Button>
          </>
        )}
      </View>
    </View>
  );

  const postsContent = isBlocked || hasBlocked ? (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Text>No Information available</Text>
    </View>
  ) : (
    <View style={{flex:1}}>
        {visiblePosts.length<1 && (
      <View style={{flex:1, justifyContent:"center", alignItems:"center"}}> 
        <Text style={{fontWeight:"bold", color:theme.colors.muted, fontSize:theme.fontSizes.large}}>No Posts Yet</Text>
      </View>
    )}
    
      {visiblePosts.map((post, index) => (
        
        <PostItem
          key={post.id}
          post={post}
          onLike={(post)=>handleLike(post,["postsforprofile", userId], queryClient)}
          onDislike={(post)=>handleDislike(post,["postsforprofile", userId], queryClient)}
          onSave={() => {}}
          onShare={()=>handleSend(post)}
          navigation={navigation}
          onContentPress={(post) => navigation.navigate("PostDetail", { id: post.id })}
          onPressOptions={(item) => {
            setSelectedPost(item);
            setPostMenuVisible(true);
          }}
          onPollUpdate={handlePollUpdate}
        />
      ))}

{isFetchingNextPage && (
                <View style={{alignItems: 'center', marginVertical: 20}}>
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                  <Text style={{color: theme.colors.muted, marginTop: 10}}>Loading more posts...</Text>
                </View>
              )}
      
      {/* Modals */}
      <PostOptionsModal
        visible={postMenuVisible}
        onClose={() => setPostMenuVisible(false)}
        onDelete={async () => {
          setPostMenuVisible(false);
          setIsDeleting(true);
          await DeletePost(selectedpost, queryClient);
          setIsDeleting(false);
          setReRenderTool(prevValue => prevValue + 1);
        }}
        onEdit={() => {
          navigation.navigate("EditPost", { initialPost: selectedpost });
          setPostMenuVisible(false);
        }}
        onShare={() => handleShared(selectedpost)}
        onViewProfile={() => {}}
        onBlock={() => {
          BlockUser(userId, { navigation });
          setPostMenuVisible(false);
        }}
        onReport={()=>{setPostMenuVisible(false);setType("Post"); setReportModalVisible(true)}}
        post={selectedpost}
        userId={auth.currentUser.uid}
      />
      
      <ProfileOptionsModal
        visible={profileMenuVisible}
        onClose={() => setProfileMenuVisible(false)}
        onUnfollow={() => {
          handleUnfollow(auth.currentUser.uid, userId);
          setProfileMenuVisible(false);
        }}
        onShare={() => {
          handleSharedProfile(userData);
          setProfileMenuVisible(false);
        }}
        onBlock={() => {
          BlockUser(userId, { navigation });
          setProfileMenuVisible(false);
        }}
        onReport={() => {setType("Profile");setProfileMenuVisible(false); setReportModalVisible(true)}}
        hasfollowed={userData.hasfollowed}
      />
      <ChatRequestModal
      targetId={userId}
      visible={chatRequestsModal} 
      onClose={()=>setChatRequestsModal(false)}
      reRender={()=>setReRenderTool(8)}
      displayName={userData.displayName}
      />
  
    </View>
  );

  const aboutContent = isBlocked || hasBlocked ? (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Text>No Information available</Text>
    </View>
  ) : (
    <View style={{
      paddingHorizontal: theme.spacing.horizontal.sm,
      paddingTop: theme.spacing.vertical.sm,
      gap: 20
    }}>
      <View style={{
        gap: 5,
        elevation: 3,
        backgroundColor: "snow",
        padding: theme.spacing.horizontal.md,
        borderRadius: 10
      }}>
        <Text style={{ fontWeight: "bold" }}>Currently Reading:</Text>
        <Text style={{ fontSize: theme.fontSizes.medium }}>
          {userData.currentlyReading}
        </Text>
      </View>
      <View style={{
        gap: 5,
        elevation: 3,
        backgroundColor: "snow",
        padding: theme.spacing.horizontal.md,
        borderRadius: 10
      }}>
        <Text style={{ fontWeight: "bold" }}>Favorite Authors:</Text>
        <Text style={{ fontSize: theme.fontSizes.medium }}>
          {userData.favAuthors?.join(", ") || ""}
        </Text>
      </View>
      <View style={{
        gap: 5,
        elevation: 3,
        backgroundColor: "snow",
        padding: theme.spacing.horizontal.md,
        borderRadius: 10
      }}>
        <Text style={{ fontWeight: "bold" }}>Favorite Genres:</Text>
        <Text style={{ fontSize: theme.fontSizes.medium }}>
          {userData.favGenres?.join(", ") || ""}
        </Text>
      </View>
    </View>
  );

  const tabs = [
    { label: "Posts", content: postsContent },
    { label: "About", content: aboutContent }
  ];
  

 

  
  

  const onProfileSectionLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setProfileHeight(height);
};
  const handleScroll = useCallback((event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const threshold = profileHeight - verticalScale(1);
    
    const shouldStick = scrollY >= threshold;
    
    if (shouldStick !== isSticky) {
        setIsSticky(shouldStick);
        
        if (shouldStick) {
            console.log("Header is now sticky!");
            setTrigger(true);
        } else {
            console.log("Header is no longer sticky");
           setTrigger(false);
        }
    }
    event.persist();

    thhrottleScroll(event);
}, [profileHeight, isSticky]);

const thhrottleScroll = useCallback(
  _.throttle((event)=>{
    const scrollY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

        
            
            
            
            const isNearBottom = scrollY + scrollViewHeight >= contentHeight - 300;
            if (isNearBottom && hasNextPage && !isFetchingNextPage) {
              console.log("Will fethch");
                fetchNextPage();
            }

            
            const scrollProgress = scrollY / Math.max(contentHeight - scrollViewHeight, 1);
            if (scrollProgress > 0.5 && renderLimit.current < posts.length) {
              setReRenderTool(10);
              renderLimit.current = Math.min(renderLimit.current + 3, posts.length);
      
        }
    }, 50), 
    [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]
);




 

  if (initializing) {
    return (
      <Container style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </Container>
    );
  }

if(isDeleting){
  return(
  
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}> 
    <ActivityIndicator color={theme.colors.primary} size={44} />

    </View>
    
  )}

  

    return(
        <Container>
    <View style={styles.headerRow}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
      <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
    </TouchableOpacity>
    <View style={{ flex: 1, flexDirection:"row" }} />

    {userId === auth.currentUser.uid ?(
      <TouchableOpacity 
    style={styles.headerIconRight}
    onPress={() => {navigation.navigate("Settings")}}
  >
    <Ionicons name="menu" size={22} color={theme.colors.text} />
  </TouchableOpacity>
    ):
    
    (
      <>

   {trigger && userData.isfollowing===false && userId!==auth.currentUser.uid ? (
     
    <Button onPress={handleFollow} buttonColor= {theme.colors.primary} textColor={theme.colors.text}mode="contained-tonal"   style={{
      borderRadius: moderateScale(5),
      width: horizontalScale(95),
    }}
    disabled={isBlocked}
    contentStyle={{
      height: verticalScale(39),
      paddingHorizontal: horizontalScale(1),
    }}> Follow </Button>
   
   ):(
    
    <TouchableOpacity 
    style={styles.headerIconRight}
    onPress={() => {setProfileMenuVisible(true)}}
  >
    <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
  </TouchableOpacity>
   )
  }
  </>
)}
  </View>


<SwipeableTabs
        tabs={tabs}
        profileSection={profileSection}
        onScroll={handleScroll}
        onProfileSectionLayout={onProfileSectionLayout}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={15}
      />
               <ReportProfileModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetId={type==="Profile"?userId:selectedpost.id}
        type={type}
      />
        <ShareBottomSheet
   post={sharedPost}
   bottomSheetRef={bottomSheetRef}
   bottomSheetVisible={bottomSheetVisible}
   onClose={ ()=>{
    setBottomSheetVisible(false);}}
   />

  </Container>
  
    
)
};

const styles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.horizontal.md,  
    },
    headerIconLeft: {
      padding: 8,
      paddingLeft: 0,
    },
    headerIconRight: {
      padding: 8,
      paddingRight: 0,
    },
    avatarContainer: {
        width: horizontalScale(80), // was 40
        height: verticalScale(80), // was 40
        borderRadius: moderateScale(40), // was 20
        backgroundColor: theme.colors.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: theme.spacing.horizontal.xs, // was sm
      },
      avatarText: {
        fontSize: theme.fontSizes.large, // was medium
        fontFamily: theme.fontFamily.bold,
        color: theme.colors.text,
      },
});

export default DisplayProfileScreen;