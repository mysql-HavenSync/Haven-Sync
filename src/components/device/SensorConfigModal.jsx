import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';


const SensorConfigModal = ({
  visible,
  onClose,
  item,
  darkMode,
  onSaveSensorConfig,
  Icon,
  styles,
}) => {
  const [config, setConfig] = useState({
    enabled: false,
    timeoutMinutes: 5,
    timeoutSeconds: 0,
    speed: 50,
  });

  useEffect(() => {
    if (visible && item) {
      const existing = item.sensorConfig || {};
      setConfig({
        enabled: existing.enabled || false,
        timeoutMinutes: existing.timeoutMinutes || 5,
        timeoutSeconds: existing.timeoutSeconds || 0,
        speed: existing.speed || 50,
      });
    }
  }, [visible, item]);

  const updateConfig = (updates) =>
    setConfig((prev) => ({ ...prev, ...updates }));

  const formatTimeout = () => {
    const { timeoutMinutes: m, timeoutSeconds: s } = config;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m} minute${m > 1 ? 's' : ''}`;
    return `${s} second${s > 1 ? 's' : ''}`;
  };

  const handleSave = () => {
    if (config.timeoutMinutes === 0 && config.timeoutSeconds === 0) {
      Alert.alert('Invalid Timeout', 'Please set a timeout greater than 0');
      return;
    }
    onSaveSensorConfig(item, config);
    onClose();
  };

  const timeoutPresets = [
    { label: '30s', minutes: 0, seconds: 30 },
    { label: '1m', minutes: 1, seconds: 0 },
    { label: '5m', minutes: 5, seconds: 0 },
    { label: '10m', minutes: 10, seconds: 0 },
    { label: '30m', minutes: 30, seconds: 0 },
  ];

  const SpeedButton = ({ speed, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.speedButton,
        darkMode && styles.speedButtonDark,
        isSelected && styles.speedButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.speedButtonText,
          darkMode && styles.textWhite,
          isSelected && styles.speedButtonTextSelected,
        ]}
      >
        {speed}%
      </Text>
    </TouchableOpacity>
  );

  const PresetButton = ({ preset, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.presetButton,
        darkMode && styles.presetButtonDark,
        isSelected && styles.presetButtonSelected,
      ]}
    >
      <Text
        style={[
          styles.presetButtonText,
          darkMode && styles.textWhite,
          isSelected && styles.presetButtonTextSelected,
        ]}
      >
        {preset.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, darkMode && styles.modalContainerDark]}>
        {/* Header */}
        <View style={[styles.modalHeader, darkMode && styles.modalHeaderDark]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, darkMode && styles.iconContainerDark]}>
                <Icon name="motion" size={20} color={darkMode ? '#60A5FA' : '#3B82F6'} />
              </View>
              <View>
                <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                  Motion Sensor
                </Text>
                <Text style={[styles.deviceName, darkMode && styles.textLight]}>
                  {item?.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={darkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <ScrollView style={styles.modalContent}>
          {/* Enable Toggle */}
          <View style={[styles.mainToggleCard, darkMode && styles.mainToggleCardDark]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleLeft}>
                <Icon name="timer" size={20} color={darkMode ? '#60A5FA' : '#3B82F6'} />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, darkMode && styles.textWhite]}>
                    Motion Detection Timer
                  </Text>
                  <Text style={[styles.toggleSubtitle, darkMode && styles.textLight]}>
                    Auto-control when no motion detected
                  </Text>
                </View>
              </View>
              <Switch
                value={config.enabled}
                onValueChange={(enabled) => updateConfig({ enabled })}
                trackColor={{ false: darkMode ? '#374151' : '#E5E7EB', true: '#3B82F6' }}
                thumbColor={config.enabled ? '#FFFFFF' : (darkMode ? '#9CA3AF' : '#F3F4F6')}
              />
            </View>
          </View>

          {/* Timeout sliders */}
          {config.enabled && (
            <>
              <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
                <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
                  Time Settings
                </Text>

                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>
                  Minutes: {config.timeoutMinutes}
                </Text>
                <Slider
                  minimumValue={0}
                  maximumValue={60}
                  step={1}
                  value={config.timeoutMinutes}
                  onValueChange={(val) => updateConfig({ timeoutMinutes: val })}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />

                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>
                  Seconds: {config.timeoutSeconds}
                </Text>
                <Slider
                  minimumValue={0}
                  maximumValue={59}
                  step={5}
                  value={config.timeoutSeconds}
                  onValueChange={(val) => updateConfig({ timeoutSeconds: val })}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />

                {/* Presets */}
                <Text style={[styles.presetsLabel, darkMode && styles.textWhite]}>
                  Quick Presets
                </Text>
                <View style={styles.presetsContainer}>
                  {timeoutPresets.map((preset) => (
                    <PresetButton
                      key={preset.label}
                      preset={preset}
                      isSelected={
                        config.timeoutMinutes === preset.minutes &&
                        config.timeoutSeconds === preset.seconds
                      }
                      onPress={() =>
                        updateConfig({
                          timeoutMinutes: preset.minutes,
                          timeoutSeconds: preset.seconds,
                        })
                      }
                    />
                  ))}
                </View>
              </View>

              {/* Speed Control */}
              {item?.hasSpeedControl && (
                <View style={[styles.speedSection, darkMode && styles.speedSectionDark]}>
                  <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
                    Turn On Speed
                  </Text>
                  <Slider
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={config.speed}
                    onValueChange={(val) => updateConfig({ speed: val })}
                    minimumTrackTintColor="#10B981"
                    maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                  />
                  <View style={styles.speedButtonsContainer}>
                    {[0, 25, 50, 75, 100].map((speed) => (
                      <SpeedButton
                        key={speed}
                        speed={speed}
                        isSelected={config.speed === speed}
                        onPress={() => updateConfig({ speed })}
                      />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.modalFooter, darkMode && styles.modalFooterDark]}>
          <TouchableOpacity
            style={[styles.modalBtn, styles.cancelBtn, darkMode && styles.cancelBtnDark]}
            onPress={onClose}
          >
            <Text style={styles.modalBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, styles.saveBtn]}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>Save Config</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SensorConfigModal;
