import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";
import {
  Modal as PaperModal,
  Portal,
  Button,
  PaperProvider,
} from "react-native-paper";
import { doc, updateDoc, arrayUnion, auth, db } from "../Firebaseconfig";
import { SERVER_URL } from "../constants/api";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
import ReportProfileModal from "./reportProfileModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
const Menu = ({
  visible,
  setvisible,
  onClose,
  allData,
  chatId,
  stopload,
  setstopload,
  navigation,
  unsubscribeRef,
}) => {
  const [unmatchModal, setUnmatchModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const[reportModalVisible, setReportModalVisible] = useState(false);
  const userId = auth.currentUser.uid;
  

  const Unmatch = async (chatId) => {
    if (unsubscribeRef.current) {
      console.log("Unsubscribing before unmatch...");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setstopload(!stopload);
    setvisible(!visible);
    const idToken = await auth.currentUser.getIdToken();
    fetch(`${SERVER_URL}/unmatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        friendId: allData,
      }),
    })
      .then((response) => response.json()) // Parse JSON directly
      .then(async (data) => {
        
        await AsyncStorage.removeItem(chatId);
        navigation.goBack();
      })
      .catch((error) => {
        console.error("Error:", error); // Log any error
      });
  };

  const Blocked = async () => {
    Unmatch(chatId);

    const userDocRef = doc(db, "Users", userId);
    await updateDoc(userDocRef, {
      blockedUsers: arrayUnion(allData),
    });
  };

  const ReusableModal = ({
    visible,
    title,
    description,
    onConfirm,
    onCancel,
  }) => {
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="slide"
        onRequestClose={onCancel}
      >
        <View
          style={{
            padding: 20,
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={styles.unmatchModal}>
            <Text>{description}</Text>
            <View style={{ flexDirection: "row", gap: 30 }}>
              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                onPress={onConfirm}
              >
                <Text>Yes</Text>
              </Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.primary}
                textColor={theme.colors.text}
                onPress={onCancel}
              >
                <Text>No</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Modal transparent={true} visible={visible} animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={onClose}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setUnmatchModal(true)}>
              <Text style={{ fontWeight: "bold", color: theme.colors.text }}>
                Unmatch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBlockModal(true)}>
              <Text style={{ fontWeight: "bold", color: theme.colors.text }}>
                Block
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{setReportModalVisible(true);onClose();}}>            
              <Text style={{ fontWeight: "bold", color: theme.colors.text }}>
              Report
            </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{onClose();navigation.navigate("DisplayProfile", {userId:allData})}}>            
              <Text style={{ fontWeight: "bold", color: theme.colors.text }}>
              View Profile
            </Text>
            </TouchableOpacity>

          </View>
        </TouchableOpacity>
      </Modal>

      <ReusableModal
        visible={unmatchModal}
        title="Unmatch"
        description="Are you sure you want to Unmatch? Note: You will lose all your text messages."
        onConfirm={() => {
          Unmatch(chatId);
          setUnmatchModal(false);
        }}
        onCancel={() => setUnmatchModal(false)}
      />
      <ReusableModal
        visible={blockModal}
        title="Block"
        description="Are you sure you want to Block this user? Note: You will lose all your text messages."
        onConfirm={() => {
          Blocked(chatId);
          setBlockModal(false);
        }}
        onCancel={() => setBlockModal(false)}
      />
      <ReportProfileModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        targetId={allData}
        type={"Profile"}
      />

    </>
  );
};

export default Menu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    top: verticalScale(60),
    right: horizontalScale(5),
    justifyContent: "flex-start",
    alignItems: "flex-end",
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
  modalContent: {
    width: horizontalScale(150),
    height: verticalScale(200),
    padding: 10,
    flexDirection: "column",
    backgroundColor: theme.colors.background,
    borderRadius: moderateScale(10),
    alignItems: "flex-start",
    justifyContent: "space-evenly",
  },
  closeButton: {
    marginTop: verticalScale(20),
    color: "blue",
    fontSize: moderateScale(18),
  },
});
