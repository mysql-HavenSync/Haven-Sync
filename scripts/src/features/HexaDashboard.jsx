// screens/Dashboard.js
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faHome,
  faPlus,
  faUser,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DeviceGridCard } from '../components/DeviceNavigationDrawer';
import { toggleSwitch, updateRegulator } from '../redux/slices/switchSlice';
import TopSection from '../components/TopSection';
import DeviceNavigationDrawer from '../components/DeviceNavigationDrawer';
import DeviceGrid from '../components/DeviceGrid';

const Dashboard = () => {
  const userName = useSelector(state => state.profile.name) || 'User';
  const darkMode = useSelector(state => state.profile.darkMode);
  const avatar = useSelector(state => state.profile.avatar);
  const devices = useSelector(state => state.switches.activeDevices);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('home');
  const [selectedNavItem, setSelectedNavItem] = useState({ id: 'all-devices', name: 'All Devices', type: 'all' });
  const [filteredDevices, setFilteredDevices] = useState(devices);
  
  // Animation refs for profile and settings
  const profileScaleAnim = useRef(new Animated.Value(1)).current;
  const settingsScaleAnim = useRef(new Animated.Value(1)).current;

  // Reset active tab to 'home' when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab('home');
    }, [])
  );

  // Device control handlers
  const handleToggle = (deviceId, switchIndex) => {
    dispatch(toggleSwitch({ deviceId, switchIndex }));
  };

  const handleSpeedChange = (deviceId, regulatorIndex, value) => {
    dispatch(updateRegulator({ deviceId, regulatorIndex, value }));
  };

  // Handle device/group selection from navigation drawer
  const handleDeviceSelect = (device) => {
    setSelectedNavItem(device);
    
    // Find the actual device object from Redux store
    const selectedDevice = devices.find(d => d.id === device.id);
    
    if (selectedDevice) {
      // Always show the device (DeviceGrid will handle extracting switches)
      setFilteredDevices([selectedDevice]);
    } else {
      setFilteredDevices([]);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedNavItem(group);
    const groupDevices = devices.filter(device => 
      group.deviceIds && group.deviceIds.includes(device.id)
    );
    setFilteredDevices(groupDevices);
  };

  const handleAllDevicesSelect = () => {
    setSelectedNavItem({ id: 'all-devices', name: 'All Devices', type: 'all' });
    setFilteredDevices(devices);
  };

  // Update filtered devices when devices change
  React.useEffect(() => {
    if (selectedNavItem.type === 'all' || selectedNavItem.id === 'all-devices') {
      setFilteredDevices(devices);
    } else if (selectedNavItem.type === 'device') {
      const device = devices.find(d => d.id === selectedNavItem.id);
      setFilteredDevices(device ? [device] : []);
    } else if (selectedNavItem.type === 'group') {
      const groupDevices = devices.filter(device => 
        selectedNavItem.deviceIds && selectedNavItem.deviceIds.includes(device.id)
      );
      setFilteredDevices(groupDevices);
    }
  }, [devices, selectedNavItem]);

  // Animation functions
  const animatePress = (animValue, callback) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const handleProfilePress = () => {
    animatePress(profileScaleAnim, () => {
      setTimeout(() => {
        navigation.navigate('HexaEditProfile');
      }, 50);
    });
  };

  const handleSettingsPress = () => {
    animatePress(settingsScaleAnim, () => {
      setTimeout(() => {
        navigation.navigate('HexaSettings');
      }, 50);
    });
  };

  const handleAddDevicePress = () => {
    // Don't set activeTab here since it will be reset by useFocusEffect when returning
    navigation.navigate('HexaDeviceRadar');
  };

  // Render main content
  const renderContent = () => {
    return (
      <>
        {/* Use TopSection component if available, otherwise show title */}
        {TopSection ? (
          <TopSection />
        ) : (
          <Text style={[styles.title, darkMode && styles.titleDark]}>
            Smart Home Dashboard
          </Text>
        )}

        {/* Device Navigation Drawer */}
        {DeviceNavigationDrawer ? (
          <DeviceNavigationDrawer
            onDeviceSelect={handleDeviceSelect}
            onGroupSelect={handleGroupSelect}
            onAllDevicesSelect={handleAllDevicesSelect}
            selectedItem={selectedNavItem}
          />
        ) : null}

        {/* Device Grid Component or Fallback */}
        {DeviceGrid ? (
          <DeviceGrid 
            filteredDevices={filteredDevices}
            selectedNavItem={selectedNavItem}
            navigation={navigation}
          />
        ) : (
          <FlatList
            data={filteredDevices}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DeviceGridCard
                device={item}
                onToggle={handleToggle}
                onSpeedChange={handleSpeedChange}
              />
            )}
            contentContainerStyle={styles.gridContainer}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.dark]}>
      <View style={styles.headerRow}>
        <View style={styles.leftSection}>
          <Animated.View style={{ transform: [{ scale: profileScaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.profileIconContainer,
                darkMode && styles.profileIconContainerDark
              ]}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              {avatar && avatar.length > 0 ? (
                <Image 
                  source={{ uri: avatar }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                  onError={(error) => console.log('Image loading error:', error)}
                  onLoad={() => console.log('Image loaded successfully')}
                />
              ) : (
                <FontAwesomeIcon icon={faUser} size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.welcomeText, darkMode && styles.welcomeTextDark]}>
              Hello,
            </Text>
            <Text style={[styles.userName, darkMode && styles.userNameDark]}>
              {userName}
            </Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ scale: settingsScaleAnim }] }}>
          <TouchableOpacity 
            onPress={handleSettingsPress}
            activeOpacity={0.8}
            style={[
              styles.settingsIconContainer,
              darkMode && styles.settingsIconContainerDark
            ]}
          >
            <FontAwesomeIcon icon={faBars} size={22} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNavContainer, darkMode && styles.bottomNavContainerDark]}>
        <View style={[styles.bottomNav, darkMode && styles.bottomNavDark]}>
          
          {/* Home Tab */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'home' && styles.activeNavTab,
              darkMode && activeTab === 'home' && styles.activeNavTabDark
            ]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.navIconContainer,
              activeTab === 'home' && styles.activeNavIconContainer
            ]}>
              <FontAwesomeIcon 
                icon={faHome} 
                size={20} 
                color={activeTab === 'home' ? '#fff' : (darkMode ? '#888' : '#666')} 
              />
            </View>
            <Text style={[
              styles.navText,
              activeTab === 'home' && styles.activeNavText,
              darkMode && styles.navTextDark
            ]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* Add Device Tab */}
          <TouchableOpacity
            style={[
              styles.navTab,
              activeTab === 'add' && styles.activeNavTab,
              darkMode && activeTab === 'add' && styles.activeNavTabDark
            ]}
            onPress={handleAddDevicePress}
            activeOpacity={0.8}
          >
            <View style={[
              styles.navIconContainer,
              activeTab === 'add' && styles.activeNavIconContainer
            ]}>
              <FontAwesomeIcon 
                icon={faPlus} 
                size={20} 
                color={activeTab === 'add' ? '#fff' : (darkMode ? '#888' : '#666')} 
              />
            </View>
            <Text style={[
              styles.navText,
              activeTab === 'add' && styles.activeNavText,
              darkMode && styles.navTextDark
            ]}>
              Add Device
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  dark: {
    backgroundColor: '#121212',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Profile icon styles
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#3498db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  profileIconContainerDark: {
    backgroundColor: '#2980b9',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  
  greetingContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
    marginBottom: 2,
  },
  welcomeTextDark: {
    color: '#aaa',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  userNameDark: {
    color: '#fff',
  },
  
  // Settings icon styles
  settingsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsIconContainerDark: {
    backgroundColor: '#c0392b',
  },

  // Fallback title styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  titleDark: {
    color: '#ecf0f1',
  },
  gridContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  // Bottom Navigation Styles
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  bottomNavContainerDark: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
  },
  
  bottomNav: {
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  bottomNavDark: {
    backgroundColor: '#2a2a2a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  navTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  
  activeNavTab: {
    backgroundColor: '#ff4757',
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activeNavTabDark: {
    backgroundColor: '#ff6b7a',
  },
  
  navIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  activeNavIconContainer: {
    // Additional styling for active icon if needed
  },
  
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  navTextDark: {
    color: '#888',
  },
  
  activeNavText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default Dashboard;