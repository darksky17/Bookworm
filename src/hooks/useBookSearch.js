// hooks/useBookSearch.js
import { useState } from "react";
import { Alert } from "react-native";
import { GOOGLE_BOOKS_API_URL, BOOKS_API_KEY } from "../constants/api";

export const useBookSearch = ({ isbookshelf = false } = {}) => {
  const [bookOptions, setBookOptions] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBooksWithAuthors = async (query) => {
    if (!query || query.length < 3) {
      setBookOptions([]);
      return;
    }

    setLoadingBooks(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=intitle:${encodeURIComponent(
          query
        )}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      if (!data.items) {
        setBookOptions([]);
        return;
      }

      const formatted = data.items.map((item) => {
        const title = item.volumeInfo.title || "Untitled";
        const authors = item.volumeInfo.authors || ["Unknown Author"];
        const authorNames = authors.join(", ");

        return {
          label: `${title} by ${authorNames}`,
          value: title,
          author: authorNames
        };
      });

      setBookOptions(formatted);
    } catch (error) {
      console.error("Error fetching books:", error);
      Alert.alert("Error", "Failed to fetch books. Please try again.");
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchForBookShelf = async (query) => {
    if (!query || query.length < 3) {
      setBookOptions([]);
      return;
    }



    setLoadingBooks(true);
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=intitle:${encodeURIComponent(
          query
        )}&key=${BOOKS_API_KEY}`
      );
      const data = await response.json();

      if (!data.items) {
        setBookOptions([]);
        return;
      }

      const formatted = data.items.map((item) => {

        const title = item.volumeInfo.title || "Untitled";
        const authors = item.volumeInfo.authors || ["Unknown Author"];
        const authorNames = authors.join(", ");
        const thumbnail = item.volumeInfo.imageLinks?.thumbnail || item.volumeInfo.imageLinks?.smallThumbnail;
        const pageCount = item.volumeInfo.pageCount
        return {
          label: `${title} by ${authorNames}`,
          value: title,
          author: authorNames,
          thumbnail: thumbnail,
          pageCount: pageCount
        };
      });

      setBookOptions(formatted);
    } catch (error) {
      console.error("Error fetching books:", error);
      Alert.alert("Error", "Failed to fetch books. Please try again.");
    } finally {
      setLoadingBooks(false);
    }
  }

  const handleSearch = (text) => {

    setSearchQuery(text);
    if (isbookshelf) {
      fetchForBookShelf(text);
    } else {


      fetchBooksWithAuthors(text);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setBookOptions([]);
  };

  return {
    bookOptions,
    loadingBooks,
    searchQuery,
    handleSearch,
    clearSearch,
  };
};
