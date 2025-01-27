import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  phoneNumber: '',
  name: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  favGenres: [],
  favAuthors: [],
  photos: [],
};

const userSlice = createSlice({
  name: 'user',
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

    setUserState: (state, action) => {
      return { ...state, ...action.payload };
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
} = userSlice.actions;

export default userSlice.reducer;