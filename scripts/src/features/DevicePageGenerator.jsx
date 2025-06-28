import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Slider } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateDevice, toggleSwitch, toggleSensor } from '../redux/slices/switchSlice';

const DEVICE_CONFIGS = {
  'hexa3chn': { channelCount: 3, speedControlIndices: [2] },
  'hexa5chn': { channelCount: 5, speedControlIndices: [3, 4] }
};

const getDeviceConfig = (deviceId) => {
  const cleanId = deviceId?.toLowerCase()?.trim() || '';
  return DEVICE_CONFIGS[cleanId.startsWith('hexa5chn') ? 'hexa5chn' : 'hexa3chn'];
};

const IconWithFallback = ({ name, size, color, fallbackText, style }) => {
  const emojiMap = {
    'lightbulb': '💡', 'speaker': '🔊', 'television': '📺', 'air-conditioner': '❄️',
    'fan': '🌀', 'camera': '📷', 'door-closed': '🚪', 'thermostat': '🌡️',
    'light-switch': '🔌', 'power-socket-us': '🔌', 'motion-sensor': '👁️',
    'power': '⚡', 'speedometer': '🏎️'
  };

  return (
    <Text style={[{ fontSize: size * 0.8, color, textAlign: 'center', lineHeight: size }, style]}>
      {emojiMap[name] || fallbackText || '🔌'}
    </Text>
  );
};

