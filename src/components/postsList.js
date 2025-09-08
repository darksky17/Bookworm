import React, { useState } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
  Image,
  Dimensions
} from "react-native";
import theme from "../design-system/theme/theme.js";
import { auth } from "../Firebaseconfig.js";
import { SERVER_URL } from "../constants/api.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils.js";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useSelector, useDispatch } from 'react-redux';
import { setSavedPosts } from '../redux/userSlice.js';
import ImageView from "react-native-image-viewing";

export const PostItem = ({ post, onLike, onDislike, onSave, onShare, onContentPress, isSaved, onBookmark, onPressOptions, navigation }) => {
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selected, setSelected] = useState();
  const screenWidth = Dimensions.get('window').width;
  const IMAGE_ASPECT_RATIO = 4 / 5;
  const CONTAINER_WIDTH = screenWidth * 0.85;
  const CONTAINER_HEIGHT = CONTAINER_WIDTH / IMAGE_ASPECT_RATIO;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
  
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMs = now - commentTime;
    const diffInSeconds = Math.floor(diffInMs / 1000);
  
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }
  
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
  
    const diffInHours = Math.floor(diffInMinutes / 60);
    if(diffInHours<24){
    return `${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if(diffInDays < 7){
    return `${diffInDays}d`;
    }
     const diffInWeeks = Math.floor(diffInDays / 7);
     return `${diffInWeeks}w`;
  };

  const userId = auth.currentUser?.uid;
  const hasLiked = post.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(userId);
  const hasDisliked = post.dislikedBy && Array.isArray(post.dislikedBy) && post.dislikedBy.includes(userId);

  return (
    <View style={styles.postContainer}>
      {/* Post Author Header */}
      <View style={styles.authorHeader}>
        <TouchableOpacity style={styles.authorInfo} onPress={() => navigation.navigate("DisplayProfile", { userId: post.authorId })}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(post.displayName || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.displayName}>{post.displayName || "Unknown User"}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(post.timestamp)}{post.edited ? <Text style={{ fontWeight: "bold" }}> - Edited</Text> : ""}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 5 }}>
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
            contentContainerStyle={{ alignItems: 'center', justifyContent: "center", gap: 9 }}
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
                      position: 'absolute',
                      right: 10,
                      bottom: 15,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      paddingHorizontal: 10,
                      borderRadius: theme.borderRadius.lg
                    }}
                  >
                    <Text style={{ color: 'white' }}>{index + 1}/{post.images.length}</Text>
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
          onPress={()=>{onShare(post)}}
        >
           <Ionicons name="paper-plane-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PostsList = ({
  posts,
  navigation,
  onLike,
  onDislike,
  onSave,
  onShare,
  onContentPress,
  onBookmark,
  onPressOptions,
  refreshing,
  onRefresh,
  emptyComponent,
  contentContainerStyle,
  scrollEnabled=true,
  nestedScrollEnabled=false,
  onEndReached = undefined,
  onEndReachedThreshold=undefined,
  ...props
}) => {
  const dispatch = useDispatch();
  const savedPosts = useSelector(state => state.user.savedPosts) || [];

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
      onLike={onLike}
      onDislike={onDislike}
      onSave={onSave}
      onShare={onShare}
      onContentPress={onContentPress}
      isSaved={savedPosts.includes(item.id)}
      onBookmark={onBookmark || handleBookmark}
      onPressOptions={onPressOptions}
      navigation={navigation}
    />
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle || styles.feedContainer}
      // refreshControl={
      //   <RefreshControl
      //     refreshing={refreshing}
      //     onRefresh={onRefresh}
      //     colors={[theme.colors.primary]}
      //     tintColor={theme.colors.primary}
      //   />
      // }
      ListEmptyComponent={emptyComponent || (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
          
        </View>
      )}
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled={nestedScrollEnabled}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    paddingHorizontal: theme.spacing.horizontal.sm,
    paddingBottom: theme.spacing.vertical.sm,
  },
  postContainer: {
    backgroundColor: "white",
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.vertical.md,
    marginBottom: theme.spacing.vertical.sm,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  authorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.vertical.sm,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarContainer: {
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.horizontal.xs,
  },
  avatarText: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  authorDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 1,
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
  timestamp: {
    fontSize: theme.fontSizes.xs || 10,
    color: theme.colors.muted,
    fontFamily: theme.fontFamily.regular,
  },
  postContent: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: theme.fontSizes.small * 1.4,
    marginBottom: theme.spacing.vertical.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.vertical.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.horizontal.xs,
    paddingVertical: theme.spacing.vertical.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.horizontal.xs,
    marginBottom: theme.spacing.vertical.xs,
  },
  tagText: {
    fontSize: theme.fontSizes.xs || 10,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.regular,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: theme.spacing.vertical.xs,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    
  },
  actionButton: {
    paddingHorizontal: theme.spacing.horizontal.xs,
    paddingVertical: theme.spacing.vertical.xs,
  },
  actionText: {
    fontSize: theme.fontSizes.small,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.muted,
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

export default PostsList;