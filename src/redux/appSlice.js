import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
    showChatToast: true,
    currentActiveChat:null,
};

const appSlice = createSlice({
    name:"app",
    initialState,
    reducers:{
        setIsAuthenticated:(state, action) =>{
            state.isAuthenticated = action.payload;
        },
        setShowChatToast:(state, action) =>{
            state.showChatToast = action.payload;
        },
        setCurrentActiveChat:(state, action) =>{
            state.currentActiveChat = action.payload;
        },

    }
});

export const {
    setIsAuthenticated,
    setShowChatToast,
    setCurrentActiveChat
} = appSlice.actions;

export default appSlice.reducer;