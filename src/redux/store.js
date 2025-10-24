import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import appReducer from "./appSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    app:appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["user.unsubscribeUserListener"],
        ignoredActions: ["user/setUnsubscribeUserListener"],
      },
    }),
});
