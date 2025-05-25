import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {TouchableOpacity, Text, StatusBar} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faChevronLeft} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {SlideInUp} from 'react-native-reanimated';
import {useSelector} from 'react-redux';
import * as Components from '../imports/imports';
import DeviceDetectorLoader from '../components/DeviceDetectorLoader';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// 🔙 Custom back button component
const CustomBackButton = React.memo(() => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }}
      className="py-1">
      <FontAwesomeIcon icon={faChevronLeft} size={22} color="#fff" />
    </TouchableOpacity>
  );
});

// 🎯 Custom header component
const CustomHeader = ({title, showBackButton}) => {
  const mainToggleTimer = useSelector(state => state.switches.mainToggleTimer);

  const formatTime = seconds => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '00:00:00';
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeTitle = typeof title === 'string' ? title : '';

  return (
    <>
      <StatusBar backgroundColor="#84c3e0" barStyle="light-content" />
      <LinearGradient
        colors={['#84c3e0', '#bedcea']}
        style={{borderBottomLeftRadius: 50, borderBottomRightRadius: 50}}
        className="h-[70px] flex-row items-start px-5 pb-10 pt-4">
        {showBackButton && <CustomBackButton />}
        <Animated.View entering={SlideInUp.delay(150)} className="flex-1">
          <Text className="text-white text-xl font-bold text-center">
            {safeTitle}
          </Text>
          {mainToggleTimer > 0 && (
            <Animated.View entering={SlideInUp.delay(150)} className="ml-2">
              <Text className="text-white text-lg font-semibold text-center">
                {formatTime(mainToggleTimer)}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </LinearGradient>
    </>
  );
};

// 🧭 Main stack with screens
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
        },
        headerTitleAlign: 'center',
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
      <Stack.Screen
        name="HexaWelcomeScreen"
        component={Components.HexaWelcomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="HexaLoginScreen"
        component={Components.HexaLoginScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="HexaSignUpScreen"
        component={Components.HexaSignUpScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ForgotPasswordRequest"
        component={Components.ForgotPasswordRequest}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="OTPVerification"
        component={Components.OTPVerification}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ResetPassword"
        component={Components.ResetPassword}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="DeviceDetectorLoader"
        component={DeviceDetectorLoader}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

// 🧭 Drawer with dashboard routes
const DashboardDrawer = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        header: () => <CustomHeader title="" showBackButton={false} />,
        drawerActiveTintColor: '#84c3e0',
      }}>
      <Drawer.Screen
        name="HexaDashboard"
        component={Components.HexaDashboard}
        options={{title: 'Dashboard'}}
      />
      <Drawer.Screen
        name="HexaDeviceRadar"
        component={Components.HexaDeviceRadar}
        options={{title: 'Device Radar'}}
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
