import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';


const SchedulePage = ({
  visible,
  onClose,
  item,
  darkMode,
  onSaveSchedule,
  Icon,
  styles,
}) => {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAction, setSelectedAction] = useState('Turn On');
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatWeekly, setRepeatWeekly] = useState(false);

  const timePresets = [
    { label: '06:00', hour: 6, minute: 0 },
    { label: '08:00', hour: 8, minute: 0 },
    { label: '18:00', hour: 18, minute: 0 },
    { label: '22:00', hour: 22, minute: 0 },
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const formatTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const handleAddSchedule = () => {
    const schedule = {
      hour: selectedHour.toString().padStart(2, '0'),
      minute: selectedMinute.toString().padStart(2, '0'),
      action: selectedAction,
      days: selectedDays,
      repeat: repeatWeekly,
      enabled: true,
    };
    onSaveSchedule?.(item, [schedule]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
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
            <Icon name="close" size={22} color={darkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView style={styles.modalContent}>
          {/* Time Selection */}
          <View style={[styles.mainToggleCard, darkMode && styles.mainToggleCardDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
              Choose Time
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
              {/* Hour */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>Hour</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={selectedHour}
                  onValueChange={setSelectedHour}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { textAlign: 'center' }]}>
                  {selectedHour.toString().padStart(2, '0')}
                </Text>
              </View>

              {/* Minute */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.sliderLabel, darkMode && styles.textWhite]}>Minute</Text>
                <Slider
                  minimumValue={0}
                  maximumValue={59}
                  step={1}
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                  minimumTrackTintColor="#3B82F6"
                  maximumTrackTintColor={darkMode ? '#4B5563' : '#E5E7EB'}
                />
                <Text style={[styles.timeoutValue, darkMode && styles.textWhite, { textAlign: 'center' }]}>
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Presets */}
            <View style={styles.presetsSection}>
              <Text style={[styles.presetsLabel, darkMode && styles.textWhite]}>Quick Presets</Text>
              <View style={styles.presetsContainer}>
                {timePresets.map(preset => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.presetButton,
                      darkMode && styles.presetButtonDark,
                      preset.hour === selectedHour && preset.minute === selectedMinute && styles.presetButtonSelected
                    ]}
                    onPress={() => {
                      setSelectedHour(preset.hour);
                      setSelectedMinute(preset.minute);
                    }}
                  >
                    <Text style={[styles.presetButtonText, darkMode && styles.textWhite]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Action</Text>
            <View style={styles.buttonRow}>
              {['Turn On', 'Turn Off'].map(action => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.button,
                    selectedAction === action && styles.buttonActive,
                    darkMode && styles.buttonDark
                  ]}
                  onPress={() => setSelectedAction(action)}
                >
                  <Text style={[styles.buttonText, darkMode && styles.textWhite]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Day Selector */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Days</Text>
            <View style={styles.buttonRow}>
              {days.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.button,
                    selectedDays.includes(day) && styles.buttonActive,
                    darkMode && styles.buttonDark
                  ]}
                  onPress={() =>
                    setSelectedDays(prev =>
                      prev.includes(day)
                        ? prev.filter(d => d !== day)
                        : [...prev, day]
                    )
                  }
                >
                  <Text style={[styles.buttonText, darkMode && styles.textWhite]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Repeat */}
          <View style={[styles.configSection, darkMode && styles.configSectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
              Repeat Weekly
            </Text>
            <Switch
              value={repeatWeekly}
              onValueChange={setRepeatWeekly}
              trackColor={{ false: '#E5E5E5', true: '#4A90E2' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.modalFooter, darkMode && styles.modalFooterDark]}>
          <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onClose}>
            <Text style={styles.modalBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddSchedule}>
            <Text style={styles.modalBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SchedulePage;
