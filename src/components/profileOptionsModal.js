import React from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { moderateScale, verticalScale, horizontalScale } from '../design-system/theme/scaleUtils';
import theme from '../design-system/theme/theme';
const ProfileOptionsModal = ({
  visible,
  onClose,
  onShare,
  onBlock,
  onReport,
  onUnfollow,
  hasfollowed,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuOverlay} onPress={onClose}>
        <View style={styles.bottomSheetMenu}>


          <TouchableOpacity onPress={onShare} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <Ionicons name="share-social-sharp" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                Share Profile
              </Text>
            </View>
          </TouchableOpacity>
          
          {hasfollowed &&(
          <TouchableOpacity onPress={onUnfollow} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              
            <Ionicons name="person-remove" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight: "bold" }]}>
                Remove follower
              </Text>
            </View>
          </TouchableOpacity>     
          )}     
          
            
          <TouchableOpacity onPress={onBlock} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <MaterialIcons name="block" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight: "bold" }]}>
                Block 
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onReport} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <MaterialIcons name="report" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight: "bold" }]}>
                Report
              </Text>
            </View>
          </TouchableOpacity>
                  

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
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
});



export default ProfileOptionsModal;