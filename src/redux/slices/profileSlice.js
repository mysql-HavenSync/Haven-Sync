import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    avatar: 'https://cdn-icons-gif.flaticon.com/17644/17644526.gif', // Default avatar
    darkMode: false,
  },
  reducers: {
    updateProfile: (state, action) => {
      const { name, email, phone, dob, gender, avatar } = action.payload;
      if (name !== undefined) state.name = name;
      if (email !== undefined) state.email = email;
      if (phone !== undefined) state.phone = phone;
      if (dob !== undefined) state.dob = dob;
      if (gender !== undefined) state.gender = gender;
      if (avatar !== undefined) state.avatar = avatar;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    clearProfile: (state) => {
      state.name = '';
      state.email = '';
      state.phone = '';
      state.dob = '';
      state.gender = '';
      state.avatar = 'https://cdn-icons-gif.flaticon.com/17644/17644526.gif';
      state.darkMode = false;
    },
  },
});

export const { updateProfile, toggleDarkMode, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