export default function DeviceGrid({ filteredDevices, selectedNavItem }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const dispatch = useDispatch();

  const getSwitches = (device) => {
    const switches = typeof device.switches === 'function' ? device.switches() : device.switches;
    return Array.isArray(switches) ? switches : [];
  };

  const hasSpeedControl = (device, switchIndex) => 
    getDeviceConfig(device.deviceId)?.speedControlIndices?.includes(switchIndex) || false;

  const getRegulatorIndex = (device, switchIndex) => {
    const indices = getDeviceConfig(device.deviceId)?.speedControlIndices || [];
    return indices.indexOf(switchIndex);
  };

  const getDisplayItems = () => {
    const items = [];
    filteredDevices.forEach(device => {
      const switches = getSwitches(device);
      if (switches.length > 0) {
        switches.forEach((switchItem, switchIndex) => {
          items.push({
            id: `${device.id}-switch-${switchIndex}`,
            name: switchItem.name || `${device.name} Switch ${switchIndex + 1}`,
            deviceId: device.id,
            deviceName: device.name,
            switchIndex,
            switchData: switchItem,
            isConnected: device.isConnected,
            icon: switchItem.icon || device.icon,
            type: 'switch',
            sensorData: switchItem.sensor || { status: false, type: 'power' },
            hasSpeedControl: hasSpeedControl(device, switchIndex),
            regulatorIndex: getRegulatorIndex(device, switchIndex),
            device
          });
        });
      } else {
        items.push({
          ...device,
          type: 'device',
          sensorData: device.sensor || { status: false, type: 'power' },
          hasSpeedControl: false,
          device
        });
      }
    });
    return items;
  };

  const toggleSwitchPower = (item) => {
    if (item.type === 'switch') {
      if (typeof item.switchData === 'object' && item.switchData.hasOwnProperty('status')) {
        dispatch(toggleSwitch({ deviceId: item.deviceId, switchId: item.switchData.id, switchIndex: item.switchIndex }));
      } else {
        const device = filteredDevices.find(d => d.id === item.deviceId);
        const switches = getSwitches(device);
        dispatch(updateDevice({
          id: item.deviceId,
          switches: switches.map((s, i) => (i === item.switchIndex ? !s : s)),
        }));
        
        if (item.hasSpeedControl && switches[item.switchIndex] && item.regulatorIndex >= 0) {
          const newRegulators = [...(device.regulators || [])];
          newRegulators[item.regulatorIndex] = 0;
          dispatch(updateDevice({ id: item.deviceId, regulators: newRegulators }));
        }
      }
    } else {
      const switches = getSwitches(item);
      if (switches.length > 0) {
        typeof switches[0] === 'object' && switches[0].hasOwnProperty('status')
          ? dispatch(toggleSwitch({ deviceId: item.id, switchId: switches[0].id, switchIndex: 0 }))
          : dispatch(updateDevice({ id: item.id, switches: switches.map((s, i) => (i === 0 ? !s : s)) }));
      }
    }
  };

  const handleSpeedChange = (item, speed) => {
    if (!item.hasSpeedControl || item.regulatorIndex < 0) return;
    const newRegulators = [...(item.device.regulators || [])];
    while (newRegulators.length <= item.regulatorIndex) newRegulators.push(0);
    newRegulators[item.regulatorIndex] = Math.round(speed);
    dispatch(updateDevice({ id: item.deviceId, regulators: newRegulators }));
  };

  const toggleSensorPower = (item) => {
    requestAnimationFrame(() => {
      dispatch(toggleSensor({
        deviceId: item.deviceId || item.id,
        switchId: item.switchData?.id,
        switchIndex: item.switchIndex || 0,
        sensorType: item.sensorData?.type || 'power'
      }));
    });
  };

  const getItemIcon = (item) => {
    const name = (item.name || '').toLowerCase();
    const deviceName = (item.deviceName || item.name || '').toLowerCase();

    if (item.hasSpeedControl) return { icon: 'fan', fallback: '🌀' };
    
    const iconMap = {
      lamp: { icon: 'lightbulb', fallback: '💡' }, light: { icon: 'lightbulb', fallback: '💡' },
      speaker: { icon: 'speaker', fallback: '🔊' }, audio: { icon: 'speaker', fallback: '🔊' },
      tv: { icon: 'television', fallback: '📺' }, television: { icon: 'television', fallback: '📺' },
      air: { icon: 'air-conditioner', fallback: '❄️' }, ac: { icon: 'air-conditioner', fallback: '❄️' },
      fan: { icon: 'fan', fallback: '🌀' }, camera: { icon: 'camera', fallback: '📷' },
      door: { icon: 'door-closed', fallback: '🚪' }, lock: { icon: 'door-closed', fallback: '🚪' },
      thermostat: { icon: 'thermostat', fallback: '🌡️' }, temperature: { icon: 'thermostat', fallback: '🌡️' },
      switch: { icon: 'light-switch', fallback: '🔌' }
    };

    for (const [key, value] of Object.entries(iconMap)) {
      if (name.includes(key) || deviceName.includes(key)) return value;
    }
    return { icon: 'power-socket-us', fallback: '🔌' };
  };

  const getSwitchStatus = (item) => {
    if (item.type === 'switch') {
      return typeof item.switchData === 'object' ? item.switchData.status : item.switchData;
    }
    const switches = getSwitches(item);
    return switches.length > 0 ? (typeof switches[0] === 'object' ? switches[0].status : switches[0]) : false;
  };

  const getSensorStatus = (item) => item.sensorData?.status || false;
  const getCurrentSpeed = (item) => item.hasSpeedControl && item.regulatorIndex >= 0 ? (item.device.regulators || [])[item.regulatorIndex] || 0 : 0;

  const displayItems = getDisplayItems();

  return (
    <>
      {displayItems.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            {selectedNavItem.type === 'all' ? 'All Switches' : 
             selectedNavItem.type === 'group' ? `${selectedNavItem.name} Switches` :
             selectedNavItem.type === 'device' ? `${selectedNavItem.name} Switches` : 'Switches'}
          </Text>
          <View style={styles.deviceGrid}>
            {displayItems.map((item, index) => {
              const isOn = getSwitchStatus(item);
              const sensorActive = getSensorStatus(item);
              const itemIcon = getItemIcon(item);
              const currentSpeed = getCurrentSpeed(item);
              const isWide = (index + 1) % 3 === 0 || item.hasSpeedControl;

              return (
                <TouchableOpacity
                  key={item.id || `item-${index}`}
                  style={[
                    styles.deviceCard,
                    isWide ? styles.wideCard : styles.standardCard,
                    isOn && styles.deviceCardActive,
                    darkMode && !isOn && styles.deviceCardDark,
                    item.hasSpeedControl && styles.speedControlCard,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleSwitchPower(item)}
                >
                  <View style={styles.topSection}>
                    <View style={[styles.iconContainer, isOn && styles.iconContainerActive, darkMode && !isOn && styles.iconContainerDark]}>
                      <IconWithFallback name={itemIcon.icon} size={20} color={isOn ? '#ffffff' : darkMode ? '#ffffff' : '#666666'} fallbackText={itemIcon.fallback} />
                    </View>
                    <TouchableOpacity
                      style={[styles.powerButton, sensorActive && styles.powerButtonActive, darkMode && !sensorActive && styles.powerButtonDark]}
                      activeOpacity={0.6}
                      onPress={() => toggleSensorPower(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconWithFallback name="power" size={12} color={sensorActive ? '#ffffff' : darkMode ? '#cccccc' : '#666666'} fallbackText="⚡" />
                    </TouchableOpacity>
                  </View>

                  {item.hasSpeedControl && isOn && (
                    <View style={styles.speedControlSection}>
                      <View style={styles.speedHeader}>
                        <IconWithFallback name="speedometer" size={16} color={darkMode ? '#ffffff' : isOn ? '#ffffff' : '#666666'} fallbackText="🏎️" />
                        <Text style={[styles.speedLabel, isOn && styles.textWhite, darkMode && styles.textWhite]}>
                          Speed: {currentSpeed}%
                        </Text>
                      </View>
                      <Slider
                        style={styles.speedSlider}
                        minimumValue={0}
                        maximumValue={100}
                        step={25}
                        value={currentSpeed}
                        onValueChange={(value) => handleSpeedChange(item, value)}
                        minimumTrackTintColor={isOn ? '#ffffff' : '#4a90e2'}
                        maximumTrackTintColor={isOn ? 'rgba(255,255,255,0.3)' : '#cccccc'}
                        thumbStyle={[styles.sliderThumb, { backgroundColor: isOn ? '#ffffff' : '#4a90e2' }]}
                      />
                      <View style={styles.speedButtons}>
                        {[0, 25, 50, 75, 100].map((speedVal) => (
                          <TouchableOpacity
                            key={speedVal}
                            style={[
                              styles.speedButton,
                              currentSpeed === speedVal && styles.speedButtonActive,
                              isOn && currentSpeed === speedVal && styles.speedButtonActiveWhite,
                            ]}
                            onPress={() => handleSpeedChange(item, speedVal)}
                          >
                            <Text style={[
                              styles.speedButtonText,
                              currentSpeed === speedVal && styles.speedButtonTextActive,
                              isOn && currentSpeed === speedVal && styles.speedButtonTextWhite,
                              darkMode && styles.textWhite,
                            ]}>
                              {speedVal}%
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.bottomSection}>
                    <Text style={[styles.deviceName, isOn && styles.textWhite, darkMode && styles.textWhite]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.deviceStatus, isOn && styles.textWhiteSecondary, darkMode && styles.deviceStatusDark]}>
                      {item.isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                    <Text style={[styles.switchStatus, isOn && styles.textWhiteSecondary, darkMode && styles.textWhite]}>
                      {isOn ? 'On' : 'Off'}{item.hasSpeedControl && isOn ? ` • ${currentSpeed}%` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {displayItems.length === 0 && (
        <View style={styles.emptyState}>
          <IconWithFallback name="power-socket-us" size={64} color={darkMode ? '#666' : '#ccc'} fallbackText="🔌" />
          <Text style={[styles.emptyStateText, darkMode && styles.textWhite]}>No switches found</Text>
          <Text style={[styles.emptyStateSubtext, darkMode && styles.textWhite]}>
            {selectedNavItem.type === 'group' 
              ? `Add devices with switches to ${selectedNavItem.name} group`
              : selectedNavItem.type === 'device'
              ? 'This device has no switches configured'
              : 'Try selecting a device or group with switches'}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, marginTop: 6, color: '#333' },
  textWhite: { color: '#ffffff' },
  textWhiteSecondary: { color: 'rgba(255, 255, 255, 0.8)' },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  deviceCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, justifyContent: 'space-between', marginBottom: 8, minHeight: 120 },
  standardCard: { width: '48%' },
  wideCard: { width: '100%' },
  speedControlCard: { minHeight: 180 },
  deviceCardActive: { backgroundColor: '#4a90e2' },
  deviceCardDark: { backgroundColor: '#1e1e1e', elevation: 3 },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  iconContainerActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  iconContainerDark: { backgroundColor: '#2a2a2a' },
  powerButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  powerButtonActive: { backgroundColor: '#ff6b35' },
  powerButtonDark: { backgroundColor: '#3a3a3a' },
  speedControlSection: { marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  speedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  speedLabel: { fontSize: 12, fontWeight: '600', color: '#666666', marginLeft: 6 },
  speedSlider: { width: '100%', height: 20, marginBottom: 8 },
  sliderThumb: { width: 16, height: 16, borderRadius: 8 },
  speedButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  speedButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.1)', minWidth: 32, alignItems: 'center' },
  speedButtonActive: { backgroundColor: '#4a90e2' },
  speedButtonActiveWhite: { backgroundColor: 'rgba(255,255,255,0.3)' },
  speedButtonText: { fontSize: 10, color: '#666666', fontWeight: '600' },
  speedButtonTextActive: { color: '#ffffff' },
  speedButtonTextWhite: { color: '#ffffff' },
  bottomSection: { justifyContent: 'flex-end' },
  deviceName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 4, lineHeight: 20 },
  deviceStatus: { fontSize: 12, color: '#666666', fontWeight: '400', marginBottom: 2 },
  deviceStatusDark: { color: '#999999' },
  switchStatus: { fontSize: 12, color: '#666666', fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 }
});