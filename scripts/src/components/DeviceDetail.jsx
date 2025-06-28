import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceGrid from '../components/DeviceGrid'; // Import your existing DeviceGrid component

export default function DevicePage({ route, navigation }) {
  const { device, deviceId, deviceName } = route.params;
  const darkMode = useSelector(state => state.profile.darkMode);
  const devices = useSelector(state => state.switches.activeDevices);

  // Find the current device from the store (in case it was updated)
  const currentDevice = devices.find(d => d.id === deviceId) || device;

  // Create a filtered devices array with only this device
  const filteredDevices = [currentDevice];

  // Create a selectedNavItem object to match the DeviceGrid expectations
  const selectedNavItem = {
    type: 'device',
    name: deviceName || currentDevice.name,
    id: deviceId,
  };

  const getDeviceType = (device) => {
    const deviceId = device.deviceId?.toLowerCase() || device.id?.toLowerCase() || '';
    
    if (deviceId.includes('hexa5chn')) {
      return '5-Channel Device';
    } else if (deviceId.includes('hexa3chn')) {
      return '3-Channel Device';
    }
    
    return 'Smart Device';
  };

  const getSwitchCount = (device) => {
    const switches = Array.isArray(device.switches) ? device.switches : [];
    return switches.length;
  };

  const getActiveSwitches = (device) => {
    const switches = Array.isArray(device.switches) ? device.switches : [];
    return switches.filter(s => {
      if (typeof s === 'object') return s.status;
      return s;
    }).length;
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={darkMode ? '#fff' : '#333'}
          />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]} numberOfLines={1}>
            {currentDevice.name}
          </Text>
          <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>
            {getDeviceType(currentDevice)}
          </Text>
        </View>

        <TouchableOpacity style={styles.menuButton}>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={darkMode ? '#fff' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {/* Device Info Card */}
      <View style={[styles.deviceInfoCard, darkMode && styles.deviceInfoCardDark]}>
        <View style={styles.deviceInfoRow}>
          <View style={styles.deviceInfoItem}>
            <MaterialCommunityIcons
              name="identifier"
              size={20}
              color={darkMode ? '#ccc' : '#666'}
            />
            <Text style={[styles.deviceInfoLabel, darkMode && styles.deviceInfoLabelDark]}>
              Device ID
            </Text>
            <Text style={[styles.deviceInfoValue, darkMode && styles.deviceInfoValueDark]} numberOfLines={1}>
              {currentDevice.deviceId || currentDevice.id}
            </Text>
          </View>

          <View style={styles.deviceInfoItem}>
            <MaterialCommunityIcons
              name="toggle-switch-outline"
              size={20}
              color={darkMode ? '#ccc' : '#666'}
            />
            <Text style={[styles.deviceInfoLabel, darkMode && styles.deviceInfoLabelDark]}>
              Switches
            </Text>
            <Text style={[styles.deviceInfoValue, darkMode && styles.deviceInfoValueDark]}>
              {getActiveSwitches(currentDevice)}/{getSwitchCount(currentDevice)} Active
            </Text>
          </View>

          <View style={styles.deviceInfoItem}>
            <MaterialCommunityIcons
              name={currentDevice.isConnected ? "wifi" : "wifi-off"}
              size={20}
              color={currentDevice.isConnected ? '#4caf50' : '#f44336'}
            />
            <Text style={[styles.deviceInfoLabel, darkMode && styles.deviceInfoLabelDark]}>
              Status
            </Text>
            <Text style={[
              styles.deviceInfoValue,
              darkMode && styles.deviceInfoValueDark,
              currentDevice.isConnected ? styles.statusConnected : styles.statusDisconnected
            ]}>
              {currentDevice.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      {/* Device Switches */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DeviceGrid
          filteredDevices={filteredDevices}
          selectedNavItem={selectedNavItem}
          navigation={navigation}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerTitleDark: {
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerSubtitleDark: {
    color: '#ccc',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  deviceInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  deviceInfoCardDark: {
    backgroundColor: '#1e1e1e',
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceInfoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  deviceInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  deviceInfoLabelDark: {
    color: '#ccc',
  },
  deviceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  deviceInfoValueDark: {
    color: '#fff',
  },
  statusConnected: {
    color: '#4caf50',
  },
  statusDisconnected: {
    color: '#f44336',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
});