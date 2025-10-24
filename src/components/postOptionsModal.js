import React from 'react';
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { moderateScale, verticalScale, horizontalScale } from '../design-system/theme/scaleUtils';
import theme from '../design-system/theme/theme';
const PostOptionsModal = ({
  visible,
  onClose,
  onDelete,
  onEdit,
  onShare,
  onViewProfile,
  onBlock,
  onReport,
  post,
  userId,


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
          {post?.authorId === userId && (
            <>
              <TouchableOpacity onPress={onDelete} style={styles.menuItem}>
                <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
                  <Ionicons name="trash" size={21} color="black" />
                  <Text style={[styles.menuItemText, { color: theme.colors.error, fontWeight: "bold" }]}>
                    Delete Post
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={onEdit} style={styles.menuItem}>
                <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
                  <Ionicons name="pencil" size={21} color="black" />
                  <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                    Edit Post
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={onShare} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <Ionicons name="share-social-sharp" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                Share Post
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onViewProfile} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <MaterialCommunityIcons name="account" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                View Profile
              </Text>
            </View>
          </TouchableOpacity>

          
          {post?.authorId!==userId && (
            <>
          <TouchableOpacity onPress={onBlock} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <MaterialIcons name="block" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                Block Account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onReport} style={styles.menuItem}>
            <View style={{ flexDirection: "row", gap: horizontalScale(10) }}>
              <MaterialIcons name="report" size={24} color="black" />
              <Text style={[styles.menuItemText, { color: theme.colors.text, fontWeight: "bold" }]}>
                Report Post
              </Text>
            </View>
          </TouchableOpacity>
          </>
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
    fontSize: theme.fontSizes.medium,
    color: theme.colors.text,
    textAlign: 'center',
  },
});



export default PostOptionsModal;