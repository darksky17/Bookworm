import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Share,
} from "react-native";
import theme from "../design-system/theme/theme";
import Container from "../components/Container";
import Header from "../components/Header";
import { useFetchPosts } from "../hooks/useFetchPosts";
import { auth, getDoc, doc, db } from "../Firebaseconfig";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils.js";
import { useSelector, useDispatch } from 'react-redux';
import PostOptionsModal from "../components/postOptionsModal.js";
import { BlockUser } from "../utils/blockuser.js";
import { DeletePost } from "../utils/deletepost.js";
import FilterChip from "../components/FilterChip.js";
import { SHARE_PREFIX } from "../constants/api";
import ReportProfileModal from "../components/reportProfileModal";
import { markNotificationsAsSeen } from "../utils/markbellpres.js";
import { setUnreadNotifCount } from "../redux/userSlice";
import { handleLike, handleDislike } from "../utils/postactions.js";
import { useQueryClient } from "@tanstack/react-query";
import ShareBottomSheet from "../components/ShareBottomSheet.js";
import { pollUpdate } from "../utils/pollUdate.js";
import PostsList from "../components/postsList.js";
import { useScrollToTop } from "@react-navigation/native";





const FeedScreen = ({ navigation }) => {

  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  
  const [activeFilters, setActiveFilters] = useState("");
    const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFetchPosts(activeFilters);
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const dispatch = useDispatch();
  const savedPosts = useSelector(state => state.user.savedPosts) || [];
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = auth.currentUser.uid;
  const filters = ["Following", "Controversial", "Most Liked"];
  const [userData, setUserData] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const unseenCount = useSelector(state=>state.user.unreadNotifCount);
  const queryClient = useQueryClient();



  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
const bottomSheetRef = useRef(null); // Control BottomSheet programmatically
const [sharedPost, setSharedPost] = useState(null);
  const toggleFilter = async (filter) => {

     if (activeFilters !== filter){
      setActiveFilters(filter);
     }
     else{
      setActiveFilters("");
     }

  
  };

  const posts = useMemo(() => {
    return data?.pages.flatMap(page => page.posts) || [];
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };


useFocusEffect(
  useCallback(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, "Users", auth.currentUser.uid);
      const docRefsnap = await getDoc(docRef);
      const data = docRefsnap.data();
      setUserData(data);
    };

    fetchUserData();
  }, []) 
);

  



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
      alert("Failed to share the post.");
    }
  };

  const handleSend = (post) => {
    setSharedPost(post);
    setBottomSheetVisible(true);
    bottomSheetRef.current?.expand(); // Opens the bottom sheet
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


  
 



  const handlePullToRefresh = async () => {
    setIsPullingToRefresh(true);
    try {
      console.log('Refetching...');
      await refetch();
      console.log('Refetch completed');
    } catch (error) {
      console.error('Refetch failed', error);
    } finally {
      setIsPullingToRefresh(false);
    }
  };

  

  
  useFocusEffect(
    useCallback(() => {
      refetch();  // Refetch when screen is focused
    }, [refetch])
  );





  if (isLoading && posts.length === 0 && !isRefetching) {
    // Only show loading indicator if it's the initial load and not a background refetch
    return (
      <Container>
        <Header title={"Feed"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header title={"Feed"} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{"Failed to load posts"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start"}}>
      <Header title={"Feed"} />
      <View style={{   paddingTop: verticalScale(10),
    paddingBottom: verticalScale(10),
    paddingRight: horizontalScale(20),}}>
      <TouchableOpacity style={{ position:"relative"}} onPress={async ()=>{ navigation.navigate("Notifications"); await markNotificationsAsSeen(); dispatch(setUnreadNotifCount(0));}}> 
        
      {unseenCount>0 &&(
      <View
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        zIndex: 1,
        height: 18,
        minWidth: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: 10, fontWeight: "bold" }}>
        {unseenCount}
      </Text>
    </View>    
    )}
        <Ionicons  name="notifications-outline" size={26 } color={theme.colors.text}  />
        
      </TouchableOpacity>

      </View>
      </View>
      {isDeleting &&(    <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Deleting post...</Text>
        </View>)}
        <View style={{paddingHorizontal:theme.spacing.horizontal.xs, justifyContent:"space-evenly",  flexDirection:"row", marginVertical:theme.spacing.vertical.md}}>
        {filters.map(filter => (
    <FilterChip
      key={filter}
      label={filter}
      isActive={activeFilters === filter}
      onPress={() => toggleFilter(filter)}
    />
  ))}
          </View>


<PostsList
        ref={scrollRef}
        posts={posts}
        navigation={navigation}
        onLike={(postId) => 
          handleLike(postId, ["posts", activeFilters], queryClient)}
        
        onDislike={(postId) => 
          handleDislike(postId, ["posts", activeFilters], queryClient)}
        onShare={(post)=>{handleSend(post)}}
        onContentPress={(post) => navigation.navigate("PostDetail", { id: post.id })}
        onPollUpdate={handlePollUpdate}
        onPressOptions={(item) => {
            setSelectedPost(item);
            setPostMenuVisible(true);
          }}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isPullingToRefresh}
          onRefresh={handlePullToRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
          
      /> {isFetchingNextPage&&(
        <View style={{justifyContent:"center", alignItems:"center"}}>
          <Text>Loading more posts</Text>
        </View>
      )}
    
      <PostOptionsModal
  visible={postMenuVisible}
  onClose={() => setPostMenuVisible(false)}
  onDelete={async ()=>{ setPostMenuVisible(false); setIsDeleting(true); await DeletePost(selectedpost, queryClient); await refetch(); setIsDeleting(false); }}
  onEdit={() => {navigation.navigate("EditPost", { initialPost : selectedpost }); setPostMenuVisible(false)}}
  onShare={()=>{handleShared(selectedpost)}}
  onViewProfile={() =>{navigation.navigate("DisplayProfile", {userId: selectedpost.authorId}); setPostMenuVisible(false)}}
  onBlock={ async ()=> { await BlockUser(selectedpost.authorId, {navigation}); await refetch(); setPostMenuVisible(false)}}
  onReport={() =>{setReportModalVisible(true)}}
  post={selectedpost}
  userId={userId}

/>
<ReportProfileModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetId={selectedpost.id}
        type={"Post"}
      />



   <ShareBottomSheet
   post={selectedpost}
   bottomSheetRef={bottomSheetRef}
   bottomSheetVisible={bottomSheetVisible}
   onClose={ ()=>{
    setBottomSheetVisible(false);
    setSharedPost(null);}}
   />

    </Container>
    
  );
};

const styles = StyleSheet.create({
 
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.vertical.lg,
  },
  loadingText: {
    marginTop: theme.spacing.vertical.sm,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.vertical.lg,
  },
  errorText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.vertical.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.vertical.sm,
    paddingHorizontal: theme.spacing.horizontal.lg,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: "white",
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
  },

});

export default FeedScreen;
