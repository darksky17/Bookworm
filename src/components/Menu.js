import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";
import ViewProfile from "../Screens/ViewProfile";
import {
  Modal as PaperModal,
  Portal,
  Button,
  PaperProvider,
} from "react-native-paper";
import { db } from "../Firebaseconfig";
import auth from "@react-native-firebase/auth";
import {
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "@react-native-firebase/firestore";

const Menu = ({ visible, onClose, allData, chatId }) => {
  const [unmatchModal, setUnmatchModal] = useState(false);
  const userId = auth().currentUser.uid;
  console.log(chatId);

  const Unmatch = async (chatId) => {
    console.log("Unmatching chat:", chatId);
    const batchSize = 500;
    const messagesRef = collection(db, `Chats/${chatId}/messages`);

    try {
      const snapshot = await getDocs(messagesRef);

      if (snapshot.empty) {
        console.log("No messages to delete.");
      } else {
        let batch = writeBatch(db);
        let batchCount = 0;

        for (let i = 0; i < snapshot.docs.length; i++) {
          batch.delete(snapshot.docs[i].ref);
          batchCount++;

          if (batchCount === batchSize || i === snapshot.docs.length - 1) {
            await batch.commit();
            console.log(`Committed batch of ${batchCount}`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }

      const chatDocRef = doc(db, `Chats/${chatId}`);
      await deleteDoc(chatDocRef);
      console.log("Chat document deleted.");

      const userDocRef = doc(db, "Users", userId);
      const friendDocRef = doc(db, "Users", allData.id);
      const userSnap = await getDoc(userDocRef);

      const data = userSnap.data();

      await updateDoc(userDocRef, {
        currentMatches: arrayRemove(allData.id),
      });
      await updateDoc(friendDocRef, {
        currentMatches: arrayRemove(userId),
      });
    } catch (error) {
      console.error("Unmatch error:", error);
    }
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
              <Text>Unmatch</Text>
            </TouchableOpacity>
            <Text>Block</Text>
            <Text>Report</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent={true}
        visible={unmatchModal}
        animationType="slide"
        onRequestClose={() => setUnmatchModal(false)}
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
            <Text>
              Are you sure you want to Unmatch? Note: You will lose all your
              text messages
            </Text>
            <View style={{ flexDirection: "row", gap: 30 }}>
              <Button
                mode="contained"
                onPress={() => {
                  Unmatch(chatId);
                  setUnmatchModal(false);
                }}
              >
                <Text>Yes</Text>
              </Button>
              <Button mode="contained" onPress={() => setUnmatchModal(false)}>
                <Text>No</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Menu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    top: 60,
    right: 5,
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
    borderRadius: 10,
  },
  modalContent: {
    width: 150,
    height: 200,
    padding: 10,
    flexDirection: "column",
    backgroundColor: "lawngreen",
    borderRadius: 10,
    alignItems: "flex-start",
    justifyContent: "space-evenly",
  },
  closeButton: {
    marginTop: 20,
    color: "blue",
    fontSize: 18,
  },
});
