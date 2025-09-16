import React from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, verticalScale, horizontalScale } from '../design-system/theme/scaleUtils';
import theme from '../design-system/theme/theme';
import {auth, db, collection, getDoc, doc, updateDoc, arrayUnion, deleteDoc } from "../Firebaseconfig";
import { SERVER_URL } from '../constants/api';
import { useQueryClient } from "@tanstack/react-query";




const NotificationOptionsModal = ({
  visible,
  onClose,
  userId,
  displayName,
  postId,
  notificationId,
  type
}) => {
  const queryClient = useQueryClient();
  const MuteNotificationsUser = (userId, displayName) => {
  
    Alert.alert(
      "Mute Notifications",
      `Are you sure you want to mute notifications from ${displayName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Mute",
          onPress: async () => {
            try {
              const userDocRef = doc(db, "Users", auth.currentUser.uid);
  
              await updateDoc(userDocRef, {
                mutedNotifications: arrayUnion(userId)
              });
  
              Alert.alert("Success", `${displayName } has been muted.`);
            } catch (error) {
              console.error("Failed to mute user:", error);
              Alert.alert("Error", "An error occurred while trying to mute the user.");
            }
          },
          style: "destructive" 
        }
      ]
    );
  };

  const MuteNotificationsPost = () => {
  
    Alert.alert(
      "Mute Post Notifications",
      `Are you sure you want to mute all notifications for this Post?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Mute",
          onPress: async () => {
            try {
              const idToken = await auth.currentUser.getIdToken();
              const response = await fetch(`${SERVER_URL}/notifications/mute_post/${postId}`,{
                method:"POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                });

                if(response.ok){
  
              Alert.alert("Success, post has been muted.");
                }
            } catch (error) {
              console.error("Failed to mute post notifications:", error);
              Alert.alert("Error", "An error occurred while trying to mute the post.");
            }
          },
          style: "destructive" 
        }
      ]
    );
  };

  const DeleteNotification = (notificationId) =>{
    

    
    Alert.alert(
      "Delete Notification",
      `Are you sure you want to delete the notification?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const idToken = await auth.currentUser.getIdToken();
              const response = await fetch(`${SERVER_URL}/notifications/delete/${notificationId}`,{
                method:"DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                  },
                });

             

              if(response.ok){

              Alert.alert("Success, notification has been deleted.");
              }
            } catch (error) {
              console.error("Failed to mute user:", error);
              Alert.alert("Error", "An error occurred while trying to delete the notification.");
            }
            finally{
              queryClient.invalidateQueries(["notifications"]);
            }

         
          },
          style: "destructive" 
        }
      ]
    );

  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.bottomSheetMenu}>


    
          
            


          <TouchableOpacity onPress={()=>{MuteNotificationsUser(userId, displayName); onClose();}} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(5) }}>
            <Ionicons name="notifications-off-outline" size={22} color="black" />
              <Text style={[styles.menuItemText, { fontWeight: "bold"}]}>
                Mute All Notifications From {displayName} ?
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={()=>{DeleteNotification(notificationId);onClose();}} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(5) }}>
            <Ionicons name="trash" size={22} color="black" />
              <Text style={[styles.menuItemText, { fontWeight: "bold"}]}>
                Delete Notification?
              </Text>
            </View>
          </TouchableOpacity>

       {type !== "follow" &&(
          <TouchableOpacity onPress={()=>{MuteNotificationsPost();onClose();}} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(5) }}>
            <Ionicons name="notifications-off-outline" size={22} color="black" />
              <Text style={[styles.menuItemText, { fontWeight: "bold"}]}>
                Mute Post Notifications?
              </Text>
            </View>
          </TouchableOpacity>
          )}
                  

          <TouchableOpacity onPress={onClose} style={styles.menuItem}>
            <Text style={[styles.menuItemText, { color: theme.colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({

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
    fontSize: moderateScale(14),
    color: theme.colors.text,
    textAlign: 'center',
    
  },
});



export default NotificationOptionsModal;