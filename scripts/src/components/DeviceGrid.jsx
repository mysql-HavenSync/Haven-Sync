import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Animated, Modal, ScrollView, Switch, Alert, SafeAreaView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { updateDevice, toggleSwitch, toggleSensor, updateSwitchName, toggleSecondaryStatus, updateSwitchSpeed } from '../redux/slices/switchSlice';


const DEVICE_CONFIGS = { 'hexa3chn': { channelCount: 3, speedControlIndices: [2] }, 'hexa5chn': { channelCount: 5, speedControlIndices: [3, 4] } };
const getDeviceConfig = (deviceId) => DEVICE_CONFIGS[deviceId?.toLowerCase()?.startsWith('hexa5chn') ? 'hexa5chn' : 'hexa3chn'] || DEVICE_CONFIGS['hexa3chn'];

const icons = { 'lightbulb': '💡', 'speaker': '🔊', 'television': '📺', 'air-conditioner': '❄', 'fan': '🌀', 'camera': '📷', 'door': '🚪', 'thermostat': '🌡', 'power': '⚡', 'speedometer': '🏎', 'pencil': '🖍️', 'check': '✔', 'close': '❌', 'clock': '⏰', 'repeat': '🔄', 'trash': '🗑', 'plus': '➕', 'device': '📱', 'list': '📋', 'motion': '👁', 'timer': '⏱', 'settings': '⚙️','slider': '🎚️', 'plug': '🔌','breeze': '💨' };
const Icon = ({ name, size, color, style }) => <Text style={[{ fontSize: size * 0.8, color, textAlign: 'center', lineHeight: size }, style]}>{icons[name] || '🔌'}</Text>;

const TimeInput = ({ value, onChange, onBlur, max, darkMode }) => (
  <View style={[styles.timeInputContainer, darkMode && styles.timeInputContainerDark]}>
    <TextInput 
      style={[styles.timeInput, darkMode && styles.timeInputDark]} 
      value={value} 
      onChangeText={onChange} 
      onBlur={onBlur} 
      keyboardType="numeric" 
      maxLength={2} 
      placeholder="00" 
      placeholderTextColor={darkMode ? '#999' : '#666'} 
    />
    <Text style={[styles.timeInputLabel, darkMode && styles.timeInputLabelDark]}>{max === 23 ? 'HH' : 'MM'}</Text>
  </View>
);

