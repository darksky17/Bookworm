import React, {useRef, useState, useCallback, useEffect, useMemo} from "react";
import { useFocusEffect, isFocused } from "@react-navigation/native";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, Share, ActivityIndicator } from "react-native";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { moderateScale, horizontalScale, verticalScale } from "../design-system/theme/scaleUtils";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";
import PostsList from "../components/postsList";
import { PostItem } from "../components/postsList";
import PostOptionsModal from "../components/postOptionsModal";
import ProfileOptionsModal from "../components/profileOptionsModal";
import { BlockUser } from "../utils/blockuser";
import { DeletePost } from "../utils/deletepost";
import Header from "../components/Header";
import { SHARE_PREFIX } from "../constants/api";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS, runOnUI, useSharedValue, useAnimatedStyle, withSpring} from "react-native-reanimated";
import Animated from 'react-native-reanimated';
import { useFetchPostsForProfile } from "../hooks/useFetchPostsForProfile";
import _ from 'lodash';
import { useQueryClient } from "@tanstack/react-query";
import { handleLike, handleDislike } from "../utils/postactions";
import ShareBottomSheet from "../components/ShareBottomSheet";
import { pollUpdate } from "../utils/pollUdate";
import { useScrollToTop } from "@react-navigation/native";

const TabDisplayProfileScreen = ({navigation})=>{
    
    const route = useRoute();
    const  userId  = auth.currentUser.uid; 
    const queryClient = useQueryClient();
  // const [posts, setPosts] = useState([]);
  const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState();
  const [isSticky, setIsSticky] = useState(false);
  const [profileHeight, setProfileHeight] = useState(0);
  const [initializing, setInitializng] = useState(true);
  const [userData, setUserData] = useState([]);
  const [isfollowing, setIsFollowing] =useState(false);
  const [ isBlocked, setIsBlocked] = useState(false);
  const [ hasBlocked, setHasBlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const currentTabRef = useRef(currentTab);
  const screenWidth = Dimensions.get('window').width;
  const translateX = useSharedValue(0);
  const AnimatedView = Animated.createAnimatedComponent(View);
  const scrollRef = useRef(null);
  const [scrollPos, setScrollPos] = useState(null)  ;
  const scrollYSwipe = useRef(0);
  useScrollToTop(scrollRef);
  const renderLimit = useRef(5);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const bottomSheetRef = useRef(null); // Control BottomSheet programmatically
  const [sharedPost, setSharedPost] = useState(null);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    postsCount
  } = useFetchPostsForProfile(userId);

  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || [];
}, [data]);



  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Clear the ref when the tab loses focus
      renderLimit.current = 5;
    });
  
    return unsubscribe; // Clean up the listener
  }, [navigation]);

  const visiblePosts = useMemo(() => {
    return posts.slice(0, renderLimit.current);
}, [posts, renderLimit.current]);

  

  
  const handleShared = useCallback( async (post) => {
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
  }, []);

  const handleSend = (post) => {
    setSharedPost(post);
    setBottomSheetVisible(true);
    bottomSheetRef.current?.expand(); // Opens the bottom sheet
  };


  const handleSharedProfile = useCallback( async (profile) => {
    try {
      const shareUrl = `${SHARE_PREFIX}/profile/${auth.currentUser.uid}`;
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
  }, []);

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




const handleFollow = useCallback(async ()=>{

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

  }, []);

  const handleUnfollow = useCallback(async (overrideuser, overridefollower)=>{

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

  }, [userId]);


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
        

    }

   

    event.persist();

    // const contentHeight = event.nativeEvent.contentSize.height;
    // const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    // if(currentTab ===0){
    //   scrollYSwipe.current = scrollY;
    //   const isNearBottom = scrollY + scrollViewHeight >= contentHeight - 100;
  
     
    // if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      
    //   fetchNextPage();
    // }
  
    // const scrollProgress = scrollY / Math.max(contentHeight - scrollViewHeight, 1);
    // if (scrollProgress > 0.7 && renderLimit.current < posts.length) {
    //   renderLimit.current= Math.min(renderLimit.current +  1, posts.length);
    // }
    //   }

    thhrottleScroll(event);
 
      
}, [profileHeight, isSticky]);

