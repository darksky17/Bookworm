import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View, FlatList, Image } from "react-native";
import Header from "../components/Header";
import Container from "../components/Container";
import theme from "../design-system/theme/theme";
import { useEffect, useState } from "react";
import { auth, doc, getDoc } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import { moderateScale, horizontalScale, verticalScale } from "../design-system/theme/scaleUtils";
import Ionicons from "@expo/vector-icons/Ionicons";
import NotificationOptionsModal from "../components/notificationOptionsModal";
import { useFetchNotifications } from "../hooks/useFetchNotifications";

// Local NotificationItem component for follow type
const NotificationItem = ({ notification, navigation, setOptionsModal, setUser }) => {

  
  

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        const months = Math.floor(diff / (30 * 86400000));  
        const years = Math.floor(diff / (365 * 86400000));
    
        if(years> 0) return `${years}mo`;
        if(months> 0) return `${months}mo`;
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return "now";
      };
  const { actordisplayName, actorId, type, postContent, postMedia, postId, commentContent, timestamp, parentText } = notification;
  
  if (type === "follow") {
    return (
      <View style={styles.notificationContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DisplayProfile", { userId: actorId })}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {(actordisplayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        </TouchableOpacity>
        
        <Text style={styles.notificationText}>
          <Text 
            onPress={() => navigation.navigate("DisplayProfile", { userId: actorId })} 
            style={styles.actorName}
          >
            {actordisplayName}
          </Text> just took an interest in you!
        </Text>
        <View style={{gap:5, alignItems:"center"}}>
        <Text style={{fontSize:theme.fontSizes.xs, fontWeight:"bold", color:theme.colors.muted}}>   
            {formatTimestamp(new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6))} </Text>
            <Pressable onPress={()=>{setOptionsModal(true); setUser(notification)}}>
        <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </Pressable>
        </View>
      </View>
    );
  }

  if (type === "like") {
    return (
        <TouchableOpacity onPress={()=>{navigation.navigate("PostDetail", {id: postId})}}>      
            <View style={styles.notificationContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DisplayProfile", { userId: actorId })}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {(actordisplayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        </TouchableOpacity>
        <View style={{flex:1, gap:verticalScale(10)}}>
        <Text style={styles.notificationText}>
          <Text 
            style={styles.actorName}
          >
            {actordisplayName}
          </Text> enjoyed your post!
        </Text>
        <View style={{flexDirection:"row",  gap:10, borderWidth:1, borderRadius:10, borderColor:theme.colors.muted, paddingHorizontal:theme.spacing.horizontal.xs}}> 
        {postMedia && postMedia !== "null" && (
  <Image
    source={{ uri: postMedia }}
    resizeMode="cover"
    style={{ width: "20%", height: "100%" }} 
  />
)}
        <Text numberOfLines={2} ellipsizeMode="tail" style={{flexShrink:1,paddingVertical:theme.spacing.vertical.sm, fontSize:moderateScale(13)}}>{postContent}</Text>
        </View>
        </View>
        <View style={{gap:5, alignItems:"center"}}>
        <Text style={{fontSize:theme.fontSizes.xs, fontWeight:"bold", color:theme.colors.muted}}>   
            {formatTimestamp(new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6))} </Text>
        <Pressable onPress={()=>{setOptionsModal(true); setUser(notification)}}>
        <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </Pressable>
        </View>
      </View>
      </TouchableOpacity>

    );
  }

  if (type === "comment") {
    return (
        <TouchableOpacity onPress={()=>{navigation.navigate("PostDetail", {id: postId})}}>      
            <View style={styles.notificationContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DisplayProfile", { userId: actorId })}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {(actordisplayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        </TouchableOpacity>
        <View style={{flex:1, gap:verticalScale(10)}}>
        <Text style={styles.notificationText}>
          <Text 
            style={styles.actorName}
          >
            {actordisplayName}
          </Text> shared their thoughts on your post!
        </Text>
        <View>
        <View style={{  borderWidth:1, borderTopLeftRadius:10, borderTopRightRadius:10, borderColor:theme.colors.muted, paddingVertical:theme.spacing.vertical.xs, paddingHorizontal:theme.spacing.horizontal.sm}}>
            
            <Text>{commentContent}</Text>
            </View>
        <View style={{flexDirection:"row", backgroundColor:"snow",  gap:10, borderColor:theme.colors.muted, borderBottomLeftRadius:10, borderBottomRightRadius:10, borderWidth:1, borderTopWidth:0, paddingHorizontal:theme.spacing.horizontal.xs}}> 
        {postMedia && postMedia !== "null" && (
  <Image
    source={{ uri: postMedia }}
    resizeMode="cover"
    style={{ width: "20%", height: "100%" }} 
  />
)}
        <Text numberOfLines={2} ellipsizeMode="tail" style={{flexShrink:1,paddingVertical:theme.spacing.vertical.sm, fontSize:moderateScale(13)}}>{postContent}</Text>
        </View>
        </View>
        </View>
        <View style={{gap:5, alignItems:"center"}}>
        <Text style={{fontSize:theme.fontSizes.xs, fontWeight:"bold", color:theme.colors.muted}}>   
            {formatTimestamp(new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6))} </Text>
            <Pressable onPress={()=>{setOptionsModal(true); setUser(notification)}}>
        <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </Pressable>
        </View>
      </View>
      </TouchableOpacity>

    );
  }

  if (type === "reply") {
    return (
        <TouchableOpacity onPress={()=>{navigation.navigate("PostDetail", {id: postId})}}>      
            <View style={styles.notificationContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("DisplayProfile", { userId: actorId })}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {(actordisplayName || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        </TouchableOpacity>
        <View style={{flex:1, gap:verticalScale(10)}}>
        <Text style={styles.notificationText}>
          <Text 
            style={styles.actorName}
          >
            {actordisplayName}
          </Text> replied to your comment!
        </Text>
        <View>
        <View style={{  borderWidth:1, borderTopLeftRadius:10, borderTopRightRadius:10, borderColor:theme.colors.muted, paddingVertical:theme.spacing.vertical.xs, paddingHorizontal:theme.spacing.horizontal.sm}}>
            
            <Text>{commentContent}</Text>
            </View>
        <View style={{flexDirection:"row", backgroundColor:"snow",  gap:10, borderColor:theme.colors.muted, borderBottomLeftRadius:10, borderBottomRightRadius:10, borderWidth:1, borderTopWidth:0, paddingHorizontal:theme.spacing.horizontal.xs}}> 
   
        <Text numberOfLines={2} ellipsizeMode="tail" style={{flexShrink:1,paddingVertical:theme.spacing.vertical.sm, fontSize:moderateScale(13)}}>{parentText}</Text>
        </View>
        </View>
        </View>
        <View style={{gap:5, alignItems:"center"}}>
        <Text style={{fontSize:theme.fontSizes.xs, fontWeight:"bold", color:theme.colors.muted}}>   
            {formatTimestamp(new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1e6))} </Text>
            <Pressable onPress={()=>{setOptionsModal(true); setUser(notification)}}>
        <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.text} />
        </Pressable>
        </View>
      </View>
      </TouchableOpacity>

    );
  }
  
  
  // Default fallback for other types
  return (
    <View style={styles.notificationContainer}>
      <Text style={styles.notificationText}>New notification</Text>
    </View>
  );
};

