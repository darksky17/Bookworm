import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { useDispatch, useSelector } from "react-redux";
import { setFavAuthors } from "../redux/userSlice";
import { setDoc, auth } from "../Firebaseconfig";

import { fetchUserDataById } from "../components/FirestoreHelpers";
import Container from "../components/Container";
import Header from "../components/Header";

import { Button } from "react-native-paper";
import theme from "../design-system/theme/theme";
import {
  verticalScale,
  horizontalScale,
  moderateScale,
} from "../design-system/theme/scaleUtils";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";

const AddAuthorsScreen = ({ navigation }) => {
  const globalSelected = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedAuthors, setSelectedAuthors] = useState([
    ...globalSelected.favAuthors,
  ]);

  const [authorOptions, setAuthorOptions] = useState([]);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [authorSearchQuery, setAuthorSearchQuery] = useState("");
  const [loadingAuthors, setLoadingAuthors] = useState(false);

  const userId = auth.currentUser.uid;

  const fetchAuthors = async (query) => {
    if (!query || query.length < 3) {
      setAuthorOptions([]);
      return;
    }

    setLoadingAuthors(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=inauthor:${encodeURIComponent(
          query
        )}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

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
      Alert.alert("Error", "Failed to fetch authors. Please try again.");
    } finally {
      setLoadingAuthors(false);
    }
  };

  const handleAuthorSelection = (author) => {
    if (selectedAuthors.includes(author)) {
      // Remove author if already selected
      setSelectedAuthors(selectedAuthors.filter((a) => a !== author));
    } else {
      // Add author if not selected and under limit
      if (selectedAuthors.length >= 5) {
        Alert.alert("Limit reached", "You can select up to 5 authors.");
        return;
      }
      setSelectedAuthors([...selectedAuthors, author]);
    }
  };

  const handleSave = async () => {
    if (selectedAuthors.length < 3) {
      Alert.alert("Error", "Please select at least 3 authors.");
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

      navigation.navigate("EditProfile");
    } catch (error) {
      console.error("Error saving user data to Firestore:", error);
      Alert.alert(
        "Error",
        "There was an error saving your data. Please try again."
      );
    }
  };

  const openAuthorModal = () => {
    setAuthorSearchQuery("");
    setAuthorOptions([]);
    setShowAuthorModal(true);
  };

  const closeAuthorModal = () => {
    setShowAuthorModal(false);
    setAuthorSearchQuery("");
    setAuthorOptions([]);
  };

  return (
    <Container>
      <Header title={"Add Authors"} />
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.subHeader}>
            Select Your Favorite Authors (3-5):
          </Text>

          <TouchableOpacity style={styles.dropdown} onPress={openAuthorModal}>
            <Text
              style={[
                styles.dropdownText,
                selectedAuthors.length === 0 && styles.placeholderText,
              ]}
            >
              {selectedAuthors.length > 0
                ? `${selectedAuthors.length} author${
                    selectedAuthors.length > 1 ? "s" : ""
                  } selected`
                : "Search and select authors"}
            </Text>
          </TouchableOpacity>

          {/* Display selected authors */}
          {selectedAuthors.length > 0 && (
            <View style={styles.selectedAuthorsContainer}>
              {selectedAuthors.map((author, index) => (
                <View key={index} style={styles.selectedAuthorChip}>
                  <Text style={styles.selectedAuthorText}>{author}</Text>
                  <TouchableOpacity
                    onPress={() => handleAuthorSelection(author)}
                    style={styles.removeAuthorButton}
                  >
                    <Text style={styles.removeAuthorText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

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

      {/* Author Selection Modal */}
      <Modal
        visible={showAuthorModal}
        animationType="slide"
        onRequestClose={closeAuthorModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Authors</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeAuthorModal}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Type author name..."
              placeholderTextColor="#999"
              value={authorSearchQuery}
              onChangeText={(text) => {
                setAuthorSearchQuery(text);
                fetchAuthors(text);
              }}
              autoFocus
              returnKeyType="search"
            />
          </View>

          {/* Selection Counter */}
          <View style={styles.selectionCounter}>
            <Text style={styles.selectionCounterText}>
              {selectedAuthors.length}/5 selected (minimum 3 required)
            </Text>
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {loadingAuthors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4caf50" />
                <Text style={styles.loadingText}>Searching authors...</Text>
              </View>
            ) : authorOptions.length === 0 && authorSearchQuery.length >= 3 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No authors found for "{authorSearchQuery}"
                </Text>
                <Text style={styles.emptySubText}>
                  Try a different search term
                </Text>
              </View>
            ) : authorOptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Start typing to search for authors...
                </Text>
              </View>
            ) : (
              <FlatList
                data={authorOptions}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const isSelected = selectedAuthors.includes(item.value);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.authorItem,
                        isSelected && styles.selectedAuthorItem,
                      ]}
                      onPress={() => handleAuthorSelection(item.value)}
                    >
                      <Text
                        style={[
                          styles.authorTitle,
                          isSelected && styles.selectedAuthorTitle,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <Text style={styles.selectedIcon}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Current Selection Footer */}
          {selectedAuthors.length > 0 && (
            <View style={styles.selectionFooter}>
              <Text style={styles.selectionLabel}>
                Selected authors ({selectedAuthors.length}/5):
              </Text>
              <Text style={styles.selectionValue}>
                {selectedAuthors.join(", ")}
              </Text>
            </View>
          )}

          {/* Done Button */}
          <View style={styles.modalFooter}>
            <Button
              mode="contained"
              onPress={closeAuthorModal}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.text}
              disabled={selectedAuthors.length < 3}
            >
              Done ({selectedAuthors.length} selected)
            </Button>
          </View>
        </View>
      </Modal>
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
  subHeader: {
    fontSize: theme.fontSizes.large,
    fontWeight: "bold",
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
    justifyContent: "center",
  },
  dropdownText: {
    fontSize: moderateScale(16),
    color: "#000",
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.text,
  },
  selectedAuthorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: horizontalScale(8),
    marginTop: verticalScale(5),
  },
  selectedAuthorChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.secondary,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(6),
    paddingHorizontal: horizontalScale(12),
  },
  selectedAuthorText: {
    color: "white",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginRight: verticalScale(6),
  },
  removeAuthorButton: {
    width: horizontalScale(16),
    height: verticalScale(16),
    borderRadius: moderateScale(9),
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeAuthorText: {
    color: "white",
    fontSize: theme.fontSizes.small,
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 10,
    justifyContent: "space-between",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    paddingTop: verticalScale(50),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#666",
  },
  searchContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    height: verticalScale(50),
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(15),
    fontSize: moderateScale(16),
    backgroundColor: "#fafafa",
  },
  selectionCounter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(10),
  },
  selectionCounterText: {
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: horizontalScale(20),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  loadingText: {
    marginTop: verticalScale(15),
    fontSize: theme.fontSizes.medium,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: theme.fontSizes.medium,
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(5),
  },
  emptySubText: {
    fontSize: moderateScale(14),
    color: "#999",
    textAlign: "center",
  },
  authorItem: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedAuthorItem: {
    backgroundColor: "#e8f5e8",
  },
  authorTitle: {
    fontSize: theme.fontSizes.medium,
    color: "#333",
    lineHeight: verticalScale(22),
    flex: 1,
  },
  selectedAuthorTitle: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  selectedIcon: {
    fontSize: moderateScale(18),
    color: "#4caf50",
    fontWeight: "bold",
    marginLeft: horizontalScale(10),
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: horizontalScale(10),
  },
  selectionFooter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    backgroundColor: "#f0f8f0",
    borderTopWidth: 1,
    borderTopColor: "#d4edda",
  },
  selectionLabel: {
    fontSize: moderateScale(14),
    color: "#28a745",
    fontWeight: "600",
    marginBottom: 3,
  },
  selectionValue: {
    fontSize: theme.fontSizes.medium,
    color: "#155724",
    fontWeight: "bold",
  },
  modalFooter: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(15),
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});

export default AddAuthorsScreen;