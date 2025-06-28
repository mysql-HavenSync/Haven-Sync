// navigation/AppNavigation.js
// Main Navigation Setup for Smart Home App

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';

// Import your existing screens and components
import Dashboard from '../features/HexaDashboard';
import DeviceNavigationDrawer from '../components/DeviceNavigationDrawer';
import { generateDevicePageComponent } from '../features/DevicePageGenerator';
import { updateDevice } from '../redux/slices/switchSlice';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Main App Navigation Setup
const AppNavigation = () => {
  const dispatch = useDispatch();
  
  // Updated selector to match your Redux structure
  const devices = useSelector(state => state.switches.activeDevices);

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <DeviceNavigationDrawer {...props} />}
        screenOptions={{
          headerShown: true,
          drawerStyle: { 
            backgroundColor: '#1a1a1a', 
            width: 280 
          },
          headerStyle: {
            backgroundColor: '#2c3e50',
          },
          headerTintColor: '#ecf0f1',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Main Dashboard Screen */}
        <Drawer.Screen 
          name="Dashboard" 
          component={Dashboard}
          options={{ 
            title: 'Smart Home Dashboard',
            drawerLabel: 'Dashboard',
          }}
        />
        
        {/* Dynamic Device Control Screens */}
        <Drawer.Screen 
          name="DeviceControl" 
          component={({ route, navigation }) => {
            const { device } = route.params;
            
            // Generate dynamic device control page
            const DevicePageComponent = generateDevicePageComponent(
              device, 
              dispatch, 
              (deviceId, updates) => dispatch(updateDevice({ id: deviceId, ...updates }))
            );
            
            return <DevicePageComponent navigation={navigation} />;
          }}
          options={({ route }) => ({
            title: route.params?.device?.name || 'Device Control',
            headerStyle: { 
              backgroundColor: '#2c3e50' 
            },
            headerTintColor: '#ecf0f1',
            drawerItemStyle: { 
              display: 'none' // Hide from drawer menu
            },
          })}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;