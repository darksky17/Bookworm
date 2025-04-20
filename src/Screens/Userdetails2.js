import React, { useState } from "react";
import { firestore, db } from "../Firebaseconfig";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { setFavGenres, setFavAuthors, setPhotos } from "../redux/userSlice";
import auth from "@react-native-firebase/auth";
import { setDoc, updateDoc, doc } from "@react-native-firebase/firestore";
import { SERVER_URL } from "../constants/api";
import {
  fetchUserDataByQuery,
  fetchUserDataById,
} from "../components/FirestoreHelpers";

const genres = ["Fiction", "Fantasy", "Science Fiction", "Romance", "Horror"];
const authors = [
  "J.K. Rowling",
  "George Orwell",
  "Agatha Christie",
  "J.R.R. Tolkien",
  "Stephen King",
];

const Userdetails2 = ({ navigation }) => {
  const userId = auth().currentUser.uid;
  const dispatch = useDispatch();
  const { phoneNumber, name, email } = useSelector((state) => state.user);

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleGenreSelect = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((item) => item !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      Alert.alert("Error", "You can select only 3 genres.");
    }
  };

  const handleAuthorSelect = (author) => {
    if (selectedAuthors.includes(author)) {
      setSelectedAuthors(selectedAuthors.filter((item) => item !== author));
    } else if (selectedAuthors.length < 3) {
      setSelectedAuthors([...selectedAuthors, author]);
    } else {
      Alert.alert("Error", "You can select only 3 authors.");
    }
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
        if (selectedImages.length < 3) {
          setSelectedImages([...selectedImages, result.assets[0].uri]);
        } else {
          Alert.alert("Error", "You can upload only 3 photos.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "An error occurred while selecting an image.");
    }
  };

  const removeImage = (index) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
  };

  const uploadImageToCloudinary = async (imageUri, folderName) => {
    try {
      console.log(
        `Attempting to upload image to Cloudinary. Server URL: ${SERVER_URL}`
      );
      console.log(`Image URI: ${imageUri.substring(0, 50)}...`);

      // Step 1: Get signature from our server
      console.log("Step 1: Requesting signature from server...");
      const response = await fetch(`${SERVER_URL}/generate-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderName }),
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server response error (${response.status}):`, errorText);
        throw new Error(
          `Failed to get upload signature. Status: ${response.status}`
        );
      }

      console.log("Signature response received. Parsing response...");
      const signatureData = await response.json();
      console.log(
        "Signature data:",
        JSON.stringify(signatureData).substring(0, 100) + "..."
      );

      const { cloud_name, api_key, signature, params } = signatureData;

      // Step 2: Upload to Cloudinary
      console.log("Step 2: Preparing Cloudinary upload...");
      const formData = new FormData();

      // Create file object
      const fileObj = {
        uri: imageUri,
        name: `${Date.now()}.jpg`,
        type: "image/jpeg",
      };
      console.log("File object created:", JSON.stringify(fileObj));

      formData.append("file", fileObj);
      formData.append("folder", folderName);
      formData.append("timestamp", params.timestamp);
      formData.append("api_key", api_key);
      formData.append("signature", signature);

      console.log("Starting Cloudinary upload...");
      console.log(
        `Upload URL: https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`
      );

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
          timeout: 30000, // 30 second timeout
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(
          `Cloudinary upload error (${uploadResponse.status}):`,
          errorText
        );
        throw new Error(
          `Failed to upload image to Cloudinary. Status: ${uploadResponse.status}`
        );
      }

      console.log("Upload successful! Parsing response...");
      const uploadResult = await uploadResponse.json();
      console.log("Upload complete. Secure URL:", uploadResult.secure_url);

      return uploadResult.secure_url;
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      console.error("Error details:", error.message);

      // Network error specific logging
      if (error.message.includes("Network request failed")) {
        console.error(
          "NETWORK ERROR: Please check your internet connection and server availability"
        );
        console.error(`Current SERVER_URL: ${SERVER_URL}`);
      }

      throw error;
    }
  };

  const handleFinish = async () => {
    if (
      selectedGenres.length < 3 ||
      selectedAuthors.length < 3 ||
      selectedImages.length < 3
    ) {
      Alert.alert(
        "Error",
        "Please select 3 genres, 3 authors, and upload 3 photos."
      );
      return;
    }

    try {
      const photoUrls = [];
      for (const image of selectedImages) {
        const url = await uploadImageToCloudinary(image, userId);

        photoUrls.push(url);
      }

      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          favGenres: selectedGenres,
          favAuthors: selectedAuthors,
          photos: photoUrls,
        },
        { merge: true }
      );

      dispatch(setFavGenres(selectedGenres));
      dispatch(setFavAuthors(selectedAuthors));
      dispatch(setPhotos(photoUrls));

      await updateDoc(userDocRef, { step2Completed: true });
      navigation.replace("MainTabs");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Other UI elements */}
      <Text style={styles.header}>Complete Your Details</Text>
      <Text>Phone Number: {phoneNumber}</Text>
      <Text>Name: {name}</Text>
      <Text>Email: {email}</Text>

      <Text style={styles.subHeader}>Select your favorite genres (max 3):</Text>
      <View style={styles.optionsContainer}>
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            onPress={() => handleGenreSelect(genre)}
            style={[
              styles.optionBox,
              selectedGenres.includes(genre) && styles.selectedBox,
            ]}
          >
            <Text style={styles.optionText}>{genre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subHeader}>
        Select your favorite authors (max 3):
      </Text>
      <View style={styles.optionsContainer}>
        {authors.map((author) => (
          <TouchableOpacity
            key={author}
            onPress={() => handleAuthorSelect(author)}
            style={[
              styles.optionBox,
              selectedAuthors.includes(author) && styles.selectedBox,
            ]}
          >
            <Text style={styles.optionText}>{author}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.subHeader}>Upload photos (max 3):</Text>
      <View style={styles.photoContainer}>
        {selectedImages.map((image, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        {selectedImages.length < 3 && (
          <TouchableOpacity style={styles.photoBox} onPress={handleImagePicker}>
            <Text style={styles.photoText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subHeader: {
    fontSize: 16,
    marginVertical: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  optionBox: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedBox: {
    backgroundColor: "lightgreen",
  },
  optionText: {
    textAlign: "center",
  },
  photoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  photoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 10,
  },
  photoText: {
    fontSize: 30,
    color: "white",
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  finishButton: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 10,
  },
  finishButtonText: {
    color: "white",
    fontSize: 16,
  },
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    borderRadius: 15,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Userdetails2;
