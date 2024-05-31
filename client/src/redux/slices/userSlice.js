import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  userId: null,
  username: null,
  photoUrl: null,
  bio: null,
  error: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.photoUrl = action.payload.photoUrl;
      state.bio = action.payload.bio;
      state.error = null;
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.username = null;
      state.photoUrl = null;
      state.bio = null;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { login, logout, setError } = userSlice.actions;

// Selectors
export const selectToken = (state) => state.user.token;
export const selectUserId = (state) => state.user.userId;
export const selectUsername = (state) => state.user.username;
export const selectPhotoUrl = (state) => state.user.photoUrl;
export const selectBio = (state) => state.user.bio;
export const selectError = (state) => state.user.error;

export default userSlice.reducer;
