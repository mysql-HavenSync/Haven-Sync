import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, Switch, Slider,
} from 'react-native';

const DeviceOverviewModal = ({
  visible,
  onClose,
  deviceId,
  darkMode,
  getDeviceConfig,
  getSwitchStatus,
  getCurrentSpeed,
  hasSpeedControl,
  reduxDevices,
  onSwitchToggle,
  onSpeedChange,
  onSensorToggle,
  onScheduleOpen,
  onSensorConfigOpen,
  Icon,
  styles,
}) => {
  const device = reduxDevices.find((d) => d.id === deviceId);
  const [masterSensorToggle, setMasterSensorToggle] = useState(device?.masterTimer?.enabled || false);

  useEffect(() => {
    if (device?.masterTimer) {
      setMasterSensorToggle(device.masterTimer.enabled);
    }
  }, [device]);

  const getSwitches = useCallback(() => {
    if (!device) return [];
    return Array.isArray(device.switches) ? device.switches : [];
  }, [device]);

  const getItemIcon = useCallback((switchItem, index) => {
    const name = (switchItem.name || '').toLowerCase();
    if (hasSpeedControl(device, index)) return 'fan';
    if (name.includes('light')) return 'lightbulb';
    if (name.includes('tv')) return 'television';
    if (name.includes('speaker')) return 'speaker';
    return 'power';
  }, [device, hasSpeedControl]);

  if (!device) return null;
  const switches = getSwitches();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.deviceOverviewModal, darkMode && styles.deviceOverviewModalDark]}>
        {/* Header */}
        <View style={[styles.deviceOverviewHeader, darkMode && styles.deviceOverviewHeaderDark]}>
          <View style={styles.deviceOverviewHeaderLeft}>
            <View style={[styles.deviceOverviewIcon, device.isConnected && styles.deviceOverviewIconActive]}>
              <Icon name="device" size={28} color={device.isConnected ? "#4a90e2" : "#ccc"} />
            </View>
            <View>
              <Text style={[styles.deviceOverviewTitle, darkMode && styles.textWhite]}>{device.name}</Text>
              <Text style={[styles.deviceOverviewSubtitle, darkMode && styles.textLight]}>
                {switches.length} switches • {device.isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.deviceOverviewCloseBtn}>
            <Icon name="close" size={22} color={darkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>

        {/* Sensor Toggle */}
        <View style={[styles.deviceOverviewSensorRow, darkMode && styles.deviceOverviewSensorRowDark]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="motion" size={20} color={darkMode ? '#60A5FA' : '#3B82F6'} />
            <Text style={[styles.deviceOverviewSensorLabel, darkMode && styles.textWhite]}>
              Motion Timeout Sensor
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Switch
              value={masterSensorToggle}
              onValueChange={(value) => setMasterSensorToggle(value)}
              trackColor={{ false: darkMode ? '#374151' : '#E5E7EB', true: '#3B82F6' }}
              thumbColor={masterSensorToggle ? '#FFFFFF' : (darkMode ? '#9CA3AF' : '#F3F4F6')}
            />
            <TouchableOpacity
              style={styles.deviceOverviewSensorSettingsBtn}
              onPress={() => onSensorConfigOpen(device)}
            >
              <Icon name="settings" size={18} color={darkMode ? '#60A5FA' : '#3B82F6'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Switches */}
        <ScrollView style={styles.deviceOverviewContent}>
          <View style={styles.deviceOverviewGrid}>
            {switches.map((sw, index) => {
              const isOn = getSwitchStatus(sw);
              const speed = getCurrentSpeed(device, index);
              const hasSpeed = hasSpeedControl(device, index);
              const iconName = getItemIcon(sw, index);
              const activeSchedules = sw.schedules?.filter(s => s.enabled)?.length || 0;

              return (
                <View key={index} style={[
                  styles.deviceOverviewCard,
                  isOn && styles.deviceOverviewCardActive,
                  darkMode && !isOn && styles.deviceOverviewCardDark
                ]}>
                  {/* Header */}
                  <View style={styles.deviceOverviewCardHeader}>
                    <View style={[styles.deviceOverviewSwitchIcon, isOn && styles.deviceOverviewSwitchIconActive]}>
                      <Icon name={iconName} size={24} color={isOn ? '#fff' : darkMode ? '#fff' : '#666'} />
                    </View>
                    <TouchableOpacity
                      style={[styles.deviceOverviewScheduleBtn, activeSchedules > 0 && styles.deviceOverviewScheduleBtnActive]}
                      onPress={() =>
                        onScheduleOpen({
                          id: `${device.id}-switch-${index}`,
                          name: sw.name || `Switch ${index + 1}`,
                          deviceId: device.id,
                          switchIndex: index,
                          hasSpeedControl: hasSpeed,
                          schedules: sw.schedules || [],
                        })
                      }
                    >
                      <Icon name="clock" size={14} color={activeSchedules > 0 ? '#fff' : darkMode ? '#ccc' : '#666'} />
                    </TouchableOpacity>
                  </View>

                  {/* Switch Tap Area */}
                  <TouchableOpacity
                    style={styles.deviceOverviewSwitchArea}
                    onPress={() => onSwitchToggle(device.id, sw.id, index)}
                  >
                    <Text style={[
                      styles.deviceOverviewSwitchName,
                      (isOn || darkMode) && styles.textWhite,
                    ]} numberOfLines={2}>
                      {sw.name || `Switch ${index + 1}`}
                    </Text>
                    <Text style={[
                      styles.deviceOverviewSwitchStatus,
                      (isOn || darkMode) && styles.textWhite,
                    ]}>
                      {isOn ? 'On' : 'Off'}{hasSpeed && isOn ? ` • ${speed}%` : ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Speed Control */}
                  {hasSpeed && isOn && (
                    <View style={styles.deviceOverviewSpeedSection}>
                      <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>Speed: {speed}%</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        value={speed}
                        onValueChange={(value) => onSpeedChange(device.id, index, value)}
                        minimumTrackTintColor="#3B82F6"
                        maximumTrackTintColor={darkMode ? '#555' : '#ddd'}
                      />
                    </View>
                  )}

                  {/* Footer */}
                  <View style={styles.deviceOverviewFooter}>
                    <Text style={[
                      styles.deviceOverviewSwitchInfo,
                      (isOn || darkMode) && styles.textWhite,
                    ]}>
                      Switch {index + 1}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.deviceOverviewPowerBtn,
                        device.sensors?.[index]?.status && styles.deviceOverviewPowerBtnActive
                      ]}
                      onPress={() => onSensorToggle(device.id, index)}
                    >
                      <Icon name="power" size={16} color={device.sensors?.[index]?.status ? '#fff' : darkMode ? '#ccc' : '#666'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default DeviceOverviewModal;
