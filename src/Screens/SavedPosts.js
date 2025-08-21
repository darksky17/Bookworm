import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
  ActivityIndicator,
  Text
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { auth } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import Container from "../components/Container";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import {
  moderateScale,
  horizontalScale,
  verticalScale,
} from "../design-system/theme/scaleUtils";
import PostsList from "../components/postsList";
import PostOptionsModal from "../components/postOptionsModal";
import { DeletePost } from "../utils/deletepost";
import { SHARE_PREFIX } from "../constants/api";
import ReportProfileModal from "../components/reportProfileModal";
import { BlockUser } from "../utils/blockuser";
const SavedPosts = ({ navigation }) => {


  const savedPosts = useSelector((state) => state.user.savedPosts);
  const [posts, setPosts] = useState([]);
  const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState([]);
  const [initializing, setInitializng] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const[reportModalVisible, setReportModalVisible] = useState(false);


console.log("Okay so these are saved", posts.length);

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

useEffect(()=>{

    const fetchSavedPosts = async ()=>{
      setInitializng(true);
   const idToken = await auth.currentUser.getIdToken();
        try{
            const responses = await Promise.allSettled(
                savedPosts.map(async (id) =>
                  fetch(`${SERVER_URL}/posts/${id}`, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${idToken}`,
                    },
                  }).then((res) => res.ok ? res.json() : null)
                )
              );
              
              // Filter successful results
               const post = responses
                .filter((res) => res.status === "fulfilled" && res.value)
                .map((res) => res.value);
                setPosts(post);
        } catch(error){
          console.log("error", error);
        } finally {
          setInitializng(false);
        }
    }

    fetchSavedPosts();


}, [savedPosts, rerendertool]);




    if(isDeleting){return (    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      
    </View>)}

    if(initializing){return (    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      
    </View>)}




  return (
    <Container>
   
        <View style={{flexDirection:"row", alignItems:"center"}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingLeft:horizontalScale(8)}}>
      <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
    </TouchableOpacity>
      <Header title={"Saved"} />
      </View>


 
      <View style={styles.section}>
<PostsList
        posts={posts}
        navigation={navigation}
        onLike={handleLike}
        onDislike={handleDislike}
        onShare={handleShared}
        onContentPress={(post) => navigation.navigate("PostDetail", { id: post.id })}
        onPressOptions={(item) => {
            setSelectedPost(item);
            setPostMenuVisible(true);
          }}
      
          
      />
    
     
      </View>


      <PostOptionsModal
        visible={postMenuVisible}
        onClose={() => setPostMenuVisible(false)}
        onDelete={async () => {
          setPostMenuVisible(false);
          setIsDeleting(true);
          await DeletePost(selectedpost);
          setIsDeleting(false);
          setReRenderTool(prevValue => prevValue + 1);
          
        }}
        onEdit={() => {
          navigation.navigate("EditPost", { initialPost: selectedpost });
          setPostMenuVisible(false);
        }}
        onShare={()=>{handleShared(selectedpost)}}
        onViewProfile={() => {setPostMenuVisible(false); navigation.navigate("DisplayProfile", {userId: selectedpost.authorId})}}
        onBlock={() =>{ BlockUser(userId, {navigation}); setPostMenuVisible(false)} }
        onReport={() => {setPostMenuVisible(false); setReportModalVisible(true)}}
        post={selectedpost}
        userId={auth.currentUser.uid}
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: theme.fontSizes.large,
    color: theme.colors.muted,
  },
  unmatchModal: {
    padding: 20,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "snow",
    elevation: 3,
    borderRadius: moderateScale(10),
  },
  profileHeader: {
    flexDirection: "row",
    gap: horizontalScale(15),
    padding: 15,
  },
  profileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    borderRadius: moderateScale(50),
  },
  placeholderProfileImage: {
    width: horizontalScale(100),
    height: verticalScale(100),
    backgroundColor: "#dfe4ea",
    borderRadius: moderateScale(50),
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: moderateScale(16),
  },
  nameText: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
    color: theme.colors.text,
    fontFamily: theme.fontFamily.bold,
  },

  section: {
    flexDirection: "column",
    flex:1,
    gap: verticalScale(25),
    paddingTop: verticalScale(20),
    paddingBottom:theme.spacing.vertical.xs
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: moderateScale(10),
    alignItems: "center",
  },

  closeModalButton: {
    marginTop: verticalScale(10),
    backgroundColor: theme.colors.primary,
    paddingVertical: verticalScale(5),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(5),
  },
  closeModalText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
});

export default SavedPosts;
