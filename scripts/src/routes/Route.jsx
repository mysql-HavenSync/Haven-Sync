import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {useSelector} from 'react-redux';  
import * as Components from '../imports/imports';
import DeviceDetectorLoader from '../components/DeviceDetectorLoader';
import DeviceDetail from '../components/DeviceDetail';


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// 🧭 Main stack with screens
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
      <Stack.Screen
        name="HexaWelcomeScreen"
        component={Components.HexaWelcomeScreen}
      />
      <Stack.Screen
        name="HexaLoginScreen"
        component={Components.HexaLoginScreen}
      />
      <Stack.Screen
        name="HexaSignUpScreen"
        component={Components.HexaSignUpScreen}
      />
      <Stack.Screen
        name="ForgotPasswordRequest"
        component={Components.ForgotPasswordRequest}
      />
      <Stack.Screen
        name="OTPVerification"
        component={Components.OTPVerification}
      />
      <Stack.Screen
        name="ResetPassword"
        component={Components.ResetPassword}
      />
      <Stack.Screen
        name="DeviceDetectorLoader"
        component={DeviceDetectorLoader}
      />
      
      {/* DeviceDetailPage moved to DashboardDrawer - remove from here */}
    </Stack.Navigator>
  );
};

// 🧭 Settings Stack Navigator for settings-related screens
const SettingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
      <Stack.Screen
        name="HexaSettingsMain"
        component={Components.HexaSettings}
      />
      <Stack.Screen
        name="UserManagement"
        component={Components.UserManagement}
      />
      <Stack.Screen
        name="FeedbackPage"
        component={Components.FeedbackPage}
      />
      <Stack.Screen
        name="BugReport"
        component={Components.BugReport}
      />
      <Stack.Screen
        name="AboutPage"
        component={Components.AboutPage}
      />
      <Stack.Screen
        name="IntegrationsPage"
        component={Components.IntegrationsPage}
      />
    </Stack.Navigator>
  );
};

// 🧭 Drawer with dashboard routes
const DashboardDrawer = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#84c3e0',
      }}>
      <Drawer.Screen
        name="HexaDashboard"
        component={Components.HexaDashboard}
      />
      <Drawer.Screen
        name="HexaDeviceRadar"
        component={Components.HexaDeviceRadar}
      />
      <Drawer.Screen
        name="HexaEditProfile"
        component={Components.HexaEditProfile}
      />
      {/* ⚙️ Settings as a stack navigator */}
      <Drawer.Screen
        name="HexaSettings"
        component={SettingsStack}
      />
      {/* 📱 Add DeviceDetailPage here instead */}
      <Drawer.Screen
        name="HexaDevices"
        component={Components.HexaDevices}
        options={{
          headerShown: false,
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
      <Stack.Screen 
  name="DeviceDetail" 
  component={DeviceDetail}
  options={{ headerShown: false }}
/>
    </Drawer.Navigator>
  );
};

// 🔁 Combine drawer and stack
export default function Routes() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="MainStack" component={MainStack} />
      <Stack.Screen name="DashboardDrawer" component={DashboardDrawer} />
    </Stack.Navigator>
  );
}