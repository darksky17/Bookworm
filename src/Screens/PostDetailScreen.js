import React, {useRef, useState, useCallback, useEffect} from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Share, Alert } from "react-native";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { useRoute } from "@react-navigation/native";
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { auth } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import ImageView from "react-native-image-viewing";
import { horizontalScale, verticalScale, moderateScale } from "../design-system/theme/scaleUtils";
import { useFetchComments } from "../hooks/useFetchComments";
import { useSelector, useDispatch } from 'react-redux';
import { setSavedPosts } from '../redux/userSlice';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlockUser } from "../functions/blockuser";
import { Pressable, RectButton } from "react-native-gesture-handler";
const PostDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const { post: initialPost } = route.params;


  const [post, setPost] = useState(initialPost);
  const userId = auth.currentUser?.uid;
  const hasLiked = post.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(userId);
  const hasDisliked = post.dislikedBy && Array.isArray(post.dislikedBy) && post.dislikedBy.includes(userId);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const { data: comments = [], isLoading: commentsLoading, error: commentsError, refetch: refetchComments } = useFetchComments(post.id);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuComment, setMenuComment] = useState(null);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const inputRef = useRef(null);
  const [collapsedComments, setCollapsedComments] = useState({}); // { [commentId]: true/false }
  const [editingComment, setEditingComment] = useState(null); // {id, text, ...} or null
  const dispatch = useDispatch();
  const savedPosts = useSelector(state => state.user.savedPosts) || [];
  const isSaved = savedPosts.includes(post.id);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selected, setSelected] = useState();
  const screenWidth = Dimensions.get('window').width;
  const IMAGE_ASPECT_RATIO = 5 / 4;
  const CONTAINER_WIDTH = screenWidth * 0.85;
