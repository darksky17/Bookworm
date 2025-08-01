import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, Text } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { setFavGenres } from "../redux/userSlice";
import { setDoc, updateDoc, auth } from "../Firebaseconfig";

import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";

import { MultiSelect } from "react-native-element-dropdown";

import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";

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

  userId = auth.currentUser.uid;

  useEffect(() => {
    const initialOptions = globalSelected.favGenres.map((genre) => ({
      label: genre,
      value: genre,
    }));
    setGenreOptions(initialOptions);
  }, []);

  const handleSave = async () => {
    if (selectedGenres.length < 3) {
      Alert.alert("Error", "Please select 3 genres.");
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
    <Container>
      <Header title={"Add Genres"} />
      <ScrollView>
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

              borderRadius: moderateScale(12),
              borderWidth: 1,
              borderColor: "#ddd",
              padding: 5,
              marginTop: verticalScale(5),
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
              ItemSeparatorComponent: () => (
                <View style={{ height: verticalScale(15) }} />
              ),
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
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: verticalScale(30),
    backgroundColor: theme.colors.background,
  },
  itemContainer: {
    flex: 1,
    gap: 20,
    padding: 15,

    borderRadius: 8,

    borderWidth: 1,
    borderColor: "#eee",
  },

  dropdown: {
    height: verticalScale(55),
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(15),
    backgroundColor: "#fafafa",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  dropdownList: {
    backgroundColor: "green",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#ddd",
    maxHeight: verticalScale(250),
    paddingVertical: verticalScale(5),
    marginTop: verticalScale(5),
  },

  selectedItem: {
    backgroundColor: theme.colors.secondary,

    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(5),
    marginTop: verticalScale(20),
  },
  selectedItemList: {
    flex: 1,
    gap: 20,
    padding: 15,
    backgroundColor: "green",

    borderRadius: moderateScale(8),

    borderWidth: 1,
    borderColor: "#eee",
  },

  selectedText: {
    color: "white",
    fontWeight: "600",
    fontSize: moderateScale(14),
  },

  buttonContainer: {
    gap: 10,
    justifyContent: "space-between",
  },
});

export default AddGenresScreen;