useEffect(() => {
  currentTabRef.current = currentTab;
}, [currentTab]);

const thhrottleScroll = useCallback(
  _.throttle((event)=>{
    const scrollY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

        if(currentTabRef.current === 0){
          console.log("Im tab 0");
            scrollYSwipe.current = scrollY;
            console.log(scrollYSwipe);
            
            
            const isNearBottom = scrollY + scrollViewHeight >= contentHeight - 300;
            if (isNearBottom && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }

            
            const scrollProgress = scrollY / Math.max(contentHeight - scrollViewHeight, 1);
            if (scrollProgress > 0.5 && renderLimit.current < posts.length) {
              setReRenderTool(10);
                renderLimit.current = Math.min(renderLimit.current + 3, posts.length);
            }
        }
    }, 50), 
    [currentTab, hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]
);






  useFocusEffect(
    useCallback(() => {
      let isActive = true;
  
      const fetchUserData = async () => {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const res = await fetch(`${SERVER_URL}/displayprofile/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ followerId: auth.currentUser.uid }),
          });
  
          const data = await res.json();
         
          if (!isActive) return;
         
  
          setUserData(data);
     
  
            // fetchPosts();
          
  
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        } finally {
          if (isActive) setInitializng(false);
        }
      };
  

  
      fetchUserData();
  
      return () => {
        isActive = false;
      };
    }, [rerendertool, userId])
  );

  const SelfButtons = () => (
    <>
      <Button
        buttonColor={theme.colors.primary}
        textColor={theme.colors.text}
        mode="contained-tonal"
        style={{ borderRadius: 5, flex: 0.5 }}
        onPress={()=>{handleSharedProfile(userData)}}
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
  );



  const scrollToProfile = (newTab) => {

    if(newTab ===1){
    

    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
    else{
      
      scrollRef.current?.scrollTo({ x: 0, y: scrollYSwipe.current, animated: true });
   
    }
  };
  
  const swipeGesture = Gesture.Pan().activeOffsetX([-15,15]).failOffsetY([-10,10]).onUpdate((event) => {

    const newTranslateX = -currentTab * screenWidth + event.translationX;

      translateX.value = newTranslateX;
      

   
  }).onEnd((event)=>{
    const swipeThreshold = screenWidth * 0.25;
    let newTab = currentTab;

    if(event.translationX > swipeThreshold && currentTab > 0){
      newTab = 0;
  } else if(event.translationX<-swipeThreshold && currentTab < 1){
     newTab = 1;
  }

  translateX.value = withSpring(-newTab * screenWidth, {
    stiffness: 100,
    damping: 8,
  });



if(newTab !== currentTab){

  
    runOnJS(scrollToProfile)(newTab);
    

runOnJS(setCurrentTab)(newTab);

}


});

const animatedStyle = useAnimatedStyle(() => {
  return {
    transform: [{ translateX: translateX.value }],
  };
});






const handleTabPress = (tabIndex) => {
  translateX.value = withSpring(-tabIndex * screenWidth, {
    stiffness: 100,
    damping: 8,
  });
  if(currentTab === 0){
  scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false});
  }
  else{
    scrollRef.current?.scrollTo({ x: 0, y: scrollYSwipe.current, animated: true });
  }
  runOnJS(setCurrentTab)(tabIndex);
 
 
};



if (initializing) {
  return (
    <Container style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </Container>
  );
}

if (isDeleting) {
  return (
    <Container style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator color={theme.colors.primary} size="large" />
  </Container>
  );
}




    return(
        <Container>
    <View style={styles.headerRow}>
    <Header title={"Profile"} style={{width:"20%"}} />


   
      <TouchableOpacity 
    style={styles.headerIconRight}
    onPress={() => {navigation.navigate("Settings")}}
  >
    <Ionicons name="menu" size={22} color={theme.colors.text} />
  </TouchableOpacity>
  
    
   
  </View>
  <ScrollView ref={scrollRef} stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} scrollEventThrottle={15} onScroll={handleScroll} scrollEnabled={currentTab===0}>
  <View style={{alignItems:"center", justifyContent:"center", paddingTop:theme.spacing.vertical.md, gap:verticalScale(10)}} onLayout={onProfileSectionLayout}>

  <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {userData.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>{userData.displayName}</Text>
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:horizontalScale(55), paddingTop:theme.spacing.vertical.md}}>
                <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>{data?.pages[0]?.postsCount || 0}</Text>
                   <Text style={{color:theme.colors.muted}}>Posts</Text>
                    </View>
                    <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>{userData.followers.length}</Text>
                    <Text style={{color:theme.colors.muted}}>Followers</Text>
                    </View>
                    <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>{userData.following.length}</Text>
                    <Text style={{color:theme.colors.muted}}>Following</Text>
                    </View>

                </View>

                <View style={{paddingTop:theme.spacing.vertical.md, flexDirection:"row", gap:horizontalScale(20), paddingHorizontal:horizontalScale(16)}}> 
            
              
  <SelfButtons theme={theme} />

 

                </View>
                
  </View>
  <View style={{backgroundColor:theme.colors.background, flex:1, marginTop:theme.spacing.vertical.lg, borderRadius:5}}>
<View style={{flexDirection:"row", paddingVertical:theme.spacing.vertical.md}}>
    <TouchableOpacity style={{flex:0.5, borderBottomWidth: currentTab? 0:1, justifyContent:"center", alignItems:"center"}} onPress={()=>{handleTabPress(0)}}>
    <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>Posts</Text>
    </TouchableOpacity> 
    <TouchableOpacity style={{flex:0.5, alignItems:"center", borderBottomWidth: currentTab? 1:0}} onPress={()=>{handleTabPress(1)}}>
    <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>About</Text>
    </TouchableOpacity>
    
</View>
</View>



  
  <GestureDetector gesture={swipeGesture}>
    <AnimatedView style={[{ flex:1, flexDirection:"row", width:screenWidth *2}, animatedStyle]}>
   <View style={{flex:1, width:screenWidth, paddingHorizontal:theme.spacing.horizontal.xs}}>
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
   onSave={()=>{}}
   onShare={()=>{handleSend(post)}}
   navigation={navigation}
   onContentPress={(post) => navigation.navigate("PostDetail", { id:post.id })}
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


<PostOptionsModal
 visible={postMenuVisible}
 onClose={() => setPostMenuVisible(false)}
 onDelete={async () => {
   setPostMenuVisible(false);
   setIsDeleting(true);
   await DeletePost(selectedpost, queryClient);
   setReRenderTool(prevValue => prevValue + 1);
   setIsDeleting(false);
 }}
 onEdit={() => {
   navigation.navigate("EditPost", { initialPost: selectedpost });
   setPostMenuVisible(false);
 }}
 onShare={() => { handleShared(selectedpost); setPostMenuVisible(false) }}
 onViewProfile={() => {}}
 onBlock={() =>{ BlockUser(userId, {navigation}); setPostMenuVisible(false)} }
 onReport={() => console.log("Report post")}
 post={selectedpost}
 userId={auth.currentUser.uid}
/>
    </View>
    <View style={{overflow: "hidden", width:screenWidth, paddingHorizontal:theme.spacing.horizontal.sm, gap:20}}>
    <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Currently Reading:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.currentlyReading}</Text>
  </View>
  <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Favorite Authors:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.favAuthors.join(",  ")}</Text>
  </View>
  <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Favorite  Genres:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.favGenres.join(",  ")}</Text>
  </View>
    </View>
    </AnimatedView>
  </GestureDetector>



   
  </ScrollView>
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
      justifyContent:"space-between",
      paddingRight:theme.spacing.horizontal.md
  
    },
    headerIconLeft: {
      padding: 8,
      paddingLeft: 0,
    },
    headerIconRight: {
      alignSelf:"center",
      paddingLeft: 8,
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

export default TabDisplayProfileScreen;