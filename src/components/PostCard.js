import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { auth } from "../Firebaseconfig";
import ImageView from "react-native-image-viewing";
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions, Pressable, Alert } from 'react-native';
import theme from '../design-system/theme/theme';
import { SERVER_URL } from '../constants/api';
import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';


const PollComponent = ({pollOptions, voterList, hasVoted, setHasVoted, postId, onUpdate})=>{
 

  const handleVote = async(option)=>{

       const newVoterList = {...voterList};


         newVoterList[auth.currentUser.uid]=option;
         setHasVoted(true);
         onUpdate?.(newVoterList);
    
     
    const idToken = await auth.currentUser.getIdToken();
    console.log("Enter hered on frontend");
    const response = await fetch(`${SERVER_URL}/posts/${postId}/handlevote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body:JSON.stringify({option:option}),

      
    });

    const res = await response.json();
    if(response.ok){
      setHasVoted(true);
      return
    } else{
      Alert.alert("We got a problem here");
      onUpdate?.(voterList);
      setHasVoted(Object.keys(voterList).includes(userId));
    }
  }

  const handleUndo = async (option)=>{

    const newVoterList = {...voterList};
    setHasVoted(false);

    if(newVoterList[auth.currentUser.uid] === option){
      delete newVoterList[auth.currentUser.uid]
      onUpdate?.(newVoterList); 
    } 
     
    const idToken = await auth.currentUser.getIdToken();
    
    const response = await fetch(`${SERVER_URL}/posts/${postId}/handlevote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body:JSON.stringify({option:option}),

      
    });

    const res = await response.json();
    if(response.ok){
      setHasVoted(false);
      return
    } else{
      Alert.alert("We got a problem here");
      onUpdate?.(voterList);
      setHasVoted(Object.keys(voterList).includes(userId));
    }
    

  }

  const totalVoters= Object.keys(voterList).length;

  const votes = Object.values(voterList);

  const OptionLayout =({option, percentage})=>{
    const widthProgress = useSharedValue(0);
    useEffect(() => {
      widthProgress.value = withTiming(percentage, { duration: 300 });
      
    }, [percentage]);


    const animatedStyle =useAnimatedStyle(()=>({ width:`${widthProgress.value}%` }));
     
    
    return(
      <View style={{flexDirection:"row", justifyContent:"space-between", alignItems:"center"}}>
    <Pressable disabled={hasVoted} onPress={()=>{ handleVote(option)}} style={{width:"90%",paddingLeft:8, paddingVertical:10, position:"relative", maxHeight:"100%", borderRadius:5, overflow:"hidden"}}>
    <Animated.View style={[{backgroundColor:hasVoted?theme.colors.primary:"transparent", position:"absolute", top:0, left:0, bottom:0,right:0}, animatedStyle]} />
    
   <View style={{flexDirection:"row", gap:10, alignItems:"center"}}>
   <View><Text style={{fontWeight:"bold", alignSelf:"flex-start", paddingLeft:2, color:"black"}}>{option}</Text></View>
   {hasVoted && option===voterList[auth.currentUser.uid] &&(<Ionicons name="star" size={18} color="black" />)}

   </View>


  
    </Pressable>
   {hasVoted&&(  
   <View>
   <Text numberOfLines={1} ellipsizeMode="tail" style={{fontWeight:"bold"}}>{percentage.toFixed(0)}%</Text>
   </View>
   )}
    </View>
    
)
  }
  
  return(
    
  <>{
    pollOptions.map((option,index)=>{
      const votesLength = votes.filter(v=>v===option).length
      return(
        
        <View key={index}style={{marginBottom:8}}>
      <OptionLayout option={option} percentage={votesLength<1?0:((votesLength*100)/totalVoters)} />

      </View>
       
      )
    })}
    <View style={{flexDirection:"row", marginTop:10, alignItems:"center"}}>
      <Text style={{fontSize:theme.fontSizes.xs}}> {totalVoters} Vote(s)</Text>
      {hasVoted&&(
      <Pressable onPress={ ()=>{const value=voterList[auth.currentUser.uid]; handleUndo(value);}}><Text style={{color:theme.colors.secondary, fontWeight:"bold"}}>   Undo</Text></Pressable>
    )}
      </View>
  </>


  )

}


const PostCard=({post, onLike, OnDislike, onComment, onShare, width, height, onPollUpdate })=>
    
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
        const [hasVoted, setHasVoted] = useState(() => {
          if (post.type === "Poll" && post.voterList) {
            console.log(post.voterList);
            return Object.keys(post.voterList).includes(userId);
          }
          return false;
        });
 

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
{post.type!=="Poll" &&(
<Text style={styles.content}>{post.Content}</Text>
    )}
 
{post.type === "Poll" &&(
  
 <PollComponent pollOptions={post.pollOptions} voterList={post.voterList} hasVoted={hasVoted} setHasVoted={setHasVoted} postId={post.id} onUpdate={onPollUpdate} />
)}
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