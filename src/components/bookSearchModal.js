// components/BookSearchModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useBookSearch } from "../hooks/useBookSearch";
import theme from "../design-system/theme/theme";
import {
  moderateScale,
  verticalScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils";

const BookSearchModal = ({
  visible,
  onClose,
  onSelectBook,
  currentSelection = "",
  placeholder = "Type book title or author...",
  title = "Search Books",
}) => {
  const { bookOptions, loadingBooks, searchQuery, handleSearch, clearSearch } =
    useBookSearch();

  const handleClose = () => {
    clearSearch();
    onClose();
  };

  const handleBookSelect = (book) => {
    onSelectBook(book.value, book.bookData); // Pass both title and full book data
    handleClose();
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          {loadingBooks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4caf50" />
              <Text style={styles.loadingText}>Searching books...</Text>
            </View>
          ) : bookOptions.length === 0 && searchQuery.length >= 3 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No books found for "{searchQuery}"
              </Text>
              <Text style={styles.emptySubText}>
                Try a different search term
              </Text>
            </View>
          ) : bookOptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Start typing to search for books...
              </Text>
            </View>
          ) : (
            <FlatList
              data={bookOptions}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bookItem}
                  onPress={() => handleBookSelect(item)}
                >
                  <Text style={styles.bookTitle}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Current Selection Footer */}
        {currentSelection && (
          <View style={styles.selectionFooter}>
            <Text style={styles.selectionLabel}>Currently selected:</Text>
            <Text style={styles.selectionValue}>{currentSelection}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  bookItem: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: horizontalScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookTitle: {
    fontSize: theme.fontSizes.medium,
    color: "#333",
    lineHeight: verticalScale(22),
    flex: 1,
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
});

export default BookSearchModal;
