import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import auth from "@react-native-firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { setFavGenres, setFavAuthors, setPhotos } from "../redux/userSlice";
import { setDoc, updateDoc } from "@react-native-firebase/firestore";
import {
  SERVER_URL,
  GOOGLE_BOOKS_API_URL,
  BOOKS_API_KEY,
} from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MultiSelect } from "react-native-element-dropdown";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const genres = ["Fiction", "Fantasy", "Science Fiction", "Romance", "Horror"];
const authors = [
  "J.K. Rowling",
  "George Orwell",
  "Agatha Christie",
  "J.R.R. Tolkien",
  "Stephen King",
];

const EditProfileScreen = ({ navigation }) => {
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
  const fetchAuthors = async (query) => {
    if (!query || query.length < 3) {
      console.log("Returned");
      return;
    }

    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=inauthor:${query}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      console.log("This si sauthor data", data);

      const authorsSet = new Set();

      if (data.items) {
        data.items.forEach((item) => {
          const authors = item.volumeInfo.authors || [];
          authors.forEach((author) => authorsSet.add(author));
        });
      }

      const formatted = Array.from(authorsSet).map((author) => ({
        label: author,
        value: author,
      }));

      setAuthorOptions(formatted);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const handleAuthorChange = (selected) => {
    if (selectedAuthors.length > 3) {
      Alert.alert("Limit reached", "You can select up to 3 authors.");
      return;
    }
    setSelectedAuthors(selected);
  };
  return (
    <View style={{ flex: 1 }}>
      <Header title={"Edit Profile"} />
      <ScrollView>
        <Container>
          <View style={styles.container}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Image source={{ uri: selectedPhotos[0] }} style={styles.photo} />
              <TouchableOpacity
                onPress={() => navigation.navigate("AddPhotos")}
              >
                <Ionicons
                  name="add-circle-sharp"
                  size={37}
                  color="green"
                  style={{
                    marginTop: -30,
                    marginLeft: 60,
                    backgroundColor: "white",
                    borderRadius: 1000,
                  }}
                />
              </TouchableOpacity>
            </View>

            <InfoRow label="Name" value={globalSelected.name} />
            <InfoRow label="Phone" value={globalSelected.phoneNumber} />
            <InfoRow label="Gender" value={globalSelected.gender} />
            <InfoRow label="Date of Birth" value={globalSelected.dateOfBirth} />

            {/* <MultiSelect
            style={styles.dropdown}
            data={authorOptions}
            labelField="label"
            valueField="value"
            placeholder="Search and select authors"
            search
            value={selectedAuthors}
            onChange={handleAuthorChange}
            onChangeText={fetchAuthors} // Key line: fetch authors as user types
            maxSelect={3}
          /> */}

            <View style={styles.chipContainer}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              >
                <Text>Your favorite Authors:</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddAuthors")}
                >
                  <FontAwesome name="caret-right" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 5,
                  justifyContent: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {selectedAuthors.map((author, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{author}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.chipContainer}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                }}
              >
                <Text>Your favorite Genres:</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddGenres")}
                >
                  <FontAwesome name="caret-right" size={24} color="black" />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 5,
                  justifyContent: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {selectedGenres.map((genre, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* <Text style={styles.header}>Edit Profile</Text> */}

          {/* <Text style={styles.subHeader}>
        Select your favorite authors (max 3):
      </Text>
      <View style={styles.optionsContainer}>
        {authors.map((authors) => (
          <TouchableOpacity
            key={authors}
            onPress={() => handleAuthorSelect(authors)}
            style={[
              styles.optionBox,
              selectedAuthors.includes(authors) && styles.selectedBox,
            ]}
          >
            <Text style={styles.optionText}>{authors}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subHeader}>Select your favorite genres (max 3):</Text>
      <View style={styles.optionsContainer}>
        {genres.map((genres) => (
          <TouchableOpacity
            key={genres}
            onPress={() => handleGenreSelect(genres)}
            style={[
              styles.optionBox,
              selectedGenres.includes(genres) && styles.selectedBox,
            ]}
          >
            <Text style={styles.optionText}>{genres}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}> Photos</Text>
      <View style={styles.section}>
        <FlatList
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
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Save Changes" onPress={handleSave} />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          color="red"
        />
      </View> */}
        </Container>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 20,
    gap: 20,
  },
  chip: {
    backgroundColor: "#d1e7dd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {
    color: "#0f5132",
    fontSize: 14,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    gap: 60,
    borderRadius: 10,
    marginTop: 80,
    padding: 10,
    backgroundColor: "white",
  },

  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "centre",
    paddingBottom: 10,
    borderBottomColor: "grey",
    borderBottomWidth: 1,
  },

  flatListContent: {
    alignItems: "center",
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
    width: 120,
    aspectRatio: 1,
    borderRadius: 100,
    marginTop: -70,
    borderWidth: 3,
    borderColor: "brown",
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

export default EditProfileScreen;
