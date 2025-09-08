import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { auth } from "../Firebaseconfig";
import ImageView from "react-native-image-viewing";
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import theme from '../design-system/theme/theme';


const PostCard=({post, onLike, OnDislike, onComment, onShare, width, height })=>
    
    {
        const [selected, setSelected] = useState();
        const [imageViewerVisible, setImageViewerVisible] = useState(false);
        const userId = auth.currentUser?.uid;
        const hasLiked = post.likedBy && Array.isArray(post.likedBy) && post.likedBy.includes(userId);
        const hasDisliked = post.dislikedBy && Array.isArray(post.dislikedBy) && post.dislikedBy.includes(userId);
        const screenWidth = Dimensions.get('window').width;
        const IMAGE_ASPECT_RATIO = 4 / 5;
        const CONTAINER_WIDTH = screenWidth * 0.85;
        const CONTAINER_HEIGHT = CONTAINER_WIDTH / IMAGE_ASPECT_RATIO;

return(
<>
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
          width: width,
          height: height,
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
  <TouchableOpacity style={styles.actionButton} onPress={onLike}>
    <Ionicons
      name={hasLiked ? "thumbs-up" : "thumbs-up-outline"}
      size={20}
      color={hasLiked ? theme.colors.primary : "black"}
    />
    <Text style={styles.stat}>{post.Likes}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionButton} onPress={OnDislike}>
    <Ionicons
      name={hasDisliked ? "thumbs-down" : "thumbs-down-outline"}
      size={20}
      color={hasDisliked ? theme.colors.primary : "black"}
    />
    <Text style={styles.stat}>{post.Dislikes}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.actionButton} onPress={onComment}>
    <FontAwesome5 name="comment" size={20} color="black" />
    <Text style={styles.stat}>{post.commentsCount}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={[styles.actionButton,{justifyContent:"flex-center"}]} onPress={onShare}>
  
    <Ionicons name="paper-plane-outline" size={24} color="black" /> 

  </TouchableOpacity>
</View>
</>
)}

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
});

export default PostCard;