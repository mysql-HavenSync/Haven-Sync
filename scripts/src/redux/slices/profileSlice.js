import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  avatar: 'https://cdn-icons-gif.flaticon.com/17644/17644526.gif',
  name: 'HavenSync User',
  email: 'User@HavenSync.com',
  phone: '9874563210',
  dob: 'DD/MM/YYYY',
  darkMode: false,
  newPassword: '',
  confirmPassword: '',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      return {...state, ...action.payload};
    },
    toggleDarkMode: state => {
      state.darkMode = !state.darkMode;
    },
  },
});

export const {updateProfile, toggleDarkMode} = profileSlice.actions;
export default profileSlice.reducer;
