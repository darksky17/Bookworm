import React, {useRef, useState, useCallback, useEffect} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable, Share, Alert, ActivityIndicator } from "react-native";
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
import { BlockUser } from "../functions/blockuser";
import { DeletePost } from "../functions/deletepost";
import Header from "../components/Header";
import { SHARE_PREFIX } from "../constants/api";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import PagerView from 'react-native-pager-view';

const TabDisplayProfileScreen = ({navigation})=>{
    
    const route = useRoute();
    const { userId } = route.params; 
    const [renderAbout, setRenderAbout] = useState(false);

  const [posts, setPosts] = useState([]);
  const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState();
  const [isSticky, setIsSticky] = useState(false);
  const [profileHeight, setProfileHeight] = useState(0);
  const [trigger, setTrigger] = useState(false);
  const [initializing, setInitializng] = useState(true);
  const [userData, setUserData] = useState([]);
  const [isfollowing, setIsFollowing] =useState(false);
  const [ isBlocked, setIsBlocked] = useState(false);
  const [ hasBlocked, setHasBlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  

  

  
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

  const handleSharedProfile = async (profile) => {
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
  };

  const handleDislike = async (postId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${postId}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      setReRenderTool(prevValue => prevValue + 1);
    } catch (error) {
      alert("Failed to dislike post.");
    }
  };

  const handleLike = async (postId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      setReRenderTool(prevValue => prevValue + 1);
    } catch (error) {
      alert("Failed to like post.");
    }
  };

  handleFollow = async ()=>{

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

  handleUnfollow = async (overrideuser, overridefollower)=>{

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


  const onProfileSectionLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    setProfileHeight(height);
};
  const handleScroll = (event) => {
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
};




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
          setIsBlocked(data.hasbeenblocked);
          setHasBlocked(data.hasblocked);
  
          if (!data.hasbeenblocked && !data.hasblocked) {
            fetchPosts();
          } else {
            setPosts([]); // clear posts if blocked
          }
  
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        } finally {
          if (isActive) setInitializng(false);
        }
      };
  
      const fetchPosts = async () => {
        try {
          const idToken = await auth.currentUser.getIdToken();
          const res = await fetch(`${SERVER_URL}/posts/profile/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          });
          const data = await res.json();
          data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          if (isActive) setPosts(data);
        } catch (err) {
          console.error('Failed to fetch posts:', err);
        }
      };
  
      fetchUserData();
  
      return () => {
        isActive = false;
      };
    }, [rerendertool, userId])
  );

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

  const swipeGesture = Gesture.Pan()
  .onEnd((event) => {
    if (event.translationX < -50) {
      console.log("Swiped Left");
      runOnJS(setRenderAbout)(true);
    } else if (event.translationX > 50) {
      runOnJS(setRenderAbout)(false);
    }
  }).activeOffsetX([-10, 10]);




  

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
  <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false} scrollEventThrottle={15} onScroll={handleScroll}>
  <View style={{alignItems:"center", justifyContent:"center", paddingTop:theme.spacing.vertical.md, gap:verticalScale(10)}} onLayout={onProfileSectionLayout}>

  <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {("U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>{userData.displayName}</Text>
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:horizontalScale(55), paddingTop:theme.spacing.vertical.md}}>
                <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>{posts.length}</Text>
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
    <TouchableOpacity style={{flex:0.5, borderBottomWidth: renderAbout? 0:1, justifyContent:"center", alignItems:"center"}} onPress={()=>{setRenderAbout(false)}}>
    <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>Posts</Text>
    </TouchableOpacity> 
    <TouchableOpacity style={{flex:0.5, alignItems:"center", borderBottomWidth: renderAbout? 1:0}} onPress={()=>{setRenderAbout(true)}}>
    <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>About</Text>
    </TouchableOpacity>
    
</View>
</View>


{/* <View>

  
{renderAbout ? (

        <View style={{    paddingHorizontal: theme.spacing.horizontal.sm,
    paddingTop: theme.spacing.vertical.sm, gap:20}} key={1}>

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

 ) : ( 

  <View style={{    paddingHorizontal: theme.spacing.horizontal.xs,
    paddingBottom: theme.spacing.vertical.xs,}} key={2}> */}

{/* <PostsList
        posts={posts}
        navigation={navigation}
        onLike={handleLike}
        onDislike={handleDislike}
        onSave={()=>{}}
        onShare={()=>{handleShared}}
        onContentPress={(post) => navigation.navigate("PostDetail", { post })}
        onPressOptions={(item) => {
            setSelectedPost(item);
            setPostMenuVisible(true);
          }}
      
          
      /> */}


{/* {posts.map((post, index) => (
 
        <PostItem
          key={post.id}
          post={post}
          onLike={handleLike}
          onDislike={handleDislike}
          onSave={()=>{}}
          onShare={()=>{handleShared}}
          navigation={navigation}
          onContentPress={(post) => navigation.navigate("PostDetail", { post })}
          onPressOptions={(item) => {
              setSelectedPost(item);
              setPostMenuVisible(true);
            }}
         
        />
      ))}
    
<PostOptionsModal
        visible={postMenuVisible}
        onClose={() => setPostMenuVisible(false)}
        onDelete={async () => {
          setPostMenuVisible(false);
          setIsDeleting(true);
          await DeletePost(selectedpost);
          setReRenderTool(prevValue => prevValue + 1);
          setIsDeleting(false);
        }}
        onEdit={() => {
          navigation.navigate("EditPost", { initialPost: selectedpost });
          setPostMenuVisible(false);
        }}
        onShare={() => { handleShared(selectedpost) }}
        onViewProfile={() => {}}
        onBlock={() =>{ BlockUser(userId, {navigation}); setPostMenuVisible(false)} }
        onReport={() => console.log("Report post")}
        post={selectedpost}
        userId={auth.currentUser.uid}
      />




</View>


 )} 
  

  </View> */}

<PagerView 
  style={{flex:1}} 
  initialPage={0}
 
>
  
  {/* Posts Page */}
  <View 
    style={{    
      paddingHorizontal: theme.spacing.horizontal.xs,
      paddingBottom: theme.spacing.vertical.xs,
      flex:1
    }} 
    key={1}
  >

{posts.map((post, index) => (
        <PostItem
          key={post.id}
          post={post}
          onLike={handleLike}
          onDislike={handleDislike}
          onSave={()=>{}}
          onShare={()=>{handleShared}}
          navigation={navigation}
          onContentPress={(post) => navigation.navigate("PostDetail", { post })}
          onPressOptions={(item) => {
              setSelectedPost(item);
              setPostMenuVisible(true);
            }}
         
        />
      ))}
    
<PostOptionsModal
        visible={postMenuVisible}
        onClose={() => setPostMenuVisible(false)}
        onDelete={async () => {
          setPostMenuVisible(false);
          setIsDeleting(true);
          await DeletePost(selectedpost);
          setReRenderTool(prevValue => prevValue + 1);
          setIsDeleting(false);
        }}
        onEdit={() => {
          navigation.navigate("EditPost", { initialPost: selectedpost });
          setPostMenuVisible(false);
        }}
        onShare={() => { handleShared(selectedpost) }}
        onViewProfile={() => {}}
        onBlock={() =>{ BlockUser(userId, {navigation}); setPostMenuVisible(false)} }
        onReport={() => console.log("Report post")}
        post={selectedpost}
        userId={auth.currentUser.uid}
      />

</View>

  {/* About Page */}
  <View 
    style={{    
      paddingHorizontal: theme.spacing.horizontal.sm,
      paddingTop: theme.spacing.vertical.sm, 
      gap:20,
      flex:1
    }} 
    key={2}
  >

  <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Currently Reading:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.currentlyReading}</Text>
  </View>
  <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Favorite Authors:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.favAuthors?.join(",  ") || "None listed"}</Text>
  </View>
  <View style={{gap:5, elevation:3, backgroundColor:"snow", padding:theme.spacing.horizontal.md, borderRadius:10}}>
    <Text style={{fontWeight:"bold"}}> Favorite  Genres:</Text>
   <Text style={{fontSizes:theme.fontSizes.medium}}>{userData.favGenres?.join(",  ") || "None listed"}</Text>
  </View>

</View>

  </PagerView>


   
  </ScrollView>
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

export default TabDisplayProfileScreen;