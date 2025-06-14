import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  TextInput, Animated
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { updateDevice, toggleSwitch, toggleSensor } from '../redux/slices/switchSlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const DEVICE_CONFIGS = {
  'hexa3chn': { channelCount: 3, speedControlIndices: [2] },
  'hexa5chn': { channelCount: 5, speedControlIndices: [3, 4] }
};

const getDeviceConfig = (deviceId) => {
  const cleanId = deviceId?.toLowerCase()?.trim() || '';
  return DEVICE_CONFIGS[cleanId.startsWith('hexa5chn') ? 'hexa5chn' : 'hexa3chn'] || DEVICE_CONFIGS['hexa3chn'];
};

const EditableText = ({ item, isEditing, editingName, onSave, onCancel, onChange, darkMode, isOn }) => {
  const inputRef = useRef(null);
  const animation = useRef(new Animated.Value(isEditing ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isEditing ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      if (isEditing) inputRef.current?.focus();
    });
  }, [isEditing]);

  return (
    <View>
      {!isEditing && (
        <Text style={[styles.switchName, (isOn || darkMode) && styles.textWhite]} numberOfLines={1}>
          {item.name}
        </Text>
      )}
      
      <Animated.View 
        style={[styles.editContainer, { height: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 45] }) }]} 
        pointerEvents={isEditing ? 'auto' : 'none'}
      >
        <View style={styles.editRow}>
          <TextInput
            ref={inputRef}
            style={[styles.nameInput, darkMode && styles.inputDark, isOn && styles.inputActive]}
            value={editingName}
            onChangeText={onChange}
            placeholder="Enter name"
            placeholderTextColor={isOn ? 'rgba(255,255,255,0.6)' : darkMode ? '#999' : '#666'}
            onSubmitEditing={onSave}
            onBlur={onCancel}
            maxLength={25}
          />
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4a90e2' }]} onPress={onSave}>
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ff6b35' }]} onPress={onCancel}>
            <MaterialCommunityIcons name="close" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default function HexaDevices({ navigation }) {
  const devices = useSelector((state) => state.switches.activeDevices);
  const darkMode = useSelector((state) => state.profile.darkMode);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState({});
  const [names, setNames] = useState({});

  const getSwitches = (device) => {
    const switches = typeof device.switches === 'function' ? device.switches() : device.switches;
    return Array.isArray(switches) ? switches : [];
  };

  const hasSpeedControl = (device, switchIndex) => {
    return getDeviceConfig(device.deviceId)?.speedControlIndices?.includes(switchIndex) || false;
  };

  const getDisplayItems = () => {
    const items = [];
    if (!devices || !Array.isArray(devices)) return items;
    
    devices.forEach(device => {
      const switches = getSwitches(device);
      switches.forEach((switchItem, idx) => {
        const config = getDeviceConfig(device.deviceId);
        items.push({
          id: `${device.id}-switch-${idx}`,
          name: switchItem.name || `${device.name} Switch ${idx + 1}`,
          deviceId: device.id,
          deviceName: device.name,
          switchIndex: idx,
          switchData: switchItem,
          isConnected: device.isConnected,
          hasSpeedControl: hasSpeedControl(device, idx),
          regulatorIndex: config?.speedControlIndices?.indexOf(idx) || -1,
          device: device
        });
      });
    });
    
    return items;
  };

  const getSwitchIcon = (item) => {
    const name = item.name.toLowerCase();
    if (item.hasSpeedControl) return 'fan';
    if (name.includes('light')) return 'lightbulb-on';
    if (name.includes('speaker')) return 'speaker';
    if (name.includes('tv')) return 'television';
    if (name.includes('fan')) return 'fan';
    return 'power-plug';
  };

  const getSwitchStatus = (item) => {
    if (typeof item.switchData === 'object') return item.switchData.status;
    return typeof item.switchData === 'boolean' ? item.switchData : false;
  };

  const getCurrentSpeed = (item) => {
    if (!item.hasSpeedControl || item.regulatorIndex < 0) return 0;
    return item.device.regulators?.[item.regulatorIndex] || 0;
  };

  const toggleSwitchPower = (item) => {
    if (editing[item.id]) return;
    
    if (typeof item.switchData === 'object') {
      dispatch(toggleSwitch({ deviceId: item.deviceId, switchId: item.switchData.id, switchIndex: item.switchIndex }));
    } else {
      const device = devices.find(d => d.id === item.deviceId);
      const switches = getSwitches(device);
      dispatch(updateDevice({
        id: item.deviceId,
        switches: switches.map((s, i) => (i === item.switchIndex ? !s : s)),
      }));
    }
  };

  const handleSpeedChange = (item, speed) => {
    if (!item.hasSpeedControl || item.regulatorIndex < 0) return;
    const newRegulators = [...(item.device.regulators || [])];
    while (newRegulators.length <= item.regulatorIndex) newRegulators.push(0);
    newRegulators[item.regulatorIndex] = Math.round(speed);
    dispatch(updateDevice({ id: item.deviceId, regulators: newRegulators }));
  };

  const startEditing = (item) => {
    setEditing(prev => ({ ...prev, [item.id]: true }));
    setNames(prev => ({ ...prev, [item.id]: item.name }));
  };

  const saveEdit = (item) => {
    const newName = names[item.id]?.trim();
    if (newName) {
      const device = devices.find(d => d.id === item.deviceId);
      const switches = getSwitches(device);
      const updatedSwitches = switches.map((s, i) => 
        i === item.switchIndex ? { ...s, name: newName } : s
      );
      dispatch(updateDevice({ id: item.deviceId, switches: updatedSwitches }));
    }
    setEditing(prev => ({ ...prev, [item.id]: false }));
    setNames(prev => ({ ...prev, [item.id]: '' }));
  };

  const cancelEdit = (item) => {
    setEditing(prev => ({ ...prev, [item.id]: false }));
    setNames(prev => ({ ...prev, [item.id]: '' }));
  };

  const displayItems = getDisplayItems();

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.darkBg]}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <Text style={[styles.title, darkMode && styles.textWhite]}>My Switches</Text>

      {displayItems.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="toggle-switch-off-outline" size={64} color={darkMode ? '#666' : '#ccc'} />
          <Text style={[styles.noSwitches, darkMode && styles.textWhite]}>No switches available</Text>
          <Text style={[styles.noSwitchesSubtext, darkMode && styles.textWhite]}>Add devices to get started</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {displayItems.map((item) => {
            const isOn = getSwitchStatus(item);
            const currentSpeed = getCurrentSpeed(item);
            const isEditing = editing[item.id];

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  item.hasSpeedControl ? styles.wideCard : styles.standardCard,
                  isOn && styles.cardActive,
                  darkMode && !isOn && styles.cardDark,
                ]}
                onPress={() => toggleSwitchPower(item)}
                disabled={isEditing}
              >
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, isOn && styles.iconActive, darkMode && !isOn && styles.iconDark]}>
                    <MaterialCommunityIcons
                      name={getSwitchIcon(item)}
                      size={24}
                      color={isOn ? '#fff' : darkMode ? '#fff' : '#333'}
                    />
                  </View>
                  
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.editButton, isEditing && { backgroundColor: '#4a90e2' }]} onPress={() => startEditing(item)}>
                      <MaterialCommunityIcons name="pencil" size={12} color={isEditing ? '#fff' : darkMode ? '#ccc' : '#666'} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.sensorButton, item.sensorData?.status && { backgroundColor: '#ff6b35' }]}
                      onPress={() => dispatch(toggleSensor({ deviceId: item.deviceId, switchIndex: item.switchIndex }))}
                    >
                      <MaterialCommunityIcons name="power" size={12} color={item.sensorData?.status ? '#fff' : darkMode ? '#ccc' : '#666'} />
                    </TouchableOpacity>
                    
                    <View style={[styles.statusDot, { backgroundColor: item.isConnected ? '#4caf50' : '#f44336' }]} />
                  </View>
                </View>

                {/* Speed Control */}
                {item.hasSpeedControl && isOn && (
                  <View style={styles.speedSection}>
                    <View style={styles.speedHeader}>
                      <MaterialCommunityIcons name="speedometer" size={16} color="#fff" />
                      <Text style={styles.speedLabel}>Speed: {currentSpeed}%</Text>
                    </View>
                    
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      step={25}
                      value={currentSpeed}
                      onValueChange={(value) => handleSpeedChange(item, value)}
                      minimumTrackTintColor="#fff"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                    />
                    
                    <View style={styles.speedButtons}>
                      {[0, 25, 50, 75, 100].map((speed) => (
                        <TouchableOpacity
                          key={speed}
                          style={[styles.speedBtn, currentSpeed === speed && { backgroundColor: '#4a90e2' }]}
                          onPress={() => handleSpeedChange(item, speed)}
                        >
                          <Text style={[styles.speedBtnText, currentSpeed === speed && { color: '#fff' }]}>
                            {speed}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Switch Info */}
                <View style={styles.switchInfo}>
                  <EditableText
                    item={item}
                    isEditing={isEditing}
                    editingName={names[item.id] || ''}
                    onSave={() => saveEdit(item)}
                    onCancel={() => cancelEdit(item)}
                    onChange={(text) => setNames(prev => ({ ...prev, [item.id]: text }))}
                    darkMode={darkMode}
                    isOn={isOn}
                  />
                  
                  <Text style={[styles.deviceName, (isOn || darkMode) && styles.textWhite]}>
                    {item.deviceName} • {item.isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.powerButton, isOn && styles.powerButtonActive]}
                    onPress={() => toggleSwitchPower(item)}
                  >
                    <MaterialCommunityIcons name={isOn ? "power" : "power-off"} size={16} color={isOn ? '#fff' : '#333'} />
                    <Text style={[styles.buttonText, isOn && { color: '#fff' }]}>{isOn ? 'ON' : 'OFF'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deviceButton]}
                    onPress={() => navigation.navigate('DevicePage', { device: item.device, deviceId: item.deviceId, deviceName: item.deviceName })}
                  >
                    <MaterialCommunityIcons name="view-dashboard" size={16} color="#4a90e2" />
                    <Text style={[styles.buttonText, { color: '#4a90e2' }]}>Device</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingHorizontal: 16 },
  darkBg: { backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: '700', marginVertical: 20, color: '#333' },
  textWhite: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, justifyContent: 'space-between', minHeight: 200
  },
  standardCard: { width: '48%' },
  wideCard: { width: '100%' },
  cardActive: { backgroundColor: '#4a90e2' },
  cardDark: { backgroundColor: '#1e1e1e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  iconActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  iconDark: { backgroundColor: '#2a2a2a' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { width: 26, height: 26, borderRadius: 10, backgroundColor: '#e8e8e8', justifyContent: 'center', alignItems: 'center' },
  sensorButton: { width: 30, height: 30, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  speedSection: { marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  speedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  speedLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 8 },
  slider: { width: '100%', height: 30, marginBottom: 12 },
  speedButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  speedBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.1)', minWidth: 40, alignItems: 'center' },
  speedBtnText: { fontSize: 11, color: '#666', fontWeight: '600' },
  switchInfo: { marginBottom: 12 },
  switchName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  deviceName: { fontSize: 14, color: '#666', fontWeight: '500', marginBottom: 2 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, gap: 8 },
  powerButton: { backgroundColor: '#f0f0f0' },
  powerButtonActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  deviceButton: { backgroundColor: 'rgba(74, 144, 226, 0.1)', borderWidth: 1, borderColor: '#4a90e2' },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#333' },
  editContainer: { overflow: 'hidden' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1, height: 36, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  inputDark: { borderColor: '#444', backgroundColor: '#2a2a2a', color: '#fff' },
  inputActive: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' },
  actionBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  noSwitches: { textAlign: 'center', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8, color: '#666' },
  noSwitchesSubtext: { textAlign: 'center', fontSize: 14, color: '#999' },
});