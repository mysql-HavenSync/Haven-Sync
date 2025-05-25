import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClock, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function TimePickerModal({ visible, onClose, onSchedule }) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [amPm, setAmPm] = useState('AM');

  const handleNumericInput = (text, setter) => {
    const cleanedText = text.replace(/[^0-9]/g, '');
    setter(cleanedText);
  };

  const handleSchedule = () => {
    const hrs = parseInt(hours, 10);
    const mins = parseInt(minutes, 10);

    if (
      isNaN(hrs) ||
      isNaN(mins) ||
      hrs < 1 ||
      hrs > 12 ||
      mins < 0 ||
      mins > 59
    ) {
      Alert.alert(
        'Invalid Time',
        'Enter valid hours (1-12) and minutes (0-59).'
      );
      return;
    }

    let scheduledHours = hrs;
    if (amPm === 'PM' && hrs !== 12) scheduledHours += 12;
    if (amPm === 'AM' && hrs === 12) scheduledHours = 0;

    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      scheduledHours,
      mins,
      0
    );

    const timeDiff = scheduledTime.getTime() - now.getTime();
    if (timeDiff > 0) {
      onSchedule(Math.floor(timeDiff / 1000));
      onClose();
    } else {
      Alert.alert('Invalid Time', 'Scheduled time must be in the future.');
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center items-center bg-black bg-opacity-40 px-4">
        <View className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <FontAwesomeIcon icon={faClock} size={20} color="#84c3e0" />
              <Text className="text-lg font-bold ml-2 text-gray-800 dark:text-white">
                Schedule Time
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={20} color="#4A5568" />
            </TouchableOpacity>
          </View>

          {/* Time Inputs */}
          <View className="flex-row justify-between mb-5 space-x-3">
            <TextInput
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-center text-xl text-gray-900 dark:text-white p-3 rounded-lg"
              placeholder="HH"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={hours}
              onChangeText={text => handleNumericInput(text, setHours)}
              maxLength={2}
            />
            <TextInput
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-center text-xl text-gray-900 dark:text-white p-3 rounded-lg"
              placeholder="MM"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={minutes}
              onChangeText={text => handleNumericInput(text, setMinutes)}
              maxLength={2}
            />
            <TouchableOpacity
              className="bg-[#84c3e0] px-4 rounded-lg justify-center"
              onPress={() => setAmPm(prev => (prev === 'AM' ? 'PM' : 'AM'))}>
              <Text className="text-white font-bold text-xl">{amPm}</Text>
            </TouchableOpacity>
          </View>

          {/* Schedule Button */}
          <TouchableOpacity
            onPress={handleSchedule}
            className="bg-[#84c3e0] py-3 rounded-xl items-center shadow-md">
            <Text className="text-white font-semibold text-lg">
              Start Scheduling
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
