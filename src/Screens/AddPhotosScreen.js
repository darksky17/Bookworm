import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { setPhotos } from "../redux/userSlice";
import { auth, updateDoc, setDoc } from "../Firebaseconfig.js";
import { SERVER_URL } from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme.js";
import { scale } from "../design-system/theme/scaleUtils.js";

const AddPhotosScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const userId = auth.currentUser.uid;
  const [isLoading, setIsLoading] = useState(false);
  const initialPhotos = globalSelected.photos
    .slice(0, 6)
    .map((uri, index) => ({ key: `${index}`, uri }));

  // Fill remaining slots with empty entries up to MAX_PHOTOS
  while (initialPhotos.length < 6) {
    initialPhotos.push({ key: `${initialPhotos.length}`, uri: "" });
  }

  const [selectedPhotos, setSelectedPhotos] = useState(initialPhotos);

  // Universal photo sizing calculation
  const screenWidth = Dimensions.get("window").width;
  const containerPadding = 20; // 10 left + 10 right from paddingHorizontal
  const itemSpacing = 10; // Space between items
  const numColumns = 3;

  // Calculate available width for photos
  const availableWidth =
    screenWidth - containerPadding - itemSpacing * (numColumns - 1);
  const photoSize = Math.floor(availableWidth / numColumns);

  const removeImage = (keyToRemove) => {
    const index = selectedPhotos.findIndex((item) => item.key === keyToRemove);
    if (index === -1) return; // safety

    const updatedImages = [...selectedPhotos];
    updatedImages[index] = { ...updatedImages[index], uri: "" };
    setSelectedPhotos(updatedImages);
  };

  const handleImagePicker = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "You need to grant permission to access the gallery."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const updated = [...selectedPhotos];
        const emptyIndex = updated.findIndex((item) => item.uri === "");

        const filledSlots = updated.filter((item) => item.uri !== "").length;

        if (filledSlots >= 6) {
          Alert.alert("Limit Reached", "You can upload up to 6 photos.");
          return;
        }

        if (emptyIndex !== -1) {
          updated[emptyIndex].uri = result.assets[0].uri;
        } else {
          updated.push({
            key: `${Date.now()}`,
            uri: result.assets[0].uri,
          });
        }

        setSelectedPhotos(updated);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "An error occurred while selecting an image.");
    }
  };

  const uploadImageToCloudinary = async (imageUri, folderName) => {
    const idToken = await auth.currentUser.getIdToken();
    try {
      const response = await fetch(`${SERVER_URL}/generate-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ folder: folderName }),
      });

      if (!response.ok) throw new Error("Failed to get upload signature.");

      const { cloud_name, api_key, signature, params } = await response.json();

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: `${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      formData.append("folder", folderName);
      formData.append("timestamp", params.timestamp);
      formData.append("api_key", api_key);
      formData.append("signature", signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error("Failed to upload image.");

      const uploadResult = await uploadResponse.json();
      return uploadResult.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error.message);
      throw error;
    }
  };

  const handleSave = async () => {
    const photoUris = selectedPhotos
      .map((item) => item.uri)
      .filter((uri) => uri !== "");
    const tempphotos = [...globalSelected.photos];

    if (photoUris.filter((uri) => uri !== "").length < 3) {
      Alert.alert("Error", "Please select at least 3 photos.");
      return;
    }

    try {
      setIsLoading(true);
      const newPhotos = photoUris.filter((uri) => !tempphotos.includes(uri));
      const photoUrls = [...photoUris];

      for (const uri of newPhotos) {
        const index = photoUris.indexOf(uri);
        const url = await uploadImageToCloudinary(uri, userId);
        photoUrls[index] = url;
      }

      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          photos: photoUrls,
          step3Completed: true,
        },
        { merge: true }
      );

      dispatch(setPhotos(photoUrls));
      setIsLoading(false);
      await updateDoc(userDocRef, { step2Completed: true });
      navigation.replace("MainTabs");
    } catch (error) {
      setIsLoading(false);
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const getItemStyle = (index) => ({
    width: photoSize,
    marginRight: (index + 1) % numColumns === 0 ? 0 : itemSpacing,
    marginBottom: 15,
  });

  // if (isLoading) {
  //   return (
  //     <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
  //       <ActivityIndicator size="large" color="#0000ff" />
  //     </View>
  //   );
  // }

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: 50,
        backgroundColor: theme.colors.background,
      }}
    >
      <Header title="Add Photos" />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 10,
          paddingTop: 30,
          justifyContent: "space-between",
        }}
      >
        <View style={{ gap: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            Pick your photos now. We won't show them to people whom you do not
            approve.
          </Text>
          <DraggableFlatList
            scrollEnabled={false}
            contentContainerStyle={{
              flexGrow: 1,
            }}
            data={selectedPhotos}
            numColumns={3}
            keyExtractor={(item) => item.key}
            onDragEnd={({ data }) => setSelectedPhotos(data)}
            renderItem={({ item, index, drag }) => (
              <TouchableOpacity
                onLongPress={drag}
                activeOpacity={1}
                style={getItemStyle(index)}
              >
                <View>
                  {item.uri ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={[
                        styles.photo,
                        { width: photoSize, height: photoSize },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.photoBox,
                        { width: photoSize, height: photoSize },
                      ]}
                    >
                      <Text
                        style={[
                          styles.photoText,
                          { fontSize: photoSize * 0.3 },
                        ]}
                      >
                        +
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={
                      item.uri ? () => removeImage(item.key) : handleImagePicker
                    }
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      backgroundColor: "white",
                      borderRadius: 100,
                    }}
                  >
                    <Ionicons
                      name={
                        item.uri ? "close-circle-sharp" : "add-circle-sharp"
                      }
                      size={Math.min(34, photoSize * 0.3)}
                      color="green"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
          <Text style={{ color: "grey" }}>
            Long press and drag to reorder the images.{"\n"}
            Minimum 3 required
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          buttonColor={theme.colors.primary}
          textColor={theme.colors.text}
          mode="contained"
          onPress={handleSave}
          disabled={isLoading}
        >
          Save Changes
        </Button>
        <Button
          buttonColor={theme.colors.primary}
          textColor={theme.colors.text}
          mode="contained"
          onPress={() => navigation.goBack()}
        >
          Cancel
        </Button>
      </View>
      <Modal visible={isLoading} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  photo: {
    borderWidth: 2,
    borderRadius: 10,
    borderStyle: "dotted",
  },
  photoBox: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderStyle: "dotted",
    borderWidth: 2,
  },
  photoText: {
    color: "#888",
  },
  buttonContainer: {
    gap: 10,
    paddingHorizontal: 10,
  },
});

export default AddPhotosScreen;