const CONTAINER_HEIGHT = CONTAINER_WIDTH / IMAGE_ASPECT_RATIO;


  const handleBookmark = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const method = isSaved ? 'DELETE' : 'POST';
      await fetch(`${SERVER_URL}/posts/users/me/savedPosts/${post.id}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      let newSavedPosts;
      if (isSaved) {
        newSavedPosts = savedPosts.filter(pid => pid !== post.id);
      } else {
        newSavedPosts = [...savedPosts, post.id];
      }
      dispatch(setSavedPosts(newSavedPosts));
    } catch (e) {
      alert('Failed to update bookmark');
    }
  };

  const handleLike = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${post.id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      // Refetch or update post state
      setPost((prev) => {
        let likedBy = prev.likedBy || [];
        let dislikedBy = prev.dislikedBy || [];
        let Likes = prev.Likes;
        let Dislikes = prev.Dislikes;
        if (likedBy.includes(userId)) {
          likedBy = likedBy.filter((id) => id !== userId);
          Likes = Math.max(0, Likes - 1);
        } else {
          likedBy = [...likedBy, userId];
          Likes = Likes + 1;
          if (dislikedBy.includes(userId)) {
            dislikedBy = dislikedBy.filter((id) => id !== userId);
            Dislikes = Math.max(0, Dislikes - 1);
          }
        }
        return { ...prev, likedBy, dislikedBy, Likes, Dislikes };
      });
    } catch (error) {
      alert("Failed to like post.");
    }
  };

  const handleDislike = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${post.id}/dislike`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      setPost((prev) => {
        let likedBy = prev.likedBy || [];
        let dislikedBy = prev.dislikedBy || [];
        let Likes = prev.Likes;
        let Dislikes = prev.Dislikes;
        if (dislikedBy.includes(userId)) {
          dislikedBy = dislikedBy.filter((id) => id !== userId);
          Dislikes = Math.max(0, Dislikes - 1);
        } else {
          dislikedBy = [...dislikedBy, userId];
          Dislikes = Dislikes + 1;
          if (likedBy.includes(userId)) {
            likedBy = likedBy.filter((id) => id !== userId);
            Likes = Math.max(0, Likes - 1);
          }
        }
        return { ...prev, likedBy, dislikedBy, Likes, Dislikes };
      });
    } catch (error) {
      alert("Failed to dislike post.");
    }
  };

  const handleSave = () => {
    setPost((prev) => ({ ...prev, Saved: prev.Saved + 1 }));
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${SERVER_URL}/posts/${post.id}`;
      const shareTitle = post.type === "BookReview" 
        ? `Check out "${post.BookTitle}"`
        : `Check out "${post.title}"`;
      const message = `${post.Content?.slice(0, 100)}...\n\nCheck this out on MyApp:\n${shareUrl}`;
  
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

  const handleSendComment = async () => {
    if (comment.trim()) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const body = { text: comment.trim() };
        if (replyTo) body.parentId = replyTo.id;
        const response = await fetch(`${SERVER_URL}/posts/${post.id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error("Failed to add comment");
        setComment("");
        setReplyTo(null);
        refetchComments();
      } catch (error) {
        alert("Failed to add comment");
      }
    }
  };

  const getTimeAgo = (timestamp) => {
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

  // Helper to build a tree from flat comments array
  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];
    comments.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });
    comments.forEach((c) => {
      if (c.parentId) {
        if (map[c.parentId]) {
          map[c.parentId].replies.push(map[c.id]);
        }
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  // Menu actions
  const handleEditComment = (comment) => {
    setMenuVisible(false);
    setEditingComment(comment);
    setComment(comment.text);
    setReplyTo(null);
    inputRef.current?.focus();
  };
  const handleDeleteComment = async (comment) => {
    setMenuVisible(false);
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${post.id}/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      refetchComments();
    } catch (error) {
      alert("Failed to delete comment");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !comment.trim()) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SERVER_URL}/posts/${post.id}/comments/${editingComment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: comment.trim() }),
      });
      if (!response.ok) throw new Error("Failed to edit comment");
      setEditingComment(null);
      setComment("");
      refetchComments();
    } catch (error) {
      alert("Failed to edit comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setComment("");
  };

  const toggleCollapse = (id) => {
    setCollapsedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeletePost = async () => {
    Alert.alert(
      "Delete Post?",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel", 
          onPress: () => {}, 
          style: "cancel" // No action, just closes the alert
        },
        {
          text: "Delete", 
          onPress: async () => {
            try {
              const idToken = await auth.currentUser.getIdToken();
              const response = await fetch(`${SERVER_URL}/posts/${post.id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${idToken}`,
                },
              });
  
              if (!response.ok) {
                throw new Error("Failed to delete post");
              }
  
              setPostMenuVisible(false); // Close the post menu
              navigation.goBack(); // Go back to the previous screen after deleting
            } catch (error) {
              alert("Failed to delete post.");
            }
          },
        },
      ]
    );
  };

  // Cap for indentation and collapse
  const INDENT_SIZE = horizontalScale(8); // px per level
  const MAX_INDENT_LEVEL = 4;
  const COLLAPSE_LEVEL = 6;

  // Recursive comment renderer
  const renderComment = (c, level = 0, isLastChild = false) => {
    const canEdit = c.userId === userId;
    const canDelete = c.userId === userId || post.userId === userId;
    // Cap the indentation level
    const cappedLevel = Math.min(level, MAX_INDENT_LEVEL);
    const marginLeft = cappedLevel * INDENT_SIZE;
    // Collapsed state
    const isCollapsed = !!collapsedComments[c.id];
    if (isCollapsed) {
      return (
        <View key={c.id} style={[styles.commentItem, { marginLeft }]}> 
          {level > 0 && !isLastChild && <View style={styles.nestBar} />}
          <TouchableOpacity onPress={() => toggleCollapse(c.id)} activeOpacity={0.7} style={{ flex: 1 }}>
            <View style={styles.commentMeta}>
           
            <Pressable onPress={() => navigation.navigate("DisplayProfile", { userId: c.userId })}>        
            
              <View style={{flexDirection:"row", gap:5, alignItems:"flex-start"}} >
             
                  <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(c.displayName || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.commentAuthor}>{c.displayName}</Text>
               
       
              </View>
              </Pressable>
       
   
            </View>
          </TouchableOpacity>


        </View>
      );
    }
    // Collapse deep threads (view more replies)
    if (level === COLLAPSE_LEVEL && c.replies && c.replies.length > 0) {
      return (
        <View key={c.id} style={[styles.commentItem, { marginLeft }]}> 
          {level > 0 && !isLastChild && <View style={styles.nestBar} />}
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => toggleCollapse(c.id)} activeOpacity={0.7}>
              <Text style={styles.collapsedText}>View more replies ({c.replies.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View key={c.id} style={[styles.commentItem, { marginLeft }]}> 
        {level > 0 && !isLastChild && <View style={styles.nestBar} />}
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => toggleCollapse(c.id)} activeOpacity={0.7}>
            <View style={styles.commentMeta}>
              <View style={{flexDirection:"row", gap:5, alignItems:"flex-start"}}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(c.displayName || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.commentAuthor}>{c.displayName}</Text>
              </View>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                <Text style={styles.commentTimestamp}>{c.timestamp ? getTimeAgo(c.timestamp) : ""}</Text>
                <TouchableOpacity
                  onPress={() => { setMenuComment(c); setMenuVisible(true); }}
                  style={{ padding:4}}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.commentText}>{c.text}</Text>
          </TouchableOpacity>
          <View>          
            <TouchableOpacity onPress={() => setReplyTo(c)} style={styles.replyButton}>
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          </View>

          {c.replies && c.replies.length > 0 && c.replies.map((reply, idx, arr) =>
            renderComment(reply, level + 1, idx === arr.length - 1)
          )}
        </View>
      </View>
    );
  };

  return (
    <Container>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection:"row" }} />
        <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color="black" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIconRight}
          onPress={() => setPostMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {post.type === "BookReview" ? (
          <>
            <Text style={styles.title}>{post.BookTitle}</Text>
            <Text style={styles.author}>by {post.BookAuthor}</Text>
          </>
        ) : (
          <Text style={styles.title}>{post.title}</Text>
        )}
        <Text style={styles.displayName}>{post.displayName}</Text>
        <Text style={styles.content}>{post.Content}</Text>
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
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, idx) => (
              <Text key={idx} style={styles.tagText}>#{tag} </Text>
            ))}
          </View>
        )}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={hasLiked ? "thumbs-up" : "thumbs-up-outline"}
              size={20}
              color={hasLiked ? theme.colors.primary : "black"}
            />
            <Text style={styles.stat}>{post.Likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDislike}>
            <Ionicons
              name={hasDisliked ? "thumbs-down" : "thumbs-down-outline"}
              size={20}
              color={hasDisliked ? theme.colors.primary : "black"}
            />
            <Text style={styles.stat}>{post.Dislikes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => inputRef.current.focus()}>
            <FontAwesome5 name="comment" size={20} color="black" />
            <Text style={styles.stat}>{post.commentsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.stat}>
              <Ionicons name="share-social-outline" size={21} color="black" /> </Text>
      
          </TouchableOpacity>
        </View>
        {/* Comments Section */}
        <View style={styles.commentsSection}>
          {/* <Text style={styles.commentsTitle}>Comments</Text> */}
          {(() => {
            if (commentsLoading) {
              return (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Text style={styles.commentsLoading}>Loading comments...</Text>
                </View>
              );
            } else if (commentsError) {
              return (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Text style={styles.commentsError}>Failed to load comments</Text>
                </View>
              );
            } else if (comments.length === 0) {
              return (
                <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                  <Text style={styles.noComments}>No comments yet</Text>
                </View>
              );
            } else {
              const tree = buildCommentTree(comments);
              return tree.map((c) => renderComment(c));
            }
          })()}
        </View>
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
        style={styles.commentInputContainer}
      >
        {replyTo && !editingComment && (
          <View style={styles.replyPill}>
            <Text style={styles.replyPillText}>
              Replying to <Text style={{fontWeight:"bold"}}>{replyTo.displayName}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyPillClose}>
              <Ionicons name="close" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        {editingComment && (
          <View style={styles.replyPill}>
            <Text style={styles.replyPillText}>Editing comment</Text>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.replyPillClose}>
              <Ionicons name="close" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{flexDirection:"row", borderTopWidth:0}}>
          <TextInput
            style={styles.commentInput}
            ref={inputRef}
            placeholder={editingComment ? "Edit your comment..." : (replyTo ? "Add a reply..." : "Add a comment...")}
            value={comment}
            onChangeText={setComment}
            placeholderTextColor={theme.colors.muted}
          />
          {editingComment ? (
            <TouchableOpacity onPress={handleSaveEdit} style={styles.sendButton} disabled={!comment.trim()}>
              <Ionicons name="checkmark" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSendComment} style={styles.sendButton} disabled={!comment.trim()}>
              <Ionicons name="send" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

       
      </KeyboardAvoidingView>
      {/* Post Context Menu Modal */}
      <Modal
        visible={postMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPostMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setPostMenuVisible(false)}>
          <View style={styles.bottomSheetMenu}>
            {post.authorId === userId && (
              <>
              <>
              <TouchableOpacity onPress={handleDeletePost} style={styles.menuItem}>
              <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
              <Ionicons name="trash" size={21} color="black" />
                <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight:"bold" }]}>Delete Post</Text>
                </View>
              </TouchableOpacity>
              </>
              <>
                     <TouchableOpacity onPress={()=>{navigation.navigate("EditPost",{ initialPost }); setPostMenuVisible(false)} } style={styles.menuItem}>
                     <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
                     <Ionicons name="pencil" size={21} color="black" />
                       <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight:"bold" }]}>Edit Post</Text>
                       </View>
                     </TouchableOpacity>
                     </>
                
              
                 
                   
                     </>
            )}
                 <TouchableOpacity onPress={handleShare} style={styles.menuItem}>
                     <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
                     <Ionicons name="share-social-sharp" size={24} color="black" />
                       <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight:"bold" }]}>Share Post</Text>
                       </View>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={()=>{setPostMenuVisible(false); navigation.navigate("DisplayProfile",{userId:post.authorId})}} style={styles.menuItem}>
                     <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
                     <MaterialCommunityIcons name="account" size={24} color="black" />
                       <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight:"bold" }]}>View Profile</Text>
                       </View>
                     </TouchableOpacity>

                     { post.authorId!== auth.currentUser.uid && (
                      <>
                     <TouchableOpacity onPress={()=>{setPostMenuVisible(false); BlockUser(post.authorId, {navigation});}} style={styles.menuItem}>
                     <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
                     <MaterialIcons name="block" size={24} color="black" />
                       <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight:"bold" }]}>Block Account</Text>
                       </View>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={()=>{}} style={styles.menuItem}>
                     <View style={{flexDirection:"row", gap:horizontalScale(10)}}>
                     <MaterialIcons name="report" size={24} color="black" />
                       <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight:"bold" }]}>Report Post</Text>
                       </View>
                     </TouchableOpacity>
                     </>
                     )}
            <TouchableOpacity onPress={() => setPostMenuVisible(false)} style={styles.menuItem}>
              <Text style={[styles.menuItemText, { color: theme.colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      {/* Comment Context Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.bottomSheetMenu}>
            {menuComment && menuComment.userId === userId && (
              <TouchableOpacity onPress={() => handleEditComment(menuComment)} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            {menuComment && (menuComment.userId === userId || post.authorId === userId) && (
              <TouchableOpacity onPress={() => handleDeleteComment(menuComment)} style={styles.menuItem}>
                <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Delete</Text>
              </TouchableOpacity>
            )}

{menuComment && (menuComment.userId !== userId) && (
            <TouchableOpacity style={styles.menuItem} onPress={()=>{BlockUser(menuComment.userId); setMenuVisible(false)}}>              
           
               <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Block Account</Text>
            </TouchableOpacity>
)}
    <TouchableOpacity onPress={() =>{navigation.navigate("DisplayProfile", {userId:menuComment.userId}); setMenuVisible(false)}} style={styles.menuItem}>
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.menuItem}>
              <Text style={[styles.menuItemText, { color: theme.colors.muted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingTop: theme.spacing.vertical.md,
    

  },
  headerIconLeft: {
    padding: 8,
    paddingLeft: 0,
  },
  headerIconRight: {
    padding: 8,
    paddingRight: 0,
  },
  container: {
    padding: theme.spacing.horizontal.md,
    paddingTop: theme.spacing.vertical.lg,
    flexGrow:1,
  },
  title: {
    fontSize: theme.fontSizes.large,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.sm,
  },
  author: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.muted,
    marginBottom: theme.spacing.vertical.sm,
  },
  displayName: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.primary,
    marginBottom: theme.spacing.vertical.md,
  },
  content: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.vertical.sm,
  },
  tagText: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.secondary,
    marginRight: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.vertical.md,
  },
  stat: {
    fontSize: theme.fontSizes.small,
    color: theme.colors.muted,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.horizontal.xs,
    paddingVertical: theme.spacing.vertical.xs,
    alignItems: 'center',
   
  },
  commentInputContainer: {
    // flexDirection: 'row',
    // alignItems: 'center',
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingVertical: theme.spacing.vertical.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fafafa',
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
  },
  sendButton: {
    marginLeft: horizontalScale(8),
    padding: 8,
  },
  commentsSection: {
    flex:1,
    paddingTop: theme.spacing.vertical.lg,
    paddingBottom: theme.spacing.vertical.md,
  },
  commentsTitle: {
    fontSize: theme.fontSizes.medium,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.vertical.sm,
  },
  commentsLoading: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.vertical.sm,
  },
  commentsError: {
    color: theme.colors.error,
    fontSize: theme.fontSizes.small,
    marginBottom: theme.spacing.vertical.sm,
  },
  noComments: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.large,
    
  },
  commentItem: {
    backgroundColor: '#f7f7f7',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.vertical.xs,
    marginBottom: theme.spacing.vertical.md,
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
  },
  commentText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.small,
    paddingLeft:horizontalScale(40),
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    maxHeight:verticalScale(25)
  },
  commentAuthor: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.small,
    fontWeight:"bold",
  },
  commentTimestamp: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight:"bold",
  },
  avatarContainer: {
    width: horizontalScale(22), // was 40
    height: verticalScale(22), // was 40
    borderRadius: moderateScale(16), // was 20
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.horizontal.xs, // was sm
  },
  avatarText: {
    fontSize: theme.fontSizes.small, // was medium
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
  },
  replyButton: {
    marginTop: 2,
    paddingLeft:horizontalScale(40),
    paddingTop:verticalScale(5),
    alignSelf:"flex-start"
  },
  replyButtonText: {
    color: theme.colors.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: 'bold',
  },
  replyPill: {
    flexDirection: 'row',
    justifyContent:"space-between",
    paddingVertical: 10,
  
  },
  replyPillText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.small,
  },
  replyPillClose: {
    padding: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  bottomSheetMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    paddingBottom: verticalScale(32),
    paddingTop: verticalScale(8),
    paddingHorizontal: 0,
    minHeight: verticalScale(120),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: verticalScale(18),
    paddingHorizontal: horizontalScale(24),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
  nestBar: {
    width: 1,
    backgroundColor: theme.colors.muted,
    borderRadius: 1,
    position: 'absolute',
    left: horizontalScale(-8),
    // The avatar is verticalScale(22) tall, plus marginRight (theme.spacing.horizontal.xs)
    // We'll use top: verticalScale(12) + verticalScale(11) for a little gap
    top: verticalScale(4), // 22 for avatar, 4 for gap
    bottom: 0,
  },
  collapsedText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    padding: 8,
    fontSize: theme.fontSizes.small,
  },
});

export default PostDetailScreen; 