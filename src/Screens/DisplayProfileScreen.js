import React, {useRef, useState, useCallback, useEffect} from "react";
import { View, Text, StyleSheet, ScrollView, FlatList, Image,  Dimensions, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable, Share, Alert } from "react-native";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { moderateScale, horizontalScale, verticalScale } from "../design-system/theme/scaleUtils";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRoute } from "@react-navigation/native";
import { Button } from "react-native-paper";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";
import PostsList from "../components/postsList";
import PostOptionsModal from "../components/postOptionsModal";

const DisplayProfileScreen = ({navigation})=>{
    
    const route = useRoute();
    const { userId } = route.params; 
    const [renderAbout, setRenderAbout] = useState(false);
  console.log(userId);
  const [posts, setPosts] = useState();
  const [rerendertool, setReRenderTool] = useState(1);   // to re render screen on Like action
  const [postMenuVisible, setPostMenuVisible] = useState(false);
  const [selectedpost, setSelectedPost] = useState();

  console.log(posts);

  
  const handleShared = async (post) => {
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
    } catch (error) {
      alert("Failed to share the post.");
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



  useEffect(() => {
    
    const fetchPosts = async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch(`${SERVER_URL}/posts/profile/${userId}`, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`, // make sure idToken is defined
          },
        });
  
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };
  
    fetchPosts(); // call the async function
  }, [rerendertool]);

    return(
        <Container>
    <View style={styles.headerRow}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconLeft}>
      <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
    </TouchableOpacity>
    <View style={{ flex: 1, flexDirection:"row" }} />

    <TouchableOpacity 
      style={styles.headerIconRight}
      onPress={() => {}}
    >
      <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
    </TouchableOpacity>
  </View>
  <View style={{alignItems:"center", justifyContent:"center", paddingTop:theme.spacing.vertical.md, gap:verticalScale(10)}}>

  <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {("U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{color:theme.colors.text, fontWeight:"bold", fontSize:theme.fontSizes.medium}}>RandomnUsernmae</Text>
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:horizontalScale(55), paddingTop:theme.spacing.vertical.md}}>
                <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>33</Text>
                   <Text style={{color:theme.colors.muted}}>Posts</Text>
                    </View>
                    <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>45</Text>
                    <Text style={{color:theme.colors.muted}}>Followers</Text>
                    </View>
                    <View style={{justifyContent:"center", alignItems:"center"}}>
                    <Text style={{fontSize:theme.fontSizes.medium, fontWeight:"bold", color:theme.colors.text }}>78</Text>
                    <Text style={{color:theme.colors.muted}}>Following</Text>
                    </View>

                </View>

                <View style={{paddingTop:theme.spacing.vertical.md, flexDirection:"row", gap:horizontalScale(20), paddingHorizontal:horizontalScale(16)}}> 
                    <Button  buttonColor= {theme.colors.primary} textColor={theme.colors.text}mode="contained-tonal" style={{borderRadius:5, flex:0.5}}> Follow </Button>
                    <Button mode="contained-tonal" buttonColor={theme.colors.primary} textColor={theme.colors.text} style={{borderRadius:5, flex:0.5}}> Message </Button>
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
{renderAbout ? (
<View style={{justifyContent:"center", alignItems:"center"}}>

    <Text>Hello</Text>


</View>
) : (<View>

<PostsList
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
      />

<PostOptionsModal
        visible={postMenuVisible}
        onClose={() => setPostMenuVisible(false)}
        onDelete={() => {
          setPostMenuVisible(false);
          handleDeletePost(selectedpost);
        }}
        onEdit={() => {
          navigation.navigate("EditPost", { initialPost: selectedpost });
          setPostMenuVisible(false);
        }}
        onShare={() => { handleShared(selectedpost) }}
        onViewProfile={() => {}}
        onBlock={() => console.log("Block user")}
        onReport={() => console.log("Report post")}
        post={selectedpost}
        userId={auth.currentUser.uid}
      />


</View>)}

  </View>
  </Container>
    
)};

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