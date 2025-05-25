import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faHome,
  faPlus,
  faBell,
  faUser,
  faBars,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import TopSection from '../components/TopSection';
import { updateDevice } from '../redux/slices/switchSlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function HexaDashboard() {
  const userName = useSelector(state => state.profile.name) || 'User';
  const darkMode = useSelector(state => state.profile.darkMode);
  const devices = useSelector(state => state.switches.activeDevices);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('home');

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  };

  const togglePower = (device) => {
    dispatch(
      updateDevice({
        id: device.id,
        switches: device.switches.map((s, i) => (i === 0 ? !s : s)),
      })
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.dark]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={openDrawer}>
          <FontAwesomeIcon icon={faBars} size={22} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.greeting, darkMode && styles.greetingDark]}>
          Hello, {userName}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('HexaEditProfile')}>
          <FontAwesomeIcon icon={faUser} size={22} color={darkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <TopSection />

        {/* Device Section (small tiles) */}
        {devices.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
              Active Devices
            </Text>
            <View style={styles.deviceGrid}>
              {devices.map(device => {
                const isOn = device.switches[0];
                return (
                  <TouchableOpacity
                    key={device.id}
                    style={[styles.card, isOn && styles.cardActive]}
                    activeOpacity={0.8}
                    onPress={() => togglePower(device)}
                  >
                    <MaterialCommunityIcons
                      name={device.icon || 'power-socket'}
                      size={30}
                      color={isOn ? '#fff' : '#333'}
                    />
                    <Text style={[styles.name, isOn && styles.textWhite]}>
                      {device.name}
                    </Text>
                    <Switch
                      value={isOn}
                      disabled
                      trackColor={{ false: '#999', true: '#fff' }}
                      thumbColor={isOn ? '#4caf50' : '#ccc'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modern 3D Bottom Navigation */}
      <View style={[styles.bottomNavContainer, darkMode && styles.bottomNavContainerDark]}>
        <View style={[styles.bottomNav, darkMode && styles.bottomNavDark]}>
          <TouchableOpacity
            style={[styles.navButton, activeTab === 'home' && styles.activeNavButton]}
            onPress={() => setActiveTab('home')}
          >
            <View style={styles.iconContainer}>
              <FontAwesomeIcon 
                icon={faHome} 
                size={22} 
                color={activeTab === 'home' ? '#4caf50' : darkMode ? '#aaa' : '#555'} 
              />
            </View>
            {activeTab === 'home' && (
              <Text style={styles.navLabel}>Home</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButtonContainer}
            onPress={() => navigation.navigate('HexaDeviceRadar')}
          >
            <View style={styles.addButtonShadow} />
            <View style={styles.addButton}>
              <FontAwesomeIcon icon={faPlus} size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, activeTab === 'notifications' && styles.activeNavButton]}
            onPress={() => setActiveTab('notifications')}
          >
            <View style={styles.iconContainer}>
              <FontAwesomeIcon 
                icon={faBell} 
                size={22} 
                color={activeTab === 'notifications' ? '#4caf50' : darkMode ? '#aaa' : '#555'} 
              />
            </View>
            {activeTab === 'notifications' && (
              <Text style={styles.navLabel}>Alerts</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4d3d2',
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
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  greetingDark: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 6,
    color: '#333',
  },
  textWhite: {
    color: '#fff',
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '60%',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: '#84c9e8',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  
  // Bottom navigation container with 3D effect
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingBottom: 10,
    alignItems: 'center',
  },
  bottomNavContainerDark: {
    backgroundColor: 'transparent',
  },
  bottomNav: {
    width: '90%',
    height: 65,
    backgroundColor: '#fff',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  bottomNavDark: {
    backgroundColor: '#222',
    borderColor: 'rgba(50, 50, 50, 0.8)',
  },
  navButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  activeNavButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    marginLeft: 6,
    color: '#4caf50',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Add button with 3D effect
  addButtonContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    marginBottom: 30,
  },
  addButtonShadow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    top: 5,
    left: 0,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  addButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
});