import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { setFavAuthors } from "../redux/userSlice";
import { setDoc, updateDoc, auth } from "../Firebaseconfig";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";
import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";
import theme from "../design-system/theme/theme";
import { MultiSelect } from "react-native-element-dropdown";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
import { Button } from "react-native-paper";

const AddAuthorsScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedAuthors, setSelectedAuthors] = useState([
    ...globalSelected.favAuthors,
  ]);

  const [authorOptions, setAuthorOptions] = useState([]);

  userId = auth.currentUser.uid;

  useEffect(() => {
    const initialOptions = globalSelected.favAuthors.map((author) => ({
      label: author,
      value: author,
    }));
    setAuthorOptions(initialOptions);
  }, []);

  const handleSave = async () => {
    if (selectedAuthors.length < 3) {
      Alert.alert("Error", "Please select 3 authors.");
      return;
    }

    try {
      const { userDocRef } = await fetchUserDataById(userId);
      await setDoc(
        userDocRef,
        {
          favAuthors: selectedAuthors,
        },
        { merge: true }
      );

      dispatch(setFavAuthors(selectedAuthors));

      navigation.replace("EditProfile");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const fetchAuthors = async (query) => {
    if (!query || query.length < 3) return;

    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=inauthor:${query}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      const authorsSet = new Set(selectedAuthors); // preserve current selection

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
    if (selected.length > 5) {
      Alert.alert("Limit reached", "You can select up to 3 authors.");
      return setSelectedAuthors([...selectedAuthors]);
    }
    setSelectedAuthors(selected);
  };

  return (
    <Container>
      <Header title={"Add Authors"} />
      <ScrollView>
        <View style={styles.container}>
          <MultiSelect
            style={styles.dropdown}
            data={authorOptions}
            labelField="label"
            valueField="value"
            placeholder="Search and select authors"
            search
            value={selectedAuthors}
            onChange={handleAuthorChange}
            onChangeText={fetchAuthors} // Key line: fetch authors as user types
            maxSelect={5}
            selectedTextStyle={styles.selectedText}
            dropdownStyle={styles.dropdownList}
            selectedStyle={styles.selectedItem}
          />
          <View style={{ gap: verticalScale(10) }}>
            <Button mode="contained" onPress={() => handleSave()}>
              Save Changes
            </Button>
            <Button mode="contained" onPress={() => navigation.goBack()}>
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "#f9f9f9",
  },
  selectedItem: {
    backgroundColor: "#d1e7dd", // Background color of selected items
    borderRadius: moderateScale(20),
  },
  dropdownList: {
    backgroundColor: "white", // Background color of the dropdown
    borderRadius: moderateScale(10),
    borderColor: "#ccc",
    borderWidth: 1,
    marginTop: verticalScale(10),
  },
  chipContainer: {
    flexDirection: "column",
    borderWidth: 1,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(20),
    gap: verticalScale(20),
  },
  selectedText: {
    color: "#0f5132", // Text color of selected items
    fontWeight: "bold",
    fontSize: theme.fontSizes.small,
  },
  chip: {
    backgroundColor: "#d1e7dd",
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(20),
  },
  chipText: {
    color: "#0f5132",
    fontSize: moderateScale(14),
  },
  container: {
    flex: 1,
    flexDirection: "column",
    gap: verticalScale(60),
    borderRadius: moderateScale(10),
    padding: 15,
    backgroundColor: theme.colors.background,
  },
});

export default AddAuthorsScreen;
