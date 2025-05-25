import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  name: 'John Monroe',
  email: 'john@figma.com',
  phone: '9874563210',
  dob: '1995-08-16',
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