const NotificationScreen = ({navigation})=>{

    // const [data, setData] = useState(null);
    const [optionsModal, setOptionsModal] = useState(false);
    const [user, setUser] = useState(null);
    
    const { data, isLoading, error } = useFetchNotifications();
    



    const renderNotificationItem = ({ item }) => (
      <NotificationItem 
        notification={item} 
        navigation={navigation}
        setOptionsModal={setOptionsModal}
        setUser={setUser} 
      />
    );

    const keyExtractor = (item, index) => item.id || index.toString();

    if(data === null || isLoading){
        return (
        <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
        <ActivityIndicator color={theme.colors.primary} />
        </View>
        )
    }

    return(
        <Container>
            <Header title={"Notifications"} />
            <View style={styles.listContainer}>
              <FlatList
                data={data || []}
                renderItem={renderNotificationItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                }
              />
            </View>
            {user && (
  <NotificationOptionsModal
      visible={optionsModal}
      onClose={()=>{setOptionsModal(false); setUser(null);}}
      displayName={user.actordisplayName}
      userId={user.actorId}
      notificationId={user.id}
      postId={user.postId}
      type={user.type}
  />
)}
        </Container>
    )

};

const styles= StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.vertical.xl,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.medium,
    opacity: 0.6,
  },
  notificationContainer: {
    flexDirection: "row", 
    flex:1,
    elevation: 2, 
    borderBottomWidth: 1, 
    gap: 10, 
    alignItems: "center", 
    backgroundColor: theme.colors.background, 
    paddingVertical: theme.spacing.vertical.md, 
    paddingHorizontal: theme.spacing.horizontal.md,
    paddingRight:theme.spacing.horizontal.sm,
  },
  notificationText: {
    color: theme.colors.text, 
    fontSize: theme.fontSizes.small, 
    flexShrink: 1
  },
  actorName: {
    fontWeight: "bold", 
    fontSize: moderateScale(13)
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
});

export default NotificationScreen;