import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";

import auth from "@react-native-firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { setFavGenres, setFavAuthors, setPhotos } from "../redux/userSlice";
import { setDoc, updateDoc } from "@react-native-firebase/firestore";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";

import { MultiSelect } from "react-native-element-dropdown";

import { Button } from "react-native-paper";

const genres = [
  "Fiction",
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Horror",
  "Mystery",
  "Thriller",
  "Historical Fiction",
  "Young Adult",
  "Children's",
  "Adventure",
  "Dystopian",
  "Literary Fiction",
  "Contemporary",
  "Paranormal",
  "Graphic Novels",
  "Crime",
  "Memoir",
  "Biography",
  "Autobiography",
  "Self-Help",
  "Poetry",
  "Drama",
  "Satire",
  "Classics",
  "LGBTQ+",
  "Spirituality",
  "Science",
  "Psychology",
  "Philosophy",
  "Health & Wellness",
  "Cookbooks",
  "True Crime",
  "Politics",
  "Travel",
  "Art & Photography",
  "Business",
  "Economics",
  "Religion",
  "Mythology",
  "Western",
  "Anthology",
  "Short Stories",
  "Education",
  "Parenting",
  "Technology",
  "Environment",
  "War & Military",
];

const AddGenresScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedGenres, setSelectedGenres] = useState([
    ...globalSelected.favGenres,
  ]);

  const [genreOptions, setGenreOptions] = useState([]);

  userId = auth().currentUser.uid;

  useEffect(() => {
    const initialOptions = globalSelected.favGenres.map((genre) => ({
      label: genre,
      value: genre,
    }));
    setGenreOptions(initialOptions);
  }, []);

  const handleSave = async () => {
    if (selectedGenres.length < 5) {
      Alert.alert("Error", "Please select 5 genres.");
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          favGenres: selectedGenres,
        },
        { merge: true }
      );

      dispatch(setFavGenres(selectedGenres));

      navigation.navigate("EditProfile");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const filterGenres = (query) => {
    if (!query || query.length < 1) {
      setGenreOptions([]); // or reset to full list if you prefer
      return;
    }

    const filtered = genres
      .filter((genre) => genre.toLowerCase().includes(query.toLowerCase()))
      .map((genre) => ({
        label: genre,
        value: genre,
      }));

    setGenreOptions(filtered);
  };

  const handleGenreChange = (selected) => {
    if (selected.length > 5) {
      Alert.alert("Limit reached", "You can select up to 5 genres.");
      return setSelectedGenres([...selectedGenres]);
    }
    setSelectedGenres(selected);
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={"Add Genres"} />
      <ScrollView>
        <Container>
          <View style={styles.container}>
            <MultiSelect
              style={styles.dropdown}
              data={genres.map((g) => ({ label: g, value: g }))}
              labelField="label"
              valueField="value"
              placeholder="Search and select Genres"
              search
              value={selectedGenres}
              onChange={handleGenreChange}
              onChangeText={filterGenres} // Key line: fetch authors as user types
              maxSelect={5}
              selectedTextStyle={styles.selectedText}
              dropdownStyle={styles.dropdownList}
              selectedStyle={styles.selectedItem}
            />
            <View style={{ gap: 10 }}>
              <Button mode="contained" onPress={() => handleSave()}>
                Save Changes
              </Button>
              <Button mode="contained" onPress={() => navigation.goBack()}>
                Cancel
              </Button>
            </View>
          </View>
        </Container>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  selectedItem: {
    backgroundColor: "#d1e7dd", // Background color of selected items
    borderRadius: 20,
  },
  dropdownList: {
    backgroundColor: "white", // Background color of the dropdown
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginTop: 10,
  },
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 20,
    gap: 20,
  },
  selectedText: {
    color: "#0f5132", // Text color of selected items
    fontWeight: "bold",
    fontSize: 12,
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
    marginTop: 0,
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

export default AddGenresScreen;
