// src/features/HexaEditProfile.jsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile } from '../redux/slices/profileSlice';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faEdit,
  faSave,
  faCamera,
  faUser,
  faEnvelope,
  faPhone,
  faCalendar,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import DatePicker from 'react-native-date-picker';

export default function HexaEditProfile() {
  const dispatch = useDispatch();
  const profile = useSelector(state => state.profile);
  const isDark = useSelector(state => state.profile.darkMode);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const fadeInStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const handleChange = (field, value) => {
    if (field === 'phone') {
      if (!value.startsWith('+91')) {
        value = `+91${value.replace(/^\+91/, '')}`;
      }
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    dispatch(updateProfile(formData));
    setIsEditing(false);
  };

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 5, stiffness: 150 }, () => {
      scale.value = withSpring(1);
    });
    setIsEditing(prev => !prev);
  };

  const handleImageUpload = () => {
    if (!isEditing) return;

    Alert.alert('Upload Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: () =>
          launchCamera({}, response => {
            if (!response.didCancel && !response.error) {
              setFormData({ ...formData, avatar: response.assets[0].uri });
            }
          }),
      },
      {
        text: 'Gallery',
        onPress: () =>
          launchImageLibrary({}, response => {
            if (!response.didCancel && !response.error) {
              setFormData({ ...formData, avatar: response.assets[0].uri });
            }
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const themed = isDark
    ? {
        bg: '#121212',
        card: '#1f1f1f',
        text: '#ffffff',
        subtext: '#bbbbbb',
        input: '#2a2a2a',
        border: '#444',
      }
    : {
        bg: '#f5f7fb',
        card: '#ffffff',
        text: '#333333',
        subtext: '#777777',
        input: '#f0f0f0',
        border: '#ccc',
      };

  return (
    <ScrollView
      style={{ backgroundColor: themed.bg }}
      contentContainerStyle={[styles.container]}>
      <Animated.View style={[{ alignItems: 'center' }, fadeInStyle]}>
        <TouchableOpacity onPress={handleImageUpload} disabled={!isEditing}>
          <Animated.Image
            source={{ uri: formData.avatar }}
            style={[styles.avatar, animatedStyle]}
            onLoad={() => {
              opacity.value = withTiming(1, { duration: 500 });
            }}
          />
          {isEditing && (
            <View style={styles.cameraIcon}>
              <FontAwesomeIcon icon={faCamera} size={16} color="#4A90E2" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.card, { backgroundColor: themed.card }]}>
        {[
          { label: 'Name', key: 'name', icon: faUser },
          { label: 'Email', key: 'email', icon: faEnvelope },
          { label: 'Phone', key: 'phone', icon: faPhone },
        ].map(({ label, key, icon }) => (
          <View key={key} style={styles.fieldRow}>
            <FontAwesomeIcon icon={icon} size={18} color="#4A90E2" />
            <View style={styles.fieldContent}>
              <Text style={[styles.label, { color: themed.subtext }]}>{label}</Text>
              {isEditing ? (
                <TextInput
                  value={formData[key]}
                  onChangeText={text => handleChange(key, text)}
                  style={[
                    styles.input,
                    { backgroundColor: themed.input, color: themed.text, borderColor: themed.border },
                  ]}
                />
              ) : (
                <Text style={[styles.value, { color: themed.text }]}>
                  {formData[key] || 'N/A'}
                </Text>
              )}
            </View>
          </View>
        ))}

        {/* DOB */}
        <View style={styles.fieldRow}>
          <FontAwesomeIcon icon={faCalendar} size={18} color="#4A90E2" />
          <View style={styles.fieldContent}>
            <Text style={[styles.label, { color: themed.subtext }]}>Date of Birth</Text>
            {isEditing ? (
              <TouchableOpacity
                onPress={() => setDobPickerVisible(true)}
                style={[
                  styles.input,
                  { backgroundColor: themed.input, borderColor: themed.border },
                ]}>
                <Text style={{ color: themed.text }}>
                  {formData.dob || 'Select Date'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.value, { color: themed.text }]}>
                {formData.dob || 'N/A'}
              </Text>
            )}
          </View>
        </View>

        {/* Password Fields */}
        {isEditing && ['newPassword', 'confirmPassword'].map(key => (
          <View key={key} style={styles.fieldRow}>
            <FontAwesomeIcon icon={faLock} size={18} color="#4A90E2" />
            <View style={styles.fieldContent}>
              <Text style={[styles.label, { color: themed.subtext }]}>
                {key === 'newPassword' ? 'New Password' : 'Confirm Password'}
              </Text>
              <TextInput
                value={formData[key]}
                onChangeText={text => handleChange(key, text)}
                secureTextEntry
                style={[
                  styles.input,
                  { backgroundColor: themed.input, color: themed.text, borderColor: themed.border },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <DatePicker
        modal
        open={dobPickerVisible}
        date={formData.dob ? new Date(formData.dob) : new Date()}
        mode="date"
        onConfirm={date => {
          setDobPickerVisible(false);
          handleChange('dob', date.toISOString().split('T')[0]);
        }}
        onCancel={() => setDobPickerVisible(false)}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isEditing ? '#4A90E2' : '#555' }]}
        onPress={isEditing ? handleSave : handlePress}>
        <Animated.View style={{ marginRight: 10 }}>
          <FontAwesomeIcon icon={isEditing ? faSave : faEdit} size={20} color="#fff" />
        </Animated.View>
        <Text style={styles.buttonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#4A90E2',
    marginBottom: 16,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 4,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    marginTop: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  fieldContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
