import React, {useRef, useState, useCallback, useEffect} from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Keyboard, Platform, Modal, Share, Alert, Vibration } from "react-native";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { useRoute } from "@react-navigation/native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import { horizontalScale, verticalScale, moderateScale } from "../design-system/theme/scaleUtils";
import { useFetchComments } from "../hooks/useFetchComments";
import { useSelector, useDispatch } from 'react-redux';
import { setSavedPosts } from '../redux/userSlice';
import { BlockUser } from "../utils/blockuser";
import { Pressable} from "react-native-gesture-handler";
import PostCard from "../components/PostCard";
import PostOptionsModal from "../components/postOptionsModal";
import { useFetchPostsById } from "../hooks/useFetchPostsById";
import ReportProfileModal from "../components/reportProfileModal";
import ShareBottomSheet from "../components/ShareBottomSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { pollUpdate } from "../utils/pollUdate";
const PostDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const queryClient = useQueryClient();
  const { id: postId } = route.params;
  const insets = useSafeAreaInsets();

  const {data: postData, isError, error } = useFetchPostsById(postId);
 const [post, setPost] = useState(null);


  const userId = auth.currentUser?.uid;
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const disname = useSelector((state)=>state.user.displayName);
  const { data: comments = [], isLoading: commentsLoading, error: commentsError, refetch: refetchComments } = useFetchComments(postId);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuComment, setMenuComment] = useState(null);
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const inputRef = useRef(null);
  const [collapsedComments, setCollapsedComments] = useState({}); // { [commentId]: true/false }
  const [editingComment, setEditingComment] = useState(null); // {id, text, ...} or null
  const dispatch = useDispatch();
  const savedPosts = useSelector(state => state.user.savedPosts) || [];
  // const isSaved = savedPosts.includes(post.id);
  const isSaved = savedPosts.includes(postId);
  const screenWidth = Dimensions.get('window').width;
  const IMAGE_ASPECT_RATIO = 5 / 4;
  const CONTAINER_WIDTH = screenWidth * 0.85;
const CONTAINER_HEIGHT = CONTAINER_WIDTH / IMAGE_ASPECT_RATIO;
const [reportModalVisible, setReportModalVisible] = useState(false);
const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
const bottomSheetRef = useRef(null); // Control BottomSheet programmatically
const [sharedPost, setSharedPost] = useState(null);
const [sendingComment, setSendingComment] = useState(false);
const [behaviour, setBehaviour] = useState("padding");
const [reRenderTool, setReRenderTool] = useState(0);

useEffect(() => {
  const showListener = Keyboard.addListener("keyboardDidShow", () => {
    setBehaviour("padding");
  });
  const hideListener = Keyboard.addListener("keyboardDidHide", () => {
    setBehaviour(undefined);
  });

  return () => {
    showListener.remove();
    hideListener.remove();
  };
}, []);