const TimePicker = ({ time, onTimeChange, label, darkMode }) => {
  const [hours, setHours] = useState(time?.hours?.toString().padStart(2, '0') || '00');
  const [minutes, setMinutes] = useState(time?.minutes?.toString().padStart(2, '0') || '00');

  useEffect(() => {
    const h = parseInt(hours) || 0, m = parseInt(minutes) || 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) onTimeChange({ hours: h, minutes: m });
  }, [hours, minutes, onTimeChange]);

  const handleChange = (text, setter, max) => {
    if (text === '') { setter(''); return; }
    const num = text.replace(/[^0-9]/g, '');
    if (num.length <= 2 && parseInt(num) <= max) setter(num);
  };

  const handleBlur = (value, setter, max) => {
    if (value === '') { setter('00'); return; }
    setter(Math.min(max, Math.max(0, parseInt(value) || 0)).toString().padStart(2, '0'));
  };

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.timeLabel, darkMode && styles.textWhite]}>{label}</Text>
      <View style={styles.timePicker}>
        <TimeInput value={hours} onChange={(t) => handleChange(t, setHours, 23)} onBlur={() => handleBlur(hours, setHours, 23)} max={23} darkMode={darkMode} />
        <Text style={[styles.timeSeparator, darkMode && styles.textWhite]}>:</Text>
        <TimeInput value={minutes} onChange={(t) => handleChange(t, setMinutes, 59)} onBlur={() => handleBlur(minutes, setMinutes, 59)} max={59} darkMode={darkMode} />
      </View>
      <View style={styles.quickTimeButtons}>
        {['06:00', '08:00', '18:00', '22:00'].map((quickTime) => (
          <TouchableOpacity key={quickTime} style={[styles.quickTimeBtn, darkMode && styles.quickTimeBtnDark]} onPress={() => { const [h, m] = quickTime.split(':'); setHours(h); setMinutes(m); }}>
            <Text style={[styles.quickTimeBtnText, darkMode && styles.textWhite]}>{quickTime}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const SliderSection = ({ label, value, onValueChange, min = 0, max = 100, step = 25, darkMode, suffix = '%' }) => (
  <View style={styles.sliderSection}>
    <Text style={[styles.configLabel, darkMode && styles.textWhite]}>{label}: {value}{suffix}</Text>
    <Slider style={styles.slider} minimumValue={min} maximumValue={max} step={step} value={value} onValueChange={onValueChange} minimumTrackTintColor="#4a90e2" maximumTrackTintColor={darkMode ? '#555' : '#ddd'} />
  </View>
);

const ButtonRow = ({ buttons, selectedValue, onSelect, darkMode, activeStyle = {}, textStyle = {} }) => (
  <View style={styles.buttonRow}>
    {buttons.map(({ key, label, value = key }) => (
      <TouchableOpacity key={key} style={[styles.button, selectedValue === value && { ...styles.buttonActive, ...activeStyle }, darkMode && styles.buttonDark]} onPress={() => onSelect(value)}>
        <Text style={[styles.buttonText, selectedValue === value && { ...styles.buttonTextActive, ...textStyle }, darkMode && styles.textWhite]}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const SensorConfigModal = ({ visible, onClose, item, darkMode, onSaveSensorConfig }) => {
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

  const updateConfig = (updates) => setConfig((prev) => ({ ...prev, ...updates }));

  const formatTimeout = () => {
    const { timeoutMinutes: m, timeoutSeconds: s } = config;
    return m > 0 && s > 0
      ? `${m}m ${s}s`
      : m > 0
      ? `${m} minute${m > 1 ? 's' : ''}`
      : `${s} second${s > 1 ? 's' : ''}`;
  };

  const handleSave = () => {
    if (config.timeoutMinutes === 0 && config.timeoutSeconds === 0) {
      Alert.alert('Invalid Timeout', 'Please set a timeout period greater than 0 seconds');
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

  const PresetButton = ({ preset, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.presetButton,
        darkMode && styles.presetButtonDark,
        isSelected && (darkMode ? styles.presetButtonSelectedDark : styles.presetButtonSelected)
      ]}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.presetButtonText,
        darkMode && styles.presetButtonTextDark,
        isSelected && styles.presetButtonTextSelected
      ]}>
        {preset.label}
      </Text>
    </TouchableOpacity>
  );

  const SpeedButton = ({ speed, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.speedButton,
        darkMode && styles.speedButtonDark,
        isSelected && (darkMode ? styles.speedButtonSelectedDark : styles.speedButtonSelected)
      ]}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.speedButtonText,
        darkMode && styles.speedButtonTextDark,
        isSelected && styles.speedButtonTextSelected
      ]}>
        {speed}%
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, darkMode && styles.modalContainerDark]}>
        {/* Enhanced Header */}
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
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { position: 'absolute', top:22, right: -250, zIndex: 1 }]}>
              <Icon name="close" size={23} color={darkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Main Toggle Card */}
          <View style={[  styles.mainToggleCard,
  darkMode && styles.mainToggleCardDark
]}>
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
                ios_backgroundColor={darkMode ? '#374151' : '#E5E7EB'}
                style={styles.customSwitch} // Apply custom styles
              />
            </View>
          </View>

          {config.enabled && (
            <>
              {/* Timeout Display */}
              <View style={[styles.timeoutDisplay, darkMode && styles.timeoutDisplayDark]}>
                <View style={styles.timeoutHeader}>
                  <Icon name="clock" size={16} color={darkMode ? '#60A5FA' : '#1E40AF'} />
                  <Text style={[styles.timeoutLabel, darkMode && styles.timeoutLabelDark]}>
                    Current Timeout
                  </Text>
                </View>
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite]}>
                  {formatTimeout()}
                </Text>
                <Text style={[styles.timeoutSubtext, darkMode && styles.textLight]}>
                  Timer resets when motion is detected
                </Text>
              </View>

              {/* Time Controls */}
              <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
                <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
                  Time Settings
                </Text>

                {/* Minutes Slider */}
                <View style={styles.sliderContainer}>
                  <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>
                    Minutes: {config.timeoutMinutes}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={60}
                    step={1}
                    value={config.timeoutMinutes}
                    onValueChange={(value) => updateConfig({ timeoutMinutes: Math.round(value) })}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                  />
                </View>

                {/* Seconds Slider */}
                <View style={styles.sliderContainer}>
                  <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>
                    Seconds: {config.timeoutSeconds}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={59}
                    step={5}
                    value={config.timeoutSeconds}
                    onValueChange={(value) => updateConfig({ timeoutSeconds: Math.round(value) })}
                    minimumTrackTintColor="#3B82F6"
                    maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                  />
                </View>

                {/* Quick Presets */}
                <View style={styles.presetsSection}>
                  <Text style={[styles.presetsLabel, darkMode && styles.textWhite]}>
                    Quick Presets
                  </Text>
                  <View style={styles.presetsContainer}>
                    {timeoutPresets.map((preset) => (
                      <PresetButton
                        key={preset.label}
                        preset={preset}
                        isSelected={
                          preset.minutes === config.timeoutMinutes &&
                          preset.seconds === config.timeoutSeconds
                        }
                        onPress={() => updateConfig({
                          timeoutMinutes: preset.minutes,
                          timeoutSeconds: preset.seconds,
                        })}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Speed Controls */}
              {item?.hasSpeedControl && (
                <View style={[styles.speedSection, darkMode && styles.speedSectionDark]}>
                  <View style={styles.speedHeader}>
                    <Icon name="settings" size={16} color={darkMode ? '#34D399' : '#059669'} />
                    <Text style={[styles.speedTitle, darkMode && styles.speedTitleDark]}>
                      Turn On Settings
                    </Text>
                  </View>
                  
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>
                      Speed: {config.speed}%
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={config.speed}
                      onValueChange={(value) => updateConfig({ speed: Math.round(value) })}
                      minimumTrackTintColor="#10B981"
                      maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                    />
                  </View>

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

        {/* Enhanced Footer */}
        <View style={[styles.modalFooter, darkMode && styles.modalFooterDark]}>
          <TouchableOpacity 
            style={[styles.modalBtn, styles.cancelBtn, darkMode && styles.cancelBtnDark]} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.modalBtnText, darkMode && styles.cancelBtnTextDark]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modalBtn, styles.saveBtn]} 
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={[styles.modalBtnText, styles.saveBtnText]}>
              Save Config
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const SchedulePage = ({ visible, onClose, item, darkMode, onSaveSchedule }) => {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAction, setSelectedAction] = useState('Turn On');
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  // Quick presets for time
  const timePresets = [
    { label: '06:00', hour: 6, minute: 0 },
    { label: '08:00', hour: 8, minute: 0 },
    { label: '18:00', hour: 18, minute: 0 },
    { label: '22:00', hour: 22, minute: 0 },
  ];

  const actions = ['Turn On', 'Turn Off'];
  const days = [
    { key: 'Mon', label: 'Mon' },
    { key: 'Tue', label: 'Tue' },
    { key: 'Wed', label: 'Wed' },
    { key: 'Thu', label: 'Thu' },
    { key: 'Fri', label: 'Fri' },
    { key: 'Sat', label: 'Sat' },
    { key: 'Sun', label: 'Sun' },
  ];

  // Format selected time for display
  const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  // Render quick preset buttons
  const renderPresetButton = (preset) => (
    <TouchableOpacity
      key={preset.label}
      style={[
        styles.presetButton,
        darkMode && styles.presetButtonDark,
        selectedHour === preset.hour && selectedMinute === preset.minute && (darkMode ? styles.presetButtonSelectedDark : styles.presetButtonSelected)
      ]}
      onPress={() => {
        setSelectedHour(preset.hour);
        setSelectedMinute(preset.minute);
      }}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.presetButtonText,
        darkMode && styles.presetButtonTextDark,
        selectedHour === preset.hour && selectedMinute === preset.minute && styles.presetButtonTextSelected
      ]}>
        {preset.label}
      </Text>
    </TouchableOpacity>
  );

  // Render action buttons
  const renderActionButton = (action) => (
    <TouchableOpacity
      key={action}
      style={[
        styles.actionButton,
        selectedAction === action && styles.selectedActionButton
      ]}
      onPress={() => setSelectedAction(action)}
    >
      <Text style={[
        styles.actionButtonText,
        selectedAction === action && styles.selectedActionButtonText
      ]}>
        {action}
      </Text>
    </TouchableOpacity>
  );

  // Render day buttons
  const renderDayButton = (day) => (
    <TouchableOpacity
      key={day.key}
      style={[
        styles.dayButton,
        selectedDays.includes(day.key) && styles.selectedDayButton
      ]}
      onPress={() =>
        setSelectedDays((prev) =>
          prev.includes(day.key)
            ? prev.filter((d) => d !== day.key)
            : [...prev, day.key]
        )
      }
    >
      <Text style={[
        styles.dayButtonText,
        selectedDays.includes(day.key) && styles.selectedDayButtonText
      ]}>
        {day.label}
      </Text>
    </TouchableOpacity>
  );

  // Save handler
  const handleAddSchedule = () => {
    const schedule = {
      hour: selectedHour.toString().padStart(2, '0'),
      minute: selectedMinute.toString().padStart(2, '0'),
      action: selectedAction,
      days: selectedDays,
      repeat: repeatWeekly,
      enabled: true,
    };
    if (onSaveSchedule) onSaveSchedule(item, [schedule]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={false}>
      <SafeAreaView style={[styles.modalContainer, darkMode && styles.modalDark]}>
        {/* Header */}
        <View style={[styles.modalHeader, darkMode && styles.modalHeaderDark]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="clock" size={22} color={darkMode ? "#60A5FA" : "#3B82F6"} />
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
              Schedule Timer
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={22} color={darkMode ? "#f5c3c3" : "#333"} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Time Card */}
          <View style={[styles.mainToggleCard, darkMode && styles.mainToggleCardDark]}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleLeft}>
                <Icon name="timer" size={20} color={darkMode ? '#60A5FA' : '#3B82F6'} />
                <View style={styles.toggleTextContainer}>
                  <Text style={[styles.toggleTitle, darkMode && styles.textWhite]}>
                    Set Switch Time
                  </Text>
                  <Text style={[styles.toggleSubtitle, darkMode && styles.textLight]}>
                    Choose when to {selectedAction.toLowerCase()}
                  </Text>
                </View>
              </View>
            </View>
            {/* Time Pickers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>Hour</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={selectedHour}
                  onValueChange={setSelectedHour}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { textAlign: 'center', fontSize: 18 }]}
                >
                  {selectedHour.toString().padStart(2, '0')}
                </Text>
              </View>
              <View style={{ width: 24, alignItems: 'center' }}>
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { fontSize: 24 }]}>:</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>Minute</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={59}
                  step={1}
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { textAlign: 'center', fontSize: 18 }]}
                >
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
            {/* Quick Presets */}
            <View style={styles.presetsSection}>
              <Text style={[styles.presetsLabel, darkMode && styles.textWhite]}>
                Quick Presets
              </Text>
              <View style={styles.presetsContainer}>
                {timePresets.map(renderPresetButton)}
              </View>
            </View>
            {/* Display selected time */}
            <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { marginTop: 12 }]}
            >
              Selected: {formatTime(selectedHour, selectedMinute)}
            </Text>
          </View>

          {/* Action Card */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
              Action
            </Text>
            <View style={styles.actionContainer}>
              {actions.map(renderActionButton)}
            </View>
          </View>

          {/* Days Card */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
              Days
            </Text>
            <View style={styles.daysContainer}>
              {days.map(renderDayButton)}
            </View>
          </View>

          {/* Repeat Card */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
                Repeat Weekly
              </Text>
              <Text style={[styles.toggleSubtitle, darkMode && styles.textLight]}>
                {repeatWeekly ? 'This schedule will repeat every week' : 'One-time schedule only'}
              </Text>
            </View>
            <Switch
              value={repeatWeekly}
              onValueChange={setRepeatWeekly}
              trackColor={{ false: '#E5E5E5', true: '#4A90E2' }}
              thumbColor={repeatWeekly ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.modalFooter, darkMode && styles.modalFooterDark]}>
          <TouchableOpacity
            style={[styles.modalBtn, styles.cancelBtn, darkMode && styles.cancelBtnDark]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.modalBtnText, darkMode && styles.cancelBtnTextDark]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, styles.saveBtn]}
            onPress={handleAddSchedule}
            activeOpacity={0.7}
          >
            <Text style={[styles.modalBtnText, styles.saveBtnText]}>
              Save Schedule
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const LongPressOptionsModal = ({ visible, onClose, onOpenDevice, darkMode }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.optionsOverlay}>
      <View style={[styles.optionsModalRedesigned, darkMode && styles.optionsModalRedesignedDark]}>
        {/* Drag handle */}
        <View style={styles.optionsHandle} />
        <Text style={[styles.optionsTitleRedesigned, darkMode && styles.textWhite]}>
          Device Actions
        </Text>
        <TouchableOpacity
          style={[styles.optionActionBtn, styles.optionActionBtnPrimary]}
          onPress={onOpenDevice}
        >
          <Icon name="device" size={22} color="#fff" />
          <Text style={styles.optionActionBtnText}>Open Device</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionActionBtn, styles.optionActionBtnSecondary]}
          onPress={onClose}
        >
          <Icon name="close" size={22} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.optionActionBtnText, styles.optionActionBtnTextCancel]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const DeviceOverviewModal = ({
  visible,
  onClose,
  deviceId,
  darkMode,
  onScheduleOpen,
  onSensorConfigOpen
}) => {
  const dispatch = useDispatch();
  const device = useSelector(state =>
    state.switches?.activeDevices?.find(d => d.id === deviceId)
  );
  const [masterSensorToggle, setMasterSensorToggle] = useState(device?.masterTimer?.enabled || false);

  useEffect(() => {
    if (device?.masterTimer) {
      setMasterSensorToggle(device.masterTimer.enabled);
    }
  }, [device?.masterTimer?.enabled]);

  const getSwitches = useCallback(() => {
    if (!device) return [];
    const switches = typeof device.switches === 'function' ? device.switches() : device.switches;
    return Array.isArray(switches) ? switches : [];
  }, [device]);

  const hasSpeedControl = useCallback((switchIndex) =>
    device ? getDeviceConfig(device.deviceId)?.speedControlIndices?.includes(switchIndex) || false : false
  , [device]);

const getCurrentSpeed = useCallback((switchIndex) => {
  if (!device) return 0;
  const switches = typeof device.switches === 'function' ? device.switches() : device.switches;
  return switches?.[switchIndex]?.speed || 0;
}, [device]);


  const getSwitchStatus = useCallback((switchIndex) => {
  if (!device) return false;
  const switches = typeof device.switches === 'function' ? device.switches() : device.switches;
  const switchItem = switches[switchIndex];
  if (!switchItem) return false;
  if (typeof switchItem === 'object') {
    if ('status' in switchItem) return Boolean(switchItem.status);
    if ('isOn' in switchItem) return Boolean(switchItem.isOn);
    if ('state' in switchItem) return Boolean(switchItem.state);
    return false;
  }
  if (typeof switchItem === 'boolean') return switchItem;
  return false;
}, [device]);

  const getItemIcon = useCallback((switchItem) => {
    const name = (switchItem?.name || '').toLowerCase();
    if (hasSpeedControl(getSwitches().indexOf(switchItem))) return 'fan';
    if (name.includes('light') || name.includes('lamp')) return 'lightbulb';
    if (name.includes('speaker') || name.includes('audio')) return 'speaker';
    if (name.includes('tv') || name.includes('television')) return 'television';
    if (name.includes('fan')) return 'fan';
    return 'power';
  }, [hasSpeedControl, getSwitches]);

  // Direct Redux dispatch for switch toggle
  const handleSwitchToggle = useCallback((switchIndex, switchItem) => {
    dispatch(toggleSwitch({
      deviceId: device.id,
      switchId: switchItem.id,
      switchIndex
    }));
  }, [dispatch, device?.id]);

  // Direct Redux dispatch for speed changes
const handleSpeedChange = useCallback((deviceId, switchIndex, speed) => {
  dispatch(updateSwitchSpeed({ deviceId, switchIndex, speed }));
}, [dispatch]);

  // Direct Redux dispatch for sensor toggle
  const handleSensorToggle = useCallback(({ deviceId, switchIndex }) => {
  dispatch(toggleSecondaryStatus({ deviceId, switchIndex }));
}, [dispatch]);


  // Add local state for expanded speed controls
  const [expandedSpeedControls, setExpandedSpeedControls] = useState(new Set());

  // Handler to toggle speed control expansion
  const toggleSpeedControl = useCallback((switchIndex) => {
    setExpandedSpeedControls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(switchIndex)) {
        newSet.delete(switchIndex);
      } else {
        newSet.add(switchIndex);
      }
      return newSet;
    });
  }, []);

  if (!device) return null;
  const switches = getSwitches();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.deviceOverviewModal, darkMode && styles.deviceOverviewModalDark]}>
        {/* Header */}
        <View style={[styles.deviceOverviewHeader, darkMode && styles.deviceOverviewHeaderDark]}>
          <View style={styles.deviceOverviewHeaderLeft}>
            <View style={[styles.deviceOverviewIcon, device.isConnected ? styles.deviceOverviewIconActive : null]}>
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

        {/* Master Motion Sensor Toggle */}
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
              onValueChange={(value) => {
             setMasterSensorToggle(value);
dispatch(updateDevice({
  id: device.id,
  masterTimer: { enabled: value }
}));

                // Add proper action dispatch here if needed
              }}
              trackColor={{ false: darkMode ? '#374151' : '#E5E7EB', true: '#3B82F6' }}
              thumbColor={masterSensorToggle ? '#FFFFFF' : (darkMode ? '#9CA3AF' : '#F3F4F6')}
              ios_backgroundColor={darkMode ? '#374151' : '#E5E7EB'}
            />
            <TouchableOpacity
              style={styles.deviceOverviewSensorSettingsBtn}
              onPress={() => onSensorConfigOpen && onSensorConfigOpen(device)}
            >
              <Icon name="settings" size={18} color={darkMode ? '#60A5FA' : '#3B82F6'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.deviceOverviewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.deviceOverviewGrid}>
            {switches.map((switchItem, index) => {
              const isOn = getSwitchStatus(index);
              const currentSpeed = getCurrentSpeed(index);
              const hasSpeed = hasSpeedControl(index);
              const activeSchedules = switchItem?.schedules?.filter(s => s.enabled).length || 0;
              const switchName = switchItem?.name || `Switch ${index + 1}`;
              const sensorStatus = device.sensors?.[index]?.status || false;
              const secondaryStatus = switchItem?.secondaryStatus;

              return (
                <View key={`${device.id}-switch-${index}`} style={[
                  styles.deviceOverviewCard,
                  { position: 'relative' },
                  isOn && styles.deviceOverviewCardActive,
                  darkMode && !isOn && styles.deviceOverviewCardDark
                ]}>
                  <View style={styles.deviceOverviewCardHeader}>
                    <View style={[
                      styles.deviceOverviewSwitchIcon,
                      isOn && styles.deviceOverviewSwitchIconActive,
                      darkMode && !isOn && styles.deviceOverviewSwitchIconDark
                    ]}>
                      <Icon name={getItemIcon(switchItem)} size={24} color={isOn ? '#fff' : darkMode ? '#fff' : '#666'} />
                    </View>
                    <TouchableOpacity
                      style={[styles.deviceOverviewScheduleBtn, activeSchedules > 0 && styles.deviceOverviewScheduleBtnActive]}
                      onPress={() => onScheduleOpen({
                        id: `${device.id}-switch-${index}`,
                        name: switchName,
                        deviceId: device.id,
                        switchIndex: index,
                        hasSpeedControl: hasSpeed,
                        schedules: switchItem?.schedules || []
                      })}
                    >
                      <Icon name="clock" size={14} color={activeSchedules > 0 ? '#fff' : darkMode ? '#ccc' : '#666'} />
                      {activeSchedules > 0 && (
                        <View style={styles.deviceOverviewScheduleBadge}>
                          <Text style={styles.deviceOverviewScheduleBadgeText}>{activeSchedules}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.deviceOverviewSwitchArea}
                    onPress={() => handleSwitchToggle(index, switchItem)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.deviceOverviewSwitchName,
                      (isOn || darkMode) && styles.textWhite
                    ]} numberOfLines={2}>
                      {switchName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
  <Text style={[styles.deviceOverviewSwitchStatus, (isOn || darkMode) && styles.textWhite]}>
    {isOn ? 'On' : 'Off'}{hasSpeed && isOn ? ` • ${currentSpeed}%` : ''}
  </Text>
  {hasSpeed && isOn && (
    <TouchableOpacity
      style={[styles.speedToggleBtn, darkMode && styles.speedToggleBtnDark,
        {
          position: 'absolute',
          bottom: -5,
          right: 55,
          zIndex: 1,
        }
      ]}
      onPress={() => toggleSpeedControl(index)}
    >
      <Icon name="slider" size={14} color={darkMode ? '#60A5FA' : '#4a90e2'} />
    </TouchableOpacity>
  )}
</View>
{masterSensorToggle && (
  <TouchableOpacity
    onPress={() => handleSensorToggle({ deviceId: device.id, switchIndex: index })}
    style={{
  position: 'absolute',
  bottom: -4,   // align with slider
  right: 0,     // give it space from edge and slider at right: 39
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: switchItem?.secondaryStatus ? '#34D399' : '#9CA3AF',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 5,
}}

  >
    <Icon name="motion" size={16} color="#fff" />
  </TouchableOpacity>
)}


                  </TouchableOpacity>

                  {/* Speed Control Section */}
                  {hasSpeed && isOn && expandedSpeedControls.has(index) && (
                    <View style={[styles.speedControlContainerRedesigned, darkMode && styles.speedControlContainerRedesignedDark]}>
                      <View style={styles.speedControlHeaderRedesigned}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Icon name="breeze" size={18} color={darkMode ? '#60A5FA' : '#4a90e2'} />
                          <Text style={[styles.speedControlTitleRedesigned, darkMode && styles.speedControlTitleRedesignedDark]}>
                            Breeze Level
                          </Text>
                        </View>
                        <View style={styles.speedValueContainerRedesigned}>
                          <Text style={[styles.speedValueTextRedesigned, darkMode && styles.speedValueTextRedesignedDark]}>
                            {Math.round(currentSpeed)}
                          </Text>
                          <Text style={[styles.speedValueUnitRedesigned, darkMode && styles.speedValueUnitRedesignedDark]}>
                            %
                          </Text>
                        </View>
                      </View>
                      {/* Vertical Slider */}
                      <Slider
                        style={[styles.slider, styles.sliderRotated]}
                        minimumValue={0}
                        maximumValue={100}
                        step={1}
                        value={currentSpeed}
                        onValueChange={(value) => handleSpeedChange(device.id, index, value)}
                        minimumTrackTintColor="#fff"
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                      />
                      {/* Speed Buttons */}
                      <View style={styles.speedButtons}>
                        {[0, 25, 50, 75, 100].map((speed) => (
                          <TouchableOpacity
                            key={speed}
                            style={[styles.speedBtn, currentSpeed === speed && styles.speedBtnActive]}
                            onPress={() => handleSpeedChange(device.id, index, speed)}
                          >
                            <Text style={[styles.speedBtnText, currentSpeed === speed && styles.speedBtnTextActive]}>
                              {speed}%
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const EditableText = ({ item, isEditing, editingName, onSave, onCancel, onChange, darkMode, isOn }) => {
  const inputRef = useRef(null);
  const animation = useRef(new Animated.Value(isEditing ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animation, { toValue: isEditing ? 1 : 0, duration: 200, useNativeDriver: false }).start();
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isEditing, animation]);

  return (
    <View>
      {!isEditing && <Text style={[styles.deviceName, (isOn || darkMode) && styles.textWhite]} numberOfLines={1}>{item.name}</Text>}
      <Animated.View
  style={[styles.editContainer, {
    height: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
    flexDirection: 'row',
    alignItems: 'flex-start',
  }]}
  pointerEvents={isEditing ? 'auto' : 'none'}
>
  <TextInput
    ref={inputRef}
    style={[
      styles.nameInput,
      { flex: 1, fontSize: 16, height: 40 },
      darkMode && styles.inputDark,
      isOn && styles.inputActive
    ]}
    value={editingName}
    onChangeText={onChange}
    onSubmitEditing={onSave}
    placeholder="Enter name"
    placeholderTextColor={isOn ? 'rgba(255,255,255,0.6)' : darkMode ? '#999' : '#666'}
    maxLength={25}
    returnKeyType="done"
    blurOnSubmit={false}
  />

  <View style={{ marginLeft: 8, justifyContent: 'center', alignItems: 'center' }}>
    <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={onSave}>
      <Icon name="check" size={18} color="#fff" />
    </TouchableOpacity>
    <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn, { marginTop: 8 }]} onPress={onCancel}>
      <Icon name="close" size={18} color="#fff" />
    </TouchableOpacity>
  </View>
</Animated.View>


    </View>
  );
};

export default function DeviceGrid({ filteredDevices, selectedNavItem }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const reduxDevices = useSelector(state => state.switches?.activeDevices || []);
  console.log('Redux Devices:', reduxDevices);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState({});
  const [secondarySwitchOn, setSecondarySwitchOn] = useState(false);
  const [names, setNames] = useState({});
  const [scheduleModal, setScheduleModal] = useState({ visible: false, item: null });
  const [longPressModal, setLongPressModal] = useState({ visible: false, device: null });
  const [deviceOverviewModal, setDeviceOverviewModal] = useState({ visible: false, device: null });
  const [sensorConfigModal, setSensorConfigModal] = useState({ visible: false, item: null });
  const [expandedSpeedControls, setExpandedSpeedControls] = useState(new Set());
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const getCurrentDeviceState = useCallback((deviceId) => reduxDevices.find(d => d.id === deviceId) || null, [reduxDevices]);
  const getSwitches = useCallback((device) => {
    const currentDevice = getCurrentDeviceState(device.id) || device;
    const switches = typeof currentDevice.switches === 'function' ? currentDevice.switches() : currentDevice.switches;
    return Array.isArray(switches) ? switches : [];
  }, [getCurrentDeviceState]);

  const hasSpeedControl = useCallback((device, switchIndex) => getDeviceConfig(device.deviceId)?.speedControlIndices?.includes(switchIndex) || false, []);

  const masterSensorEnabled = useCallback((deviceId) => {
  const device = reduxDevices.find(d => d.id === deviceId);
  return device?.masterTimer?.enabled || false;
}, [reduxDevices]);

  const getDisplayItems = useMemo(() => {
  const items = [];
  filteredDevices.forEach(device => {
    const currentDevice = getCurrentDeviceState(device.id) || device;
    const switches = getSwitches(currentDevice);
    const config = getDeviceConfig(currentDevice.deviceId);
    switches.forEach((switchItem, idx) => {
      items.push({
          id: `${currentDevice.id}-switch-${idx}`,
          name: switchItem.name || `${currentDevice.name} Switch ${idx + 1}`,
          deviceId: currentDevice.id,
          switchIndex: idx,
          switchData: switchItem,
          isConnected: currentDevice.isConnected,
          type: 'switch',
          hasSpeedControl: hasSpeedControl(currentDevice, idx),
          regulatorIndex: config?.speedControlIndices?.indexOf(idx) || -1,
          device: currentDevice,
          masterSensorEnabled: currentDevice?.masterTimer?.enabled || false,
          sensorData: currentDevice.sensors?.[idx] || null,
          schedules: switchItem.schedules || []
        });
      });
    });
    return items;
  }, [filteredDevices, getCurrentDeviceState, getSwitches, hasSpeedControl]);

  const getItemIcon = useCallback((item) => {
    const name = item.name.toLowerCase();
    if (item.hasSpeedControl) return 'fan';
    const iconMap = { light: 'lightbulb', lamp: 'lightbulb', speaker: 'speaker', audio: 'speaker', tv: 'television', television: 'television', fan: 'fan' };
    return Object.keys(iconMap).find(key => name.includes(key)) ? iconMap[Object.keys(iconMap).find(key => name.includes(key))] : 'power';
  }, []);

  const getSwitchStatus = useCallback((item) => {
    const currentDevice = getCurrentDeviceState(item.deviceId);
    const switchData = currentDevice ? getSwitches(currentDevice)[item.switchIndex] : item.switchData;
    return typeof switchData === 'object' ? switchData.status : (typeof switchData === 'boolean' ? switchData : false);
  }, [getCurrentDeviceState, getSwitches]);

  const getCurrentSpeed = useCallback((item) => {
  const currentDevice = getCurrentDeviceState(item.deviceId);
  const switchData = currentDevice?.switches[item.switchIndex];
  return switchData?.speed || 0; // Get speed from the switch data
}, [getCurrentDeviceState]);

  const handlePressIn = useCallback((device) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setLongPressModal({ visible: true, device });
    }, 800);
  }, []);

  const handlePressOut = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleSwitchToggle = useCallback((deviceId, switchId, switchIndex) => {
    handlePressOut();
    if (longPressTriggered.current) return;
    dispatch(toggleSwitch({ deviceId, switchId, switchIndex }));
  }, [dispatch, handlePressOut]);

  const handleSecondaryToggle = () => {
  const newState = !secondarySwitchOn;
  setSecondarySwitchOn(newState);

  getDisplayItems.forEach(item => {
    dispatch(toggleSecondaryStatus({
      deviceId: item.deviceId,
      switchIndex: item.switchIndex
    }));
  });
};


const handleSpeedChange = useCallback((deviceId, switchIndex, speed) => {
  dispatch(updateSwitchSpeed({ deviceId, switchIndex, speed }));

  const config = getDeviceConfig(filteredDevices.find(d => d.id === deviceId)?.deviceId);
  const regulatorIndex = config?.speedControlIndices?.indexOf(switchIndex);
  if (regulatorIndex >= 0) {
    dispatch(updateDevice({
      id: deviceId,
      regulators: {
        ...((getCurrentDeviceState(deviceId)?.regulators) || {}),
        [regulatorIndex]: speed
      }
    }));
  }
}, [dispatch, filteredDevices, getCurrentDeviceState]);


  const handleSensorToggle = useCallback((deviceId, sensorIndex) => dispatch(toggleSensor({ deviceId, sensorIndex })), [dispatch]);

  const handleEdit = useCallback((id) => {
    const item = getDisplayItems.find(i => i.id === id);
    if (item) {
      setNames(prev => ({ ...prev, [id]: item.name }));
      setEditing(prev => ({ ...prev, [id]: true }));
    }
  }, [getDisplayItems]);

  const handleSaveName = useCallback((id) => {
    const newName = names[id]?.trim();
    if (newName) {
      const item = getDisplayItems.find(i => i.id === id);
      if (item) {
        // Get the current device and switches
        const currentDevice = getCurrentDeviceState(item.deviceId) || item.device;
        const switches = typeof currentDevice.switches === 'function'
          ? currentDevice.switches()
          : currentDevice.switches;

        // Merge the new name into the correct switch
        const updatedSwitches = switches.map((sw, idx) =>
          idx === item.switchIndex ? { ...sw, name: newName } : sw
        );

        dispatch(updateDevice({
          id: item.deviceId, // <-- use 'id' not 'deviceId'
          switches: updatedSwitches
        }));

        // Get the switchId from the switch data
        const switchObj = switches[item.switchIndex];
        if (switchObj && switchObj.id) {
          dispatch(updateSwitchName({
            deviceId: item.deviceId,
            switchId: switchObj.id,
            name: newName
          }));
        }
      }
    }
    setEditing(prev => ({ ...prev, [id]: false }));
    setNames(prev => ({ ...prev, [id]: '' }));
  }, [names, getDisplayItems, dispatch, getCurrentDeviceState]);

  const handleCancelEdit = useCallback((id) => {
    setEditing(prev => ({ ...prev, [id]: false }));
    setNames(prev => ({ ...prev, [id]: '' }));
  }, []);

  const toggleSpeedControl = (itemId) => {
    setExpandedSpeedControls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const modalHandlers = {
    openSchedule: useCallback((item) => setScheduleModal({ visible: true, item }), []),
    closeSchedule: useCallback(() => setScheduleModal({ visible: false, item: null }), []),
    openDevice: useCallback(() => {
      const device = longPressModal.device;
      if (device) {
        setDeviceOverviewModal({ visible: true, deviceId: device.id });
        setLongPressModal({ visible: false, device: null });
      }
    }, [longPressModal.device]),
    closeLongPress: useCallback(() => setLongPressModal({ visible: false, device: null }), []),
    closeDeviceOverview: useCallback(() => setDeviceOverviewModal({ visible: false, device: null }), [])
  };

  const handleSaveSchedule = useCallback((item, schedules) => {
    dispatch(updateDevice({
      deviceId: item.deviceId,
      updates: { switches: { [item.switchIndex]: { schedules } } }
    }));
  }, [dispatch]);

  const getActiveSchedulesCount = useCallback((item) => item.schedules?.filter(s => s.enabled).length || 0, []);

  if (!filteredDevices?.length) {
    const isFavorites = selectedNavItem === 'favorites';
    return (
      <View style={[styles.emptyContainer, darkMode && styles.emptyContainerDark]}>
        <Icon name="device" size={48} color={darkMode ? '#666' : '#ccc'} />
        <Text style={[styles.emptyText, darkMode && styles.textLight]}>
          {isFavorites ? 'No favorite devices' : 'No devices found'}
        </Text>
        <Text style={[styles.emptySubText, darkMode && styles.textLight]}>
          {isFavorites ? 'Mark devices as favorites to see them here' : 'Check your connection and try again'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {getDisplayItems.map((item, index) => {
          const isOn = getSwitchStatus(item);
          const currentSpeed = getCurrentSpeed(item);
          const activeSchedules = getActiveSchedulesCount(item);
          const isEditing = editing[item.id];
          const sensorStatus = item.sensorData?.status || false;
          const secondaryStatus = item.switchData?.secondaryStatus;
          const isSpeedExpanded = expandedSpeedControls.has(item.id);

          return (
            <View key={item.id} style={[
              styles.gridItemModern,
              !item.isConnected && styles.gridItemDisconnected
            ]}>
              <TouchableOpacity
                style={[
                  styles.deviceCardModern,
                  darkMode && styles.deviceCardModernDark,
                  isOn && styles.deviceCardModernActive,
                  !item.isConnected && styles.deviceCardModernDisconnected
                ]}
                onPressIn={() => handlePressIn(item.device)}
                onPressOut={handlePressOut}
                onPress={() => handleSwitchToggle(item.deviceId, item.switchData.id, item.switchIndex)}
                activeOpacity={0.85}
                disabled={!item.isConnected}
              >
                 <View style={[styles.cardModernContent, { position: 'relative' }]}>
                  <TouchableOpacity
  style={{
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 1,
    zIndex: 10,
  }}
  onPress={() => handleEdit(item.id)}
>
  <Icon name="pencil" size={14} color="#4a90e2"/>
</TouchableOpacity>


                  <View style={[
                    styles.iconModernContainer,
                    isOn && styles.iconModernActive,
                    darkMode && styles.iconModernDark
                  ]}>
                    <Icon name={getItemIcon(item)} size={28} color={isOn ? '#fff' : darkMode ? '#fff' : '#4a90e2'} />
                  </View>
                  
                </View>
                
                <View style={styles.cardModernContent}>
                  <EditableText
                    item={item}
                    isEditing={isEditing}
                    editingName={names[item.id] || ''}
                    onSave={() => handleSaveName(item.id)}
                    onCancel={() => handleCancelEdit(item.id)}
                    onChange={(text) => setNames(prev => ({ ...prev, [item.id]: text }))}
                    darkMode={darkMode}
                    isOn={isOn}
                  />
                  
                  <View style={[styles.statusRowModern, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    {item.masterSensorEnabled && (
  <TouchableOpacity
    onPress={() => dispatch(toggleSecondaryStatus({
      deviceId: item.deviceId,
      switchIndex: item.switchIndex
    }))}
    style={{
  position: 'absolute',
  bottom: 1,
  left: '88%',
  marginTop: 10,
  marginBottom: -1,
  marginLeft: -9, // half of width to center
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: item.switchData?.secondaryStatus ? '#34D399' : '#9CA3AF',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1,
}}

  >
    <Icon name="motion" size={16} color="#fff" />
  </TouchableOpacity>
)}

  <Text style={[
    styles.deviceStatusModern,
    isOn && styles.deviceStatusModernActive,
    darkMode && styles.deviceStatusModernDark
  ]}>
    {isOn ? 'On' : 'Off'}{item.hasSpeedControl && isOn && ` • ${currentSpeed}%`}
  </Text>

  {item.hasSpeedControl && isOn && (
    <TouchableOpacity
      style={[
        styles.speedToggleBtn,
        isSpeedExpanded && styles.speedToggleBtnActive,
        darkMode && styles.speedToggleBtnDark,
        {
        position: 'absolute',
        bottom: -1,
        right: 39, // 👈 push it left to avoid overlapping with motion icon at right: 8
        zIndex: 1,
      },
      ]}
      onPress={() => toggleSpeedControl(item.id)}
    >
      <Icon
        name="slider"
        size={14}
        color={isSpeedExpanded ? '#fff' : (darkMode ? '#60A5FA' : '#4a90e2')}
      />
    </TouchableOpacity>
  )}
</View>
</View>

{item.hasSpeedControl && isOn && isSpeedExpanded && (
  <View style={[styles.speedControlContainerRedesigned, darkMode && styles.speedControlContainerRedesignedDark]}>
    <View style={styles.speedControlHeaderRedesigned}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="slider" size={18} color={darkMode ? '#60A5FA' : '#4a90e2'} />
        <Text style={[styles.speedControlTitleRedesigned, darkMode && styles.speedControlTitleRedesignedDark]}>
          Speed Control
        </Text>
      </View>
      <View style={styles.speedValueContainerRedesigned}>
        <Text style={[styles.speedValueTextRedesigned, darkMode && styles.speedValueTextRedesignedDark]}>
          {Math.round(currentSpeed)}
        </Text>
        <Text style={[styles.speedValueUnitRedesigned, darkMode && styles.speedValueUnitRedesignedDark]}>
          %
        </Text>
      </View>
    </View>
    <Slider
      style={[styles.slider, styles.sliderRotated]}
      minimumValue={0}
      maximumValue={100}
      step={1}
      value={currentSpeed}
      onValueChange={(value) => handleSpeedChange(item.deviceId, item.switchIndex, value)}
      minimumTrackTintColor="#fff"
      maximumTrackTintColor="rgba(255,255,255,0.3)"
    />
    <View style={styles.speedButtons}>
      {[0, 25, 50, 75, 100].map((speed) => (
        <TouchableOpacity
          key={speed}
          style={[styles.speedBtn, currentSpeed === speed && styles.speedBtnActive]}
          onPress={() => handleSpeedChange(item.deviceId, item.switchIndex, speed)}
        >
          <Text style={[styles.speedBtnText, currentSpeed === speed && styles.speedBtnTextActive]}>
            {speed}%
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)}

                
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <SchedulePage
        visible={scheduleModal.visible}
        onClose={modalHandlers.closeSchedule}
        item={scheduleModal.item}
        darkMode={darkMode}
        onSaveSchedule={handleSaveSchedule}
      />

      <LongPressOptionsModal
        visible={longPressModal.visible}
        onClose={modalHandlers.closeLongPress}
        onOpenDevice={modalHandlers.openDevice}
        darkMode={darkMode}
      />

      <DeviceOverviewModal
              visible={deviceOverviewModal.visible}
              onClose={modalHandlers.closeDeviceOverview}
              deviceId={deviceOverviewModal.deviceId}
              darkMode={darkMode}
              onScheduleOpen={modalHandlers.openSchedule}
              onSensorConfigOpen={(device) => setSensorConfigModal({ visible: true, item: device })}
            />

      <SensorConfigModal
        visible={sensorConfigModal.visible}
        onClose={() => setSensorConfigModal({ visible: false, item: null })}
        item={sensorConfigModal.item}
        darkMode={darkMode}
        onSaveSensorConfig={(device, config) => {
          // Save the config to Redux or backend
          dispatch(updateDevice({
            deviceId: device.id,
            updates: { sensorConfig: config }
          }));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Base
  container: { flex: 1, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16 },
  
  // Cards
  deviceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, minHeight: 120 },
  deviceCardActive: { backgroundColor: '#4a90e2', shadowColor: '#4a90e2', shadowOpacity: 0.3 },
  deviceCardDark: { backgroundColor: '#2d2d2d', shadowOpacity: 0.3 },
  deviceCardDisconnected: { opacity: 0.6 },
  
  // Card Components
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  iconContainerActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  iconContainerDark: { backgroundColor: '#404040' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  
  // Buttons
  scheduleBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  scheduleBtnActive: { backgroundColor: '#ff6b35' },
  scheduleBadge: { position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff3333', justifyContent: 'center', alignItems: 'center' },
  editBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  
  // Text
  deviceName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  deviceStatus: { fontSize: 14, color: '#666' },
  deviceInfo: { fontSize: 12, color: '#999' },
  textWhite: { color: '#fff' },
  textLight: { color: '#ccc' },
  
  // Speed Controls
  speedSection: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  speedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  speedLabel: { marginLeft: 6, fontSize: 14, fontWeight: '500' },
  speedSectionslider: { width: '100%', height: 40, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  speedButtons: { flexDirection: 'column', flexPosition: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  speedBtn: { paddingHorizontal: 5, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.5)' },
  speedBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  speedBtnText: { color: '#000', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  speedBtnTextActive: { color: '#4CAF50', fontWeight: '600' },
  
  // Card Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  footerLeft: { flex: 1 },
  sensorBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  sensorBtnActive: { backgroundColor: '#4CAF50' },
  
  // Edit
  editContainer: { overflow: 'hidden' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: { flex: 1, height: 36, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, paddingHorizontal: 5, fontSize:8, backgroundColor: '#fff',height: 60,width: '150%' },
  inputDark: { backgroundColor: '#404040', borderColor: '#555', color: '#fff' },
  inputActive: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.5)', color: '#333' },
  actionBtn: { width: 32, height: 32, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { backgroundColor: '#4CAF50' },
 
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyContainerDark: { backgroundColor: '#1a1a1a' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16, textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalDark: { backgroundColor: '#1a1a1a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  deviceSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  modalContent: { flex: 1, padding: 20 },
  mainToggleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  mainToggleCardDark: { backgroundColor: '#1F2937' },
  toggleContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTextContainer: { marginLeft: 12, flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  toggleSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  timeoutDisplay: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center' },
  timeoutDisplayDark: { backgroundColor: '#1E3A8A', borderColor: '#1E40AF' },
  timeoutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeoutLabel: { fontSize: 14, fontWeight: '500', color: '#1E40AF', marginLeft: 6 },
  timeoutLabelDark: { color: '#BFDBFE' },
  timeoutValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  timeoutSubtext: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  configSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  configSectionDark: { backgroundColor: '#1F2937' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 16 },
  sliderContainer: { marginBottom: 20 },
  sliderLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 },
  slider: { width: '100%', height: 100, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sliderThumb: { backgroundColor: '#3B82F6', width: 500, height: 20 },
  sliderThumbGreen: { backgroundColor: '#10B981', width: 20, height: 20 },
  presetsSection: { marginTop: 8 },
  presetsLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 12 },
  presetsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  presetButtonDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  presetButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  presetButtonTextDark: { color: '#D1D5DB' },
  presetButtonTextSelected: { color: '#fff' },
  actionButtonsContainer: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center' },
  actionButtonDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  actionButtonOn: { backgroundColor: '#10B981', borderColor: '#10B981' },
  actionButtonOff: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  actionButtonTextDark: { color: '#D1D5DB' },
  actionButtonTextSelected: { color: '#fff' },
  speedSection: { backgroundColor: '#ECFDF5', borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: '#D1FAE5' },
  speedSectionDark: { backgroundColor: '#064E3B', borderColor: '#065F46' },
  speedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  speedTitle: { fontSize: 14, fontWeight: '500', color: '#065F46', marginLeft: 6 },
  speedTitleDark: { color: '#6EE7B7' },
  speedButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  speedButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  speedButtonDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  speedButtonSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  speedButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  speedButtonTextDark: { color: '#D1D5DB' },
  speedButtonTextSelected: { color: '#fff' },
  modalFooter: { flexDirection: 'row', padding: 5, paddingBottom: 5, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  modalFooterDark: { backgroundColor: '#111827', borderTopColor: '#374151' },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtn: { backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  saveBtnTextdark: { color: '#fff' },
  modalBtnText: { fontSize: 16, fontWeight: '600' ,color: '#374151'},
  cancelBtnTextDark: { color: '#fff' },

  timeInput: { backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4 },
  timeOption: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', padding: 12, marginVertical: 2, borderRadius: 4 },
  scrollView: { flex: 1 },
  header: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  timeSection: { marginBottom: 24 },
  timeInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  timeLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginRight: 8 },
  timeScroll: { flexDirection: 'row', flexWrap: 'nowrap' },
  timeOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeButton: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedTimeButton: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  timeButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  selectedTimeButtonText: { color: '#fff' },
  actionSection: { marginBottom: 24 },
  actionContainer: { flexDirection: 'row', gap: 8 },
  selectedActionButton: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  daysSection: { marginBottom: 24 },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: { backgroundColor: '#F3F4F6', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, marginBottom: 8, alignItems: 'center', minWidth: 40 },
  selectedDayButton: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  dayButtonText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  selectedDayButtonText: { color: '#fff', fontWeight: '600' },
  optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  optionsModalRedesigned: { width: 320, backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 12 },
  optionsModalRedesignedDark: { backgroundColor: '#23272f' },
  optionsHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 16, opacity: 0.5 },
  optionsTitleRedesigned: { fontSize: 18, fontWeight: '700', marginBottom: 24, color: '#222', alignSelf: 'center' },
  optionActionBtn: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 16, borderRadius: 12, marginBottom: 14, justifyContent: 'center' },
  optionActionBtnPrimary: { backgroundColor: '#4a90e2' },
  optionActionBtnSecondary: { backgroundColor: '#f3f4f6' },
  optionActionBtnText: { fontSize: 16, fontWeight: '600', marginLeft: 12, color: '#222' },
  optionActionBtnTextCancel: { color: '#e53935' },
  deviceOverviewModal: { flex: 1, backgroundColor: '#f8f9fa' },
  deviceOverviewModalDark: { backgroundColor: '#181a20' },
  deviceOverviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  deviceOverviewHeaderDark: { backgroundColor: '#23272f', borderBottomColor: '#23272f' },
  deviceOverviewHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deviceOverviewIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eaf2fb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  deviceOverviewIconActive: { backgroundColor: '#E0F2FE' },
  deviceOverviewTitle: { fontSize: 20, fontWeight: '700', color: '#222' },
  deviceOverviewSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  deviceOverviewCloseBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  deviceOverviewSensorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#f3f4f6', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  deviceOverviewSensorRowDark: { backgroundColor: '#23272f', borderBottomColor: '#23272f' },
  deviceOverviewSensorSettingsdark: { backgroundColor: '#23272f' },
  deviceOverviewSensorLabel: { fontSize: 16, fontWeight: '600', marginLeft: 10, color: '#222' },
  deviceOverviewSensorSettingsBtn: { marginLeft: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#eaf2fb', justifyContent: 'center', alignItems: 'center' },
  deviceOverviewContent: { flex: 1, padding: 20 },
  deviceOverviewContentModern: { flex: 1, padding: 18 },
  deviceOverviewGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  deviceOverviewCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  deviceOverviewCardActive: { backgroundColor: '#1E40AF', shadowColor: '#4a90e2', shadowOpacity: 0.15 },
  deviceOverviewCardDark: { backgroundColor: '#23272f', shadowColor: '#23272f' },
  deviceOverviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  deviceOverviewSwitchIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  deviceOverviewSwitchIconActive: { backgroundColor: '#4a90e2' },
  deviceOverviewSwitchIconDark: { backgroundColor: '#404040' },
  deviceOverviewScheduleBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  deviceOverviewScheduleBtnActive: { backgroundColor: '#ff6b35' },
  deviceOverviewScheduleBadge: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#ff3333', justifyContent: 'center', alignItems: 'center' },
  deviceOverviewScheduleBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  deviceOverviewSwitchArea: { marginTop: 8, marginBottom: 8 },
  deviceOverviewSwitchName: { fontSize: 16, fontWeight: '600', color: '#222' },
  deviceOverviewSwitchStatus: { fontSize: 14, color: '#888', marginTop: 2 },
  deviceOverviewSpeedSection: { marginTop: 10, marginBottom: 8 },
  deviceOverviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  deviceOverviewSwitchInfo: { fontSize: 13, color: '#888', flex: 1, flexWrap: 'wrap' },
  deviceOverviewPowerBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' },
  deviceOverviewPowerBtnDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  gridItemModern: { width: '48%', marginBottom: 18 },
  gridItemDisconnected: { opacity: 0.5 },
  deviceCardModern: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#4a90e2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, minHeight: 140, borderWidth: 1, borderColor: '#e5e7eb' },
  deviceCardModernActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  deviceCardModernDark: { backgroundColor: '#23272f', borderColor: '#23272f' },
  deviceCardModernDisconnected: { opacity: 0.6 },
  cardModernHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconModernContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eaf2fb', justifyContent: 'center', alignItems: 'center' },
  iconModernActive: { backgroundColor: '#E0F2FE' },
  iconModernDark: { backgroundColor: '#374151' },
  cardModernContent: { marginTop: 6, marginBottom: 8 },
  deviceStatusModern: { fontSize: 15, color: '#4a90e2', fontWeight: '600', flex: 1 },
  deviceStatusModernActive: { color: '#fff' },
  deviceStatusModernDark: { color: '#60A5FA' },
  modalContainer: {  flex: 1,  backgroundColor: '#fff'  },
modalContainerDark: { backgroundColor: '#111827' },
  speedToggleBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eaf2fb', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e1e8f0' },
  speedToggleBtnActive: { backgroundColor: '#4a90e2', borderColor: '#4a90e2' },
  speedToggleBtnDark: { backgroundColor: '#374151', borderColor: '#4b5563' },
  speedToggleBtnDisabled: { opacity: 0.5, backgroundColor: '#f3f4f6' },
  speedModernSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fafbfc', borderRadius: 12, padding: 12, marginHorizontal: -6, flexDirection: 'row', alignItems: 'stretch', minHeight: 140 },
  speedModernSectionDark: { borderTopColor: '#374151', backgroundColor: '#1f2937' },
  speedControlContainer: { marginTop: 12, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 20, backgroundColor: '#f8fafc', borderRadius: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center', marginHorizontal: -6 },
  speedControlContainerDark: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
  speedControlHeader: { alignItems: 'center', marginBottom: 16 },
  speedControlHeaderRedesigned: { alignItems: 'center', marginBottom: 10 },
  speedControlTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  speedControlTitleDark: { color: '#94a3b8' },
  speedControlTitleRedesigned: { fontSize: 13, fontWeight: '700', color: '#4a90e2', letterSpacing: 0.5, marginBottom: 2 },
  speedControlTitleRedesignedDark: { color: '#60a5fa' },
  speedValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
  speedValueContainerRedesigned: { flexDirection: 'row', alignItems: 'flex-end' },
  speedValueText: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  speedValueTextDark: { color: '#f1f5f9' },
  speedValueTextRedesigned: { fontSize: 32, fontWeight: '800', color: '#1e293b' },
  speedValueTextRedesignedDark: { color: '#f1f5f9' },
  speedValueUnit: { fontSize: 16, fontWeight: '600', color: '#64748b', marginLeft: 3, marginBottom: 3 },
  speedValueUnitDark: { color: '#94a3b8' },
  speedValueUnitRedesigned: { fontSize: 16, fontWeight: '600', color: '#64748b', marginLeft: 3, marginBottom: 3 },
  speedValueUnitRedesignedDark: { color: '#94a3b8' },
  sliderTrackAreaRedesigned: { width: 40, height: 180, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  sliderTrackBackgroundRedesigned: { width: 6, height: 180, backgroundColor: '#e2e8f0', borderRadius: 3, position: 'absolute', left: 17 },
  sliderTrackBackgroundRedesignedDark: { backgroundColor: '#475569' },
  sliderTrackActiveRedesigned: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#4a90e2', borderRadius: 3, minHeight: 2 },
  sliderTrackActiveRedesignedDark: { backgroundColor: '#60a5fa' },
  sliderThumbRedesigned: { rotate: '90deg',position: 'absolute', width: 22, height: 22, backgroundColor: '#4a90e2', borderRadius: 11, left: -8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 6, borderWidth: 3, borderColor: '#fff', zIndex: 2 },
  sliderThumbRedesignedDark: { backgroundColor: '#60a5fa', borderColor: '#1e293b' },
  speedMarkersRedesigned: { position: 'absolute', left: 38, top: 0, width: 44, height: 180, justifyContent: 'space-between' },
  speedMarkerRedesigned: { position: 'absolute', flexDirection: 'row', alignItems: 'center', left: 0, height: 22 },
  speedMarkerDotRedesigned: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1', marginRight: 7 },
  speedMarkerDotActiveRedesigned: { backgroundColor: '#4a90e2', transform: [{ scale: 1.4 }] },
  speedMarkerDotRedesignedDark: { backgroundColor: '#64748b' },
  speedMarkerTextRedesigned: { fontSize: 13, fontWeight: '500', color: '#1F2937', minWidth: 24 },
  speedMarkerTextActiveRedesigned: { color: '#4a90e2', fontWeight: '700' },
  speedMarkerTextRedesignedDark: { color: '#94a3b8' },
  sliderTouchArea: { position: 'absolute', left: -20, top: 0, bottom: 0, width: 40 },
  hiddenSlider: { width: 40, height: 160, transform: [{ rotate: '-90deg' }], opacity: 0 },
  cardModernFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  deviceInfoModern: { fontSize: 13, color: '#888', flex: 1, flexWrap: 'wrap' },
  deviceInfoModernDark: { color: '#9ca3af' },
  sliderOverlay: { position: 'absolute', left: 0, top: 0, width: 40, height: 180, opacity: 0, zIndex: 10 },
  presetButtonSelected: {
    backgroundColor: '#F59E0B', // Highlight color for selected preset
    borderColor: '#4A90E2',
  },
  presetButtonSelectedDark: {
    backgroundColor: '#60A5FA', // Highlight color for dark mode
    borderColor: '#60A5FA',
  },
  presetButtonTextSelected: {
    color: '#FFFFFF', // Text color for selected preset
    fontWeight: '600',
  },

  speedControlContainerRedesigned: {
    marginTop: 10, // Add spacing above the Speed Control section
    marginBottom: 20, // Add spacing below the Speed Control section
    marginLeft: 0, // Add spacing to the left
    marginRight: 0,
    padding: 20, // Add padding inside the container
    backgroundColor: '#60A5FA', // Background color for better visibility
    borderRadius: 12, // Rounded corners
    zIndex: 5, // Ensure it is above other elements
  },
  speedControlContainerRedesignedDark: {
    backgroundColor: '#1e293b', // Dark mode background color
    zIndex: 1,
  },
  speedControlHeaderRedesigned: {
    alignItems: 'center',
    marginBottom: 1, // Add spacing below the header
  },
  speedControlTitleRedesigned: {
    fontSize: 20,
    flexPosition: 'center',
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  speedControlTitleRedesignedDark: {
    color: '#60a5fa',
  },
  speedValueContainerRedesigned: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  speedValueTextRedesigned: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1F2937',
  },
  speedValueTextRedesignedDark: {
    color: '#f1f5f9',
  },
  speedValueUnitRedesigned: {
    fontSize: 16,
    flexPosition: 'center',
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 2,
    marginBottom: 2,
  },
  speedValueUnitRedesignedDark: {
    color: '#94a3b8',
  },

});