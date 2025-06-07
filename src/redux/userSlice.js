import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  phoneNumber: "",
  name: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  favGenres: [],
  favAuthors: [],
  currentlyReading: "",
  bookSummary: "",
  photos: [],
  ageMin: 18,
  ageMax: 100,
  distance: 10,
  unsubscribeUserListener: null,
  notificationpref: true,
  pauseMatch: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setName: (state, action) => {
      state.name = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setDateOfBirth: (state, action) => {
      state.dateOfBirth = action.payload;
    },
    setGender: (state, action) => {
      state.gender = action.payload;
    },
    setFavGenres: (state, action) => {
      state.favGenres = action.payload;
    },
    setFavAuthors: (state, action) => {
      state.favAuthors = action.payload;
    },
    setCurrentlyReading: (state, action) => {
      state.currentlyReading = action.payload;
    },
    setBookSummary: (state, action) => {
      state.bookSummary = action.payload;
    },
    setPhotos: (state, action) => {
      state.photos = action.payload;
    },
    setAgeRange(state, action) {
      const { min, max } = action.payload;
      state.ageMin = min;
      state.ageMax = max;
    },
    setPauseMatch: (state, action) => {
      state.pauseMatch = action.payload;
    },

    setDistance: (state, action) => {
      state.distance = action.payload;
    },

    setUserState: (state, action) => {
      // Destructure the payload to exclude lastUpdated
      const { lastUpdated, deletedAt, ...updatedData } = action.payload;

      // Log the updatedData to verify it's excluding lastUpdated

      return { ...state, ...updatedData };
    },

    setLocation: (state, action) => {
      state.location = action.payload; // Update location in state
    },

    setUnsubscribeUserListener: (state, action) => {
      state.unsubscribeUserListener = action.payload;
    },
    setNotificationPref: (state, action) => {
      state.notificationpref = action.payload;
    },

    // ✅ Clear state and unsubscribe safely
    clearUserState: (state) => {
      const unsubscribe = state.unsubscribeUserListener;

      // ✅ Call outside Immer draft mutation
      if (unsubscribe) {
        unsubscribe(); // Stop the listener
      }

      // ✅ Return fresh state — no draft mutation done above
      return {
        ...initialState,
      };
    },
  },
});

export const {
  setPhoneNumber,
  setName,
  setEmail,
  setDateOfBirth,
  setGender,
  setFavGenres,
  setFavAuthors,
  setCurrentlyReading,
  setBookSummary,
  setPhotos,
  setUserState,
  setLocation,
  setAgeRange,
  setDistance,
  setUnsubscribeUserListener,
  clearUserState,
  setNotificationPref,
  setPauseMatch,
} = userSlice.actions;

export default userSlice.reducer;
