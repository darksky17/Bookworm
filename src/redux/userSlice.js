import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  phoneNumber: "",
  name: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  favGenres: [],
  favAuthors: [],
  photos: [],
  ageMin: 18,
  ageMax: 100,
  unsubscribeUserListener: null,
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
    setPhotos: (state, action) => {
      state.photos = action.payload;
    },
    setAgeRange(state, action) {
      const { min, max } = action.payload;
      state.ageMin = min;
      state.ageMax = max;
    },

    setDistance: (state, action) => {
      state.distance = action.payload;
    },

    setUserState: (state, action) => {
      // Destructure the payload to exclude lastUpdated
      const { lastUpdated, ...updatedData } = action.payload;

      // Log the updatedData to verify it's excluding lastUpdated

      return { ...state, ...updatedData };
    },

    setLocation: (state, action) => {
      state.location = action.payload; // Update location in state
    },

    setUnsubscribeUserListener: (state, action) => {
      state.unsubscribeUserListener = action.payload;
    },

    // ✅ Clear state and unsubscribe safely
    clearUserState: (state) => {
      if (state.unsubscribeUserListener) {
        state.unsubscribeUserListener();
        state.unsubscribeUserListener = null;
      }

      // Reset all user state
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
  setPhotos,
  setUserState,
  setLocation,
  setAgeRange,
  setDistance,
  setUnsubscribeUserListener,
  clearUserState,
} = userSlice.actions;

export default userSlice.reducer;
