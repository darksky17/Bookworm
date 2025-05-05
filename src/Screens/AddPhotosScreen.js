import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import auth from "@react-native-firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { setFavGenres, setFavAuthors, setPhotos } from "../redux/userSlice";
import { setDoc, updateDoc } from "@react-native-firebase/firestore";
import { SERVER_URL } from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";

const genres = ["Fiction", "Fantasy", "Science Fiction", "Romance", "Horror"];
const authors = [
  "J.K. Rowling",
  "George Orwell",
  "Agatha Christie",
  "J.R.R. Tolkien",
  "Stephen King",
];

const AddPhotosScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedAuthors, setSelectedAuthors] = useState([
    ...globalSelected.favAuthors,
  ]);
  const [selectedGenres, setSelectedGenres] = useState([
    ...globalSelected.favGenres,
  ]);
  const [selectedPhotos, setSelectedPhotos] = useState([
    ...globalSelected.photos,
  ]);
  const tempphotos = [...globalSelected.photos];
  userId = auth().currentUser.uid;

  const handleGenreSelect = (genres) => {
    if (selectedGenres.includes(genres)) {
      const updatedGenres = selectedGenres.filter((item) => item !== genres);
      setSelectedGenres(updatedGenres);
    } else if (selectedGenres.length < 3) {
      const updatedGenres = [...selectedGenres, genres];
      setSelectedGenres(updatedGenres);
    } else {
      Alert.alert("Error", "You can select only 3 genres.");
    }
  };

  const handleAuthorSelect = (authors) => {
    if (selectedAuthors.includes(authors)) {
      const updatedAuthors = selectedAuthors.filter((item) => item !== authors);
      setSelectedAuthors(updatedAuthors);
    } else if (selectedAuthors.length < 3) {
      const updatedAuthors = [...selectedAuthors, authors];
      setSelectedAuthors(updatedAuthors);
    } else {
      Alert.alert("Error", "You can select only 3 authors.");
    }
  };

  const removeImage = (index) => {
    const updatedImages = [...selectedPhotos];
    console.log("Im old updated image list", updatedImages);
    updatedImages[index] = "";
    console.log("Im new updated image list", updatedImages);
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
        if (selectedPhotos.length < 4) {
          updatedImages = [...selectedPhotos];
          const empyIndex = updatedImages.indexOf("");
          if (empyIndex !== -1) {
            updatedImages[empyIndex] = result.assets[0].uri;
            // setSelectedPhotos([...selectedPhotos, result.assets[0].uri]);
          } else {
            updatedImages.push(result.assets[0].uri);
          }
          setSelectedPhotos(updatedImages);
        } else {
          Alert.alert("Error", "You can upload only 3 photos.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "An error occurred while selecting an image.");
    }
  };

  const uploadImageToCloudinary = async (imageUri, folderName) => {
    try {
      const response = await fetch(`${SERVER_URL}/generate-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (
      selectedGenres.length < 3 ||
      selectedAuthors.length < 3 ||
      selectedPhotos.length < 3
    ) {
      Alert.alert(
        "Error",
        "Please select 3 genres, 3 authors, and upload 3 photos."
      );
      return;
    }

    try {
      const photoUrls = [...tempphotos];
      console.log("These are selected photos final", selectedPhotos);
      const newPhotos = selectedPhotos.filter(
        (image) => !tempphotos.includes(image)
      );
      console.log("These are the photos that will get to firebase", newPhotos);
      for (const image of newPhotos) {
        const url = await uploadImageToCloudinary(image, userId); // Upload the disputed photo
        const index = selectedPhotos.indexOf(image); // Find the position of the new photo
        photoUrls[index] = url; // Replace the disputed photo in the final array with its URL
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
      navigation.navigate("MainTabs");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const InfoRow = ({ label, value }) => {
    return (
      <View style={styles.rowContainer}>
        <Text>{label}</Text>
        <Text style={{ crolor: "black", fontWeight: "bold" }}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Add Photos"} />
      <Container>
        <View style={{ flex: 1 }}>
          <FlatList
            data={selectedPhotos}
            horizontal
            scrollEnabled={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
              if (item != "") {
                return (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignContent: "center",
                    }}
                  >
                    <Image source={{ uri: item }} style={styles.photo} />
                    <TouchableOpacity onPress={() => removeImage(index)}>
                      <Ionicons
                        name="close-circle-sharp"
                        size={34}
                        color="green"
                        style={{
                          marginTop: -30,
                          marginLeft: 70,
                          backgroundColor: "white",
                          borderRadius: 1000,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignContent: "center",
                    }}
                  >
                    <Image source={{ uri: item }} style={styles.photo} />
                    <TouchableOpacity onPress={handleImagePicker}>
                      <Ionicons
                        name="add-circle-sharp"
                        size={34}
                        color="green"
                        style={{
                          marginTop: -30,
                          marginLeft: 70,
                          backgroundColor: "white",
                          borderRadius: 1000,
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }
            }}
            ItemSeparatorComponent={<View style={{ width: 30 }} />}
          />
          {/* <FlatList
            data={selectedPhotos}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
              if (item != "") {
                return (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: item }} style={styles.photo} />

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity
                    style={styles.photoBox}
                    onPress={handleImagePicker}
                  >
                    <Text style={styles.photoText}>+</Text>
                  </TouchableOpacity>
                );
              }
            }}
            ItemSeparatorComponent={() => <View style={{ width: 10 }} />} // Adds spacing between images
            contentContainerStyle={{ paddingHorizontal: 10 }} // Optional padding around the list
            showsHorizontalScrollIndicator={false}
          /> */}

          <View style={styles.buttonContainer}>
            <Button title="Save Changes" onPress={handleSave} />
            <Button
              title="Cancel"
              onPress={() => navigation.goBack()}
              color="red"
            />
          </View>
        </View>
      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    gap: 60,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "white",
  },

  photoText: {
    fontSize: 30,
    color: "black",
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  imageWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  imageButton: {
    marginLeft: 10,
    backgroundColor: "#007BFF",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 150,
    borderWidth: 2,
    borderRadius: 10,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 15,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
    marginVertical: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default AddPhotosScreen;
