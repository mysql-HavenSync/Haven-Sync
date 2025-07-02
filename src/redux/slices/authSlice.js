import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null, // ✅ Add this line
  },
  reducers: {
    setUser: (state, action) => {
  state.user = {
    ...action.payload,
    user_id: action.payload.user_id, // ✅ make sure it's included
  };
},
    setToken: (state, action) => { // ✅ Add this reducer
      state.token = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null; // ✅ Clear token too on logout
    },
  },
});

export const { setUser, setToken, clearUser } = authSlice.actions;
export default authSlice.reducer;
  