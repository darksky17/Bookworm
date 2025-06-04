import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, Text } from "react-native";

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
              onChangeText={filterGenres}
              maxSelect={5}
              selectedTextStyle={styles.selectedText}
              containerStyle={{
                backgroundColor: "white",
                flex: 1,

                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 5,
                marginTop: 5,
              }}
              renderItem={(item, selected) => (
                <View
                  style={[
                    styles.itemContainer,
                    selected && styles.selectedItemList,
                  ]}
                >
                  <Text
                    style={[styles.itemText, selected && styles.selectedText]}
                  >
                    {item.label}
                  </Text>
                </View>
              )}
              selectedStyle={styles.selectedItem}
              flatListProps={{
                ItemSeparatorComponent: () => <View style={{ height: 15 }} />,
              }}
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                style={styles.buttonSave}
                onPress={handleSave}
                labelStyle={{ fontWeight: "700" }}
              >
                Save Changes
              </Button>

              <Button
                mode="contained"
                style={styles.buttonCancel}
                onPress={() => navigation.goBack()}
                labelStyle={{ color: "#333", fontWeight: "700" }}
              >
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  itemContainer: {
    flex: 1,
    gap: 20,
    padding: 15,
    backgroundColor: "white",

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#eee",
  },

  dropdown: {
    height: 55,
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  dropdownList: {
    backgroundColor: "green",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: 250,
    paddingVertical: 5,
    marginTop: 5,
  },

  selectedItem: {
    backgroundColor: "#4caf50",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 20,
  },
  selectedItemList: {
    flex: 1,
    gap: 20,
    padding: 15,
    backgroundColor: "green",

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#eee",
  },

  selectedText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  buttonContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  buttonSave: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#4caf50",
    borderRadius: 12,
    paddingVertical: 10,
  },

  buttonCancel: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#ccc",
    borderRadius: 12,
    paddingVertical: 10,
  },
});

export default AddGenresScreen;