useEffect(() => {
  if (postData) {
 
    
    setPost(postData);
   
  }
}, [postData]);

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

    if(post === null) return;
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
        if(!prev) return prev;
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
    if(post === null) return;
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
        if(!prev) return prev;
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



  const handleShare = async () => {
    try {
      const shareUrl = `https://bookworm.infodata.in/posts/${post.id}`;
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

  const handleSend = () => {

    setSharedPost(post);
    setBottomSheetVisible(true);
    bottomSheetRef.current?.expand(); // Opens the bottom sheet
  };

  const handleSendComment = async () => {
   
    setSendingComment(true);
    if (comment.trim()) {
    const previousData = queryClient.getQueryData(['comments', post.id])
    queryClient.setQueryData(['comments', post.id], (oldData) => {                                      //Optimistic update
    const newComment = {
      id: 'temp-id',  
      text: comment.trim(),
      timestamp: new Date(),
      userId: auth.currentUser.uid, 
      parentId: replyTo ? replyTo.id : null,
      postId:post.id,
      displayName:disname,
    };
    return [...oldData, newComment]; 
  });
  
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
        
        const newComment = await response.json();  
        

        
        queryClient.setQueryData(['comments', post.id], (oldData) => {
          return oldData.map(pomment =>
            pomment.id === 'temp-id'  // Match the temporary comment
              ? { ...pomment, id:newComment.id }  // Replace the whole comment object with the actual data
              : pomment
          );
        });

        const trigger = comment;

        setComment("");
        setReplyTo(null);
        if(trigger.startsWith("@WormAI ")){
          
          setTimeout(()=>{
            queryClient.invalidateQueries(['comments', post.id]);
            setReRenderTool(1);
          }, 700)
       
        }

      
        
      } catch (error) {
        alert("Failed to add comment");
        queryClient.setQueryData(['comments', post.id], previousData);
      }
    }
    setSendingComment(false);
  };

  if (!post && !isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading post...</Text>
      </View>
    );
  }

  if(isError){
    if(error.message === "Failed to fetch posts"){
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>This post does not exist anymore.</Text>
        </View>
      );

    }
  }

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
    const previousData = queryClient.getQueryData(['comments', post.id])
    queryClient.setQueryData(['comments', post.id], (oldData) => {
      return oldData.filter(c => c.id !== comment.id); // Remove the comment that matches the id
    });
    try {
      const idToken = await auth.currentUser.getIdToken();
      await fetch(`${SERVER_URL}/posts/${post.id}/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      // refetchComments();
    } catch (error) {
      alert("Failed to delete comment");
      queryClient.setQueryData(['comments', post.id], previousData);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !comment.trim()) return;
    const previousData = queryClient.getQueryData(['comments', post.id])
    queryClient.setQueryData(['comments', post.id], (oldData) => {
      return oldData.map(pomment =>
        pomment.id === editingComment.id 
          ? { ...pomment, text:comment.trim() }  
          : pomment
      );
    });
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
      // refetchComments();
    } catch (error) {
      alert("Failed to edit comment");
      queryClient.setQueryData(['comments', post.id], previousData);
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
                  {/* <Text style={styles.avatarText}>
                    {(c.displayName || "U").charAt(0).toUpperCase()}
                  </Text> */}

{c.userId==="WormAI" ?(
          <>
      <Image
            source={require("../assets/play_store_512.png") }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          </>):(
            <>
         <Text style={styles.avatarText}>
          { c.displayName?.charAt(0)?.toUpperCase() || ("U")}
        </Text> 
        </>
          )}
                </View>
                <Text style={styles.commentAuthor}>{c.userId==="WormAI"?"WormAI":c.displayName}</Text>
               
       
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
                  {/* <Text style={styles.avatarText}>
                    {(c.displayName || "U").charAt(0).toUpperCase()}
                  </Text> */}

{c.userId==="WormAI" ?(
          <>
      <Image
            source={require("../assets/play_store_512.png") }
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          </>):(
            <>
         <Text style={styles.avatarText}>
          { c.displayName?.charAt(0)?.toUpperCase() || ("U")}
        </Text> 
        </>
          )}
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

  const handlePollUpdate=(newVoterList)=>{
    
 setPost(prev=>({...prev, voterList:newVoterList}));
 queryClient.setQueryData(["post", postId, false], (old)=>{
  if(!old) return old;
  return { ...old, voterList: newVoterList };
});

pollUpdate(postId, ["savedPosts"], queryClient, newVoterList);
pollUpdate(postId, ["postsforprofile", auth.currentUser.uid], queryClient, newVoterList);
pollUpdate(postId, ["posts"], queryClient, newVoterList);
 
  }

  return (
    <Container containerStyle={{paddingBottom:insets.bottom}}>
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

 
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : behaviour}
        keyboardVerticalOffset={5}
        style={{flex: 1, marginBottom:theme.spacing.vertical.sm}}
        
      >
 <ScrollView contentContainerStyle={styles.container}>
        <PostCard
        post={post}
        onComment={()=> inputRef.current.focus()}
        onLike={handleLike}
        OnDislike={handleDislike}
        onShare={handleSend}
        onPollUpdate={handlePollUpdate}
        width={CONTAINER_WIDTH}
        height={CONTAINER_HEIGHT}
        />
        
      


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

    <View  style={styles.commentInputContainer}>
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
            <View style={{flexDirection:"row", justifyContent:"space-around", alignItems:"center", marginLeft:horizontalScale(10)}}>
             {post.type!=="Poll" && replyTo==null &&(
              <Pressable onPress={()=>{setComment("@WormAI sumamrize this"); Vibration.vibrate(80)}}>              
                <Image source={require("../assets/BookWorm_logo_new.png")} style={{width:30, height:22}} />
              </Pressable>
              )}

            <TouchableOpacity onPress={handleSendComment} style={styles.sendButton} disabled={!comment.trim() || sendingComment}>
              <Ionicons name="send" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            </View>
          )}
        </View>
        </View>
       
      </KeyboardAvoidingView>
      {/* Post Context Menu Modal */}
   

<PostOptionsModal
  visible={postMenuVisible}
  onClose={() => setPostMenuVisible(false)}
  onDelete={handleDeletePost}
  onEdit={() => {
    navigation.navigate("EditPost", { initialPost:post});
    setPostMenuVisible(false);
  }}
  onShare={handleShare}
  onViewProfile={() => {
    setPostMenuVisible(false);
    navigation.navigate("DisplayProfile", { userId: post.authorId });
  }}
  onBlock={() => {
    setPostMenuVisible(false);
    BlockUser(post.authorId, { navigation });
  }}
  onReport={() => {
    setReportModalVisible(true);
    setPostMenuVisible(false);
  }}
  post={post}
  userId={auth.currentUser.uid}
/>
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
      <ReportProfileModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetId={post.id}
        type={"Post"}
      />
              <ShareBottomSheet
   post={sharedPost}
   bottomSheetRef={bottomSheetRef}
   bottomSheetVisible={bottomSheetVisible}
   onClose={ ()=>{
    setBottomSheetVisible(false);}}
   />
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
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingTop: theme.spacing.vertical.lg,
    flexGrow:1,
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
    overflow:"hidden",
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