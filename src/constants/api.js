// export const SERVER_URL = "http://192.168.1.7:3000";
export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URLS;
export const GOOGLE_BOOKS_API_URL =
  process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_URLS ??
  "https://www.googleapis.com/books/v1/volumes";
export const BOOKS_API_KEY = process.env.EXPO_PUBLIC_BOOKS_API_KEYS;
