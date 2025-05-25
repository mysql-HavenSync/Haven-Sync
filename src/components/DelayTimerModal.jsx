import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function DelayTimerModal({ visible, onClose, onSelectDelay }) {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');

  const handleStart = () => {
    const min = parseInt(minutes) || 0;
    const sec = parseInt(seconds) || 0;
    const totalSeconds = min * 60 + sec;
    if (totalSeconds > 0) {
      onSelectDelay(totalSeconds);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center items-center bg-black bg-opacity-40 px-4">
        <View className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
          <Text className="text-xl font-bold text-center text-gray-800 dark:text-white mb-4">
            Set Delay Time
          </Text>

          {/* Time Inputs */}
          <View className="flex-row justify-between mb-6 space-x-4">
            <View className="flex-1">
              <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                Minutes
              </Text>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg text-center text-lg"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                Seconds
              </Text>
              <TextInput
                value={seconds}
                onChangeText={setSeconds}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg text-center text-lg"
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-700 py-3 rounded-xl mr-2 items-center">
              <Text className="text-base font-bold text-gray-800 dark:text-white">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStart}
              className="flex-1 bg-[#84c3e0] py-3 rounded-xl items-center">
              <Text className="text-base font-bold text-white">Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}