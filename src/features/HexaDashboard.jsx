// src/features/HexaDashboard.jsx - Complete dashboard with device connection
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { useDeviceConnection } from '../hooks/useDeviceConnection';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWifi, faWifiSlash, faPlug, faRefresh, faHome, faLightbulb, faFan, faThermometerHalf } from '@fortawesome/free-solid-svg-icons';

const DeviceCard = ({ device, onToggleSwitch, onUpdateRegulator }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'connecting': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getSignalStrength = (strength) => {
    if (strength > -50) return 'excellent';
    if (strength > -60) return 'good';
    if (strength > -70) return 'fair';
    return 'poor';
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light': return faLightbulb;
      case 'fan': return faFan;
      case 'thermostat': return faThermometerHalf;
      case 'home': return faHome;
      default: return faPlug;
    }
  };

  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <FontAwesomeIcon 
            icon={getDeviceIcon(device.type)} 
            size={24} 
            color="#72BCD9" 
          />
          <Text style={styles.deviceName}>{device.name}</Text>
        </View>
        <View style={styles.deviceStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(device.status) }]}>
            {device.status || 'unknown'}
          </Text>
        </View>
      </View>

      {device.signalStrength && (
        <View style={styles.signalInfo}>
          <FontAwesomeIcon 
            icon={device.isConnected ? faWifi : faWifiSlash} 
            size={12} 
            color="#aaa" 
          />
          <Text style={styles.signalText}>
            {device.signalStrength}dBm ({getSignalStrength(device.signalStrength)})
          </Text>
        </View>
      )}

      {/* Switches */}
      {device.switches && device.switches.length > 0 && (
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Switches</Text>
          <View style={styles.switchGrid}>
            {device.switches.map((isOn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.switchButton,
                  { backgroundColor: isOn ? '#10B981' : '#374151' }
                ]}
                onPress={() => onToggleSwitch(device.id, index, !isOn)}
                disabled={device.status !== 'online'}
              >
                <Text style={styles.switchText}>
                  {device.switchLabels?.[index] || `Switch ${index + 1}`}
                </Text>
                <Text style={styles.switchStatus}>{isOn ? 'ON' : 'OFF'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Regulators */}
      {device.regulators && device.regulators.length > 0 && (
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Regulators</Text>
          {device.regulators.map((value, index) => (
            <View key={index} style={styles.regulatorControl}>
              <Text style={styles.regulatorLabel}>
                {device.regulatorLabels?.[index] || `Regulator ${index + 1}`}
              </Text>
              <View style={styles.regulatorSlider}>
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderFill, 
                      { width: `${value}%` }
                    ]} 
                  />
                  <View style={[
                    styles.sliderThumb,
                    { left: `${value}%` }
                  ]} />
                </View>
                <Text style={styles.regulatorValue}>{value}%</Text>
              </View>
              <View style={styles.regulatorButtons}>
                <TouchableOpacity
                  style={styles.regulatorButton}
                  onPress={() => onUpdateRegulator(device.id, index, Math.max(0, value - 10))}
                  disabled={device.status !== 'online'}
                >
                  <Text style={styles.regulatorButtonText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.regulatorButton}
                  onPress={() => onUpdateRegulator(device.id, index, Math.min(100, value + 10))}
                  disabled={device.status !== 'online'}
                >
                  <Text style={styles.regulatorButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {device.lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(device.lastUpdated).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const HexaDashboard = () => {
  const { devices, wsConnected, controlDeviceSwitch, controlDeviceRegulator, refreshAllDevices } = useDeviceConnection();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAllDevices();
    setRefreshing(false);
  };

  const handleToggleSwitch = async (deviceId, switchIndex, newState) => {
    try {
      await controlDeviceSwitch(deviceId, switchIndex, newState);
    } catch (error) {
      console.error('Switch toggle error:', error);
    }
  };

  const handleUpdateRegulator = async (deviceId, regulatorIndex, newValue) => {
    try {
      await controlDeviceRegulator(deviceId, regulatorIndex, newValue);
    } catch (error) {
      console.error('Regulator update error:', error);
    }
  };

  const getConnectionStatusIcon = () => {
    if (wsConnected) {
      return <FontAwesomeIcon icon={faWifi} size={16} color="#10B981" />;
    }
    return <FontAwesomeIcon icon={faWifiSlash} size={16} color="#EF4444" />;
  };

  const getConnectionStatusText = () => {
    if (wsConnected) {
      return `Connected (${devices.filter(d => d.status === 'online').length}/${devices.length} devices online)`;
    }
    return 'Disconnected';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Dashboard</Text>
        <View style={styles.connectionStatus}>
          {getConnectionStatusIcon()}
          <Text style={[styles.connectionText, { color: wsConnected ? '#10B981' : '#EF4444' }]}>
            {getConnectionStatusText()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.deviceGrid}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#72BCD9']}
            tintColor={'#72BCD9'}
          />
        }
      >
        {devices.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon={faPlug} size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Devices Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Pull down to refresh or add a new device
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <FontAwesomeIcon icon={faRefresh} size={16} color="#fff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Device Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{devices.length}</Text>
                <Text style={styles.statLabel}>Total Devices</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {devices.filter(d => d.status === 'online').length}
                </Text>
                <Text style={styles.statLabel}>Online</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                  {devices.filter(d => d.status === 'offline').length}
                </Text>
                <Text style={styles.statLabel}>Offline</Text>
              </View>
            </View>

            {/* Device Cards */}
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onToggleSwitch={handleToggleSwitch}
                onUpdateRegulator={handleUpdateRegulator}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceGrid: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  signalText: {
    fontSize: 12,
    color: '#666',
  },
  controlSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  switchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  switchButton: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchStatus: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  regulatorControl: {
    marginBottom: 16,
  },
  regulatorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  regulatorSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#72BCD9',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#72BCD9',
    borderRadius: 9,
    marginLeft: -9,
  },
  regulatorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  regulatorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  regulatorButton: {
    width: 32,
    height: 32,
    backgroundColor: '#72BCD9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  regulatorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#72BCD9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HexaDashboard;