import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
};

const appSlice = createSlice({
    name:"app",
    initialState,
    reducers:{
        setIsAuthenticated:(state, action) =>{
            state.isAuthenticated = action.payload;
        }
    }
});

export const {
    setIsAuthenticated
} = appSlice.actions;

export default appSlice.reducer;