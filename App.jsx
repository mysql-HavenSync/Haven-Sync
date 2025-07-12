import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { NavigationContainer } from "@react-navigation/native";
import { Alert } from 'react-native';
import store from './src/redux/store';
import Routes from "./src/routes/Route";
import { useDeviceConnection } from './src/hooks/useDeviceConnection';

// DeviceConnectionProvider component
const DeviceConnectionProvider = ({ children }) => {
  const { wsConnected, devices } = useDeviceConnection();
  const { user, token } = useSelector(state => state.auth);
  
  // Show connection status to user
  useEffect(() => {
    if (user && token) {
      if (wsConnected) {
        console.log('✅ Device connection established');
      } else {
        console.log('🔄 Establishing device connection...');
      }
    }
  }, [wsConnected, user, token]);
  
  // Handle connection errors
  useEffect(() => {
    if (user && token && !wsConnected) {
      const timeout = setTimeout(() => {
        Alert.alert(
          'Connection Issue',
          'Unable to connect to device server. Some features may not work properly.',
          [
            { text: 'Retry', onPress: () => window.location.reload() },
            { text: 'Continue', style: 'cancel' }
          ]
        );
      }, 10000); // Show after 10 seconds of no connection
      
      return () => clearTimeout(timeout);
    }
  }, [wsConnected, user, token]);
  
  return children;
};

// Main App component
export default function App() {
  return (
    <Provider store={store}>
      <DeviceConnectionProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </DeviceConnectionProvider>
    </Provider>
  );
}