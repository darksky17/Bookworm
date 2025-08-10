import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Share,
  Image,
  Dimensions
} from "react-native";
import theme from "../design-system/theme/theme";
import Container from "../components/Container";
import Header from "../components/Header";
import { useFetchPosts } from "../hooks/useFetchPosts";
import { auth, getDoc, doc, db } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils.js";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { setSavedPosts } from '../redux/userSlice';
import ImageView from "react-native-image-viewing";
import PostOptionsModal from "../components/postOptionsModal.js";
import { BlockUser } from "../functions/blockuser.js";
import { DeletePost } from "../functions/deletepost.js";
import FilterChip from "../components/FilterChip.js";
import { SHARE_PREFIX } from "../constants/api";
import ReportProfileModal from "../components/reportProfileModal";

const PostItem = ({ post, onLike, onDislike, onSave, onShare, onContentPress, isSaved, onBookmark, onPressOptions, navigation }) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selected, setSelected] = useState();
  const screenWidth = Dimensions.get('window').width;
  const IMAGE_ASPECT_RATIO = 4 / 5;
  const CONTAINER_WIDTH = screenWidth * 0.85;
const CONTAINER_HEIGHT = CONTAINER_WIDTH / IMAGE_ASPECT_RATIO;



  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(diff / (30 * 86400000));  
    const years = Math.floor(diff / (365 * 86400000));

    if(years> 0) return `${years}mo ago`;
    if(months> 0) return `${months}mo ago`;
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const userId = auth.currentUser?.uid;
  const hasLiked = post.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(userId);
  const hasDisliked = post.dislikedBy && Array.isArray(post.dislikedBy) && post.dislikedBy.includes(userId);

  return (
    <View style={styles.postContainer}>
      {/* Post Author Header */}
      <View style={styles.authorHeader}>
        <TouchableOpacity style={styles.authorInfo}  onPress={()=>navigation.navigate("DisplayProfile", {userId:post.authorId})}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(post.displayName || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.displayName}>{post.displayName || "Unknown User"}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(post.timestamp)}{post.edited ? <Text style={{fontWeight:"bold"}}> - Edited</Text>:""}
            </Text>
          </View> 
        </TouchableOpacity>
        <View style={{flexDirection:"row", gap:5}}>
        <View style={styles.postTypeContainer}>
          <Text style={styles.postType}>{post.type}</Text>
          
        </View>
        <TouchableOpacity 
          style={styles.headerIconRight}
          onPress={() => onPressOptions(post)}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Title/Book Info */}
      {post.type === "BookReview" ? (
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{post.BookTitle}</Text>
          <Text style={styles.bookAuthor}>by {post.BookAuthor}</Text>
        </View>
      ) : (
        <View style={styles.discussionInfo}>
          <Text style={styles.discussionTitle}>{post.title}</Text>
        </View>
      )}

      {/* Post Content - make this area touchable */}
      <TouchableOpacity onPress={() => onContentPress(post)} activeOpacity={0.7}>
        <Text style={styles.postContent}>{post.Content}</Text>
      </TouchableOpacity>

      {post.images?.length > 0 && (
        
 
 <>      


<FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ alignItems: 'center', justifyContent:"center", gap:9 }}
      data={post.images}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={({ item, index }) => {


        return (
          <View style={{ paddingVertical: theme.spacing.vertical.sm }}>
          <TouchableOpacity
            onPress={() => {
              setSelected(index);
              setImageViewerVisible(true);
            }}
          >
              <Image
                source={{ uri: item }}
                style={{
                  width: CONTAINER_WIDTH,
                  height: CONTAINER_HEIGHT,
                  borderRadius: theme.borderRadius.lg,
                  
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View
          style={{
            position: 'absolute', // Absolute positioning for exact placement
            right: 10, // Align to the right edge
            bottom: 15, // You can adjust vertical positioning
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 10, // Add some padding for the text
            borderRadius:theme.borderRadius.lg
          }}
        >
          <Text style={{ color: 'white' }}>{index+1}/{post.images.length}</Text>
        </View>
          </View>
        );
      }}
    />
         
    
   <ImageView
  images={post.images.map((uri) => ({ uri }))}
  imageIndex={selected}
  visible={imageViewerVisible}
  onRequestClose={() => setImageViewerVisible(false)}

/>
</>
  
)}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Post Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons
            name={hasLiked ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={hasLiked ? theme.colors.primary : "black"}
          />
          <Text style={styles.actionText}>{post.Likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDislike(post.id)}
        >
          <Ionicons
            name={hasDisliked ? "thumbs-down" : "thumbs-down-outline"}
            size={20}
            color={hasDisliked ? theme.colors.primary : "black"}
          />
          <Text style={styles.actionText}>{post.Dislikes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => onContentPress(post)}>
          <FontAwesome5 name="comment" size={20} color="black" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
        >
        <Ionicons name="share-social-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeedScreen = ({ navigation }) => {
  const { data: posts = [], isLoading, error, refetch, isRefetching } = useFetchPosts();
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const dispatch = useDispatch();
  const savedPosts = useSelector(state => state.user.savedPosts) || [];
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = auth.currentUser.uid;
  const [activeFilters, setActiveFilters] = useState("");
  const filters = ["Following", "Controversial", "Most Liked"];
  const [userData, setUserData] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const toggleFilter = async (filter) => {

     if (activeFilters !== filter){
      setActiveFilters(filter);
     }
     else{
      setActiveFilters("");
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

  const filteredPosts = useMemo(() => {
    if (!userData) return posts; 
  
    switch (activeFilters) {
      case 'Following':
        return posts.filter((item) => userData.following?.includes(item.authorId));
      
      case 'Controversial':
        return [...posts].sort((a, b) => {
         
          if (a.Dislikes > 0 && b.Dislikes > 0) {
            const scoreA = (a.Likes || 0) + (a.Dislikes || 0);
            const scoreB = (b.Likes || 0) + (b.Dislikes || 0);
            return scoreB - scoreA;  
          }
          
          
          if (a.Dislikes > 0 && b.Dislikes === 0) {
            return -1; 
          }
          
          
          if (a.Dislikes === 0 && b.Dislikes > 0) {
            return 1; 
          }
      
          return 0; 
        });
  
      case 'Most Liked':
        return [...posts].sort((a, b) => b.Likes - a.Likes);
  
      default:
        return posts; 
    }
  }, [posts, activeFilters, userData]); 



  const handleShared = async (post) => {
    try {
      const shareUrl = `${SHARE_PREFIX}/posts/${post.id}`;
      const shareTitle = post.type === "BookReview" 
        ? `Check out "${post.BookTitle}"`
        : `Check out "${post.title}"`;
      const message = `${post.Content?.slice(0, 100)}...\n\nCheck this out on Bookworm:\n${shareUrl}`;
  
      await Share.share({
        message: message,
        url: shareUrl,
        title: shareTitle,
      });
  
      setPost((prev) => ({ ...prev, Shares: prev.Shares + 1 }));
    } catch (error) {
      alert("Failed to share the post.");
    }
  };

  
 



  const handlePullToRefresh = async () => {
    setIsPullingToRefresh(true);
    await refetch();
    setIsPullingToRefresh(false);
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
      refetch();
    } catch (error) {
      alert("Failed to like post.");
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
      refetch();
    } catch (error) {
      alert("Failed to dislike post.");
    }
  };

  const handleSave = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, Saved: post.Saved + 1 } : post
      )
    );
  };

  
  useFocusEffect(
    useCallback(() => {
      refetch();  // Refetch when screen is focused
    }, [refetch])
  );

  const handleContentPress = (post) => {
    navigation.navigate('PostDetail', { id: post.id });
  };

  const handleBookmark = async (postId) => {
    const isSaved = savedPosts.includes(postId);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const method = isSaved ? 'DELETE' : 'POST';
      await fetch(`${SERVER_URL}/posts/users/me/savedPosts/${postId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      let newSavedPosts;
      if (isSaved) {
        newSavedPosts = savedPosts.filter(pid => pid !== postId);
      } else {
        newSavedPosts = [...savedPosts, postId];
      }
      dispatch(setSavedPosts(newSavedPosts));
    } catch (e) {
      alert('Failed to update bookmark');
    }
  };

  const renderPost = ({ item }) => (
    <PostItem
      post={item}
      onLike={handleLike}
      onDislike={handleDislike}
      onSave={handleSave}
      onShare={()=>{handleShared(item)}}
      onContentPress={handleContentPress}
      isSaved={savedPosts.includes(item.id)}
      onBookmark={handleBookmark}
      onPressOptions={(item)=>{setSelectedPost(item);setPostMenuVisible(true);}}
      navigation={navigation}
    />
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
          <Text style={styles.errorText}>{error.message || "Failed to load posts"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <Header title={"Feed"} />
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
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContainer}
        refreshControl={
          <RefreshControl
            refreshing={isPullingToRefresh}
            onRefresh={handlePullToRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share a book review!</Text>
          </View>
        }
      />
      <PostOptionsModal
  visible={postMenuVisible}
  onClose={() => setPostMenuVisible(false)}
  onDelete={async ()=>{ setPostMenuVisible(false); setIsDeleting(true); await DeletePost(selectedpost); await refetch(); setIsDeleting(false); }}
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
    </Container>
    
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    paddingHorizontal: theme.spacing.horizontal.sm, // was md
    paddingBottom: theme.spacing.vertical.sm, // was md
  },
  postContainer: {
    backgroundColor: "white",
    borderRadius: theme.borderRadius.sm, // was md
    padding: theme.spacing.vertical.md, // was md
    marginBottom: theme.spacing.vertical.sm, // was md
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2, // was 3.84
    elevation: 3, // was 5
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.vertical.xs, // was sm
  },
  authorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.vertical.sm, // was md
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap:10,
    flex: 1,
  },
  avatarContainer: {
    width: horizontalScale(32), // was 40
    height: verticalScale(32), // was 40
    borderRadius: moderateScale(16), // was 20
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.horizontal.xs, // was sm
  },
  avatarText: {
    fontSize: theme.fontSizes.medium, // was medium
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  authorDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: theme.fontSizes.medium, // was medium
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 1, // was 2
  },
  postTypeContainer: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.horizontal.xs, // was sm
    paddingVertical: theme.spacing.vertical.xs,
    borderRadius: theme.borderRadius.sm,
  },
  postType: {
    fontSize: moderateScale(9), // was small
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
  },
  bookInfo: {
    marginBottom: theme.spacing.vertical.xs, // was sm
  },
  bookTitle: {
    fontSize: theme.fontSizes.medium, // was large
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.xs,
  },
  bookAuthor: {
    fontSize: theme.fontSizes.small, // was medium
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.muted,
  },
  discussionInfo: {
    marginBottom: theme.spacing.vertical.xs, // was sm
  },
  discussionTitle: {
    fontSize: theme.fontSizes.medium, // was large
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.xs,
  },
  timestamp: {
    fontSize: theme.fontSizes.xs || 10, // was small
    color: theme.colors.muted,
    fontFamily: theme.fontFamily.regular,
  },
  postContent: {
    fontSize: theme.fontSizes.small, // was medium
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: theme.fontSizes.small * 1.4, // was medium
    marginBottom: theme.spacing.vertical.sm, // was md
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.vertical.xs, // was md
  },
  tag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.horizontal.xs, // was sm
    paddingVertical: theme.spacing.vertical.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.horizontal.xs,
    marginBottom: theme.spacing.vertical.xs,
  },
  tagText: {
    fontSize: theme.fontSizes.xs || 10, // was small
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: theme.spacing.vertical.xs, // was sm
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  actionButton: {
    paddingHorizontal: theme.spacing.horizontal.xs, // was sm
    paddingVertical: theme.spacing.vertical.xs,
  },
  actionText: {
    fontSize: theme.fontSizes.small, // was medium
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.muted,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.vertical.lg,
  },
  emptyText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.muted,
    textAlign: "center",
    marginBottom: theme.spacing.vertical.sm,
  },
  emptySubtext: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
    textAlign: "center",
  },
});

export default FeedScreen;
