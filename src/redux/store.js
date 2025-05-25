import {configureStore} from '@reduxjs/toolkit';
import switchReducer from './slices/switchSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    switches: switchReducer,
    profile: profileReducer,
    auth: authReducer,
  },
});

export default store;

