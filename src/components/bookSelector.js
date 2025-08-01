// components/BookSelector.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BookSearchModal from "./bookSearchModal";
import theme from "../design-system/theme/theme";
import {
  moderateScale,
  verticalScale,
  horizontalScale,
} from "../design-system/theme/scaleUtils";

const BookSelector = ({
  label = "Select a Book",
  placeholder = "Search or pick a book",
  value = "",
  onBookSelect,
  modalTitle = "Search Books",
  modalPlaceholder = "Type book title or author...",
  style,
  required = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleBookSelect = (bookTitle, bookAuthor) => {
    if (onBookSelect) {
      onBookSelect(bookTitle, bookAuthor);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )} */}

      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      <BookSearchModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelectBook={handleBookSelect}
        currentSelection={value}
        title={modalTitle}
        placeholder={modalPlaceholder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: theme.fontSizes.medium,
    fontWeight: "bold",
    marginBottom: verticalScale(8),
    color: theme.colors.text,
  },
  required: {
    color: "#e74c3c",
  },
  dropdown: {
    flex: 1,
    height: verticalScale(55),
    minWidth: "90%",
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
    justifyContent: "center",
    alignItems: "center",
    paddingTop: verticalScale(10),
  },
});

export default BookSelector;
