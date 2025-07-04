// src/features/HexaEditProfile.jsx

import React, { useState, useEffect } from 'react';
import api from '../api'; 
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
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
  faTimes,
  faImage,
  faVideo,
  faCloud,
} from '@fortawesome/free-solid-svg-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import DatePicker from 'react-native-date-picker';


const { width } = Dimensions.get('window');

export default function HexaEditProfile() {
  const dispatch = useDispatch();
  const profile = useSelector(state => state.profile);
  const isDark = useSelector(state => state.profile.darkMode);
  const token = useSelector(state => state.auth.token);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Animation values
  const avatarScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const editModeProgress = useSharedValue(0);
  const fieldAnimations = useSharedValue(0);
  const modalScale = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
  const loadProfile = async () => {
    try {
      const res = await api.get('/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data) {
        dispatch(updateProfile(res.data));
      }
    } catch (err) {
      console.error('❌ Failed to load profile:', err.response?.data || err.message);
    }
  };

  loadProfile();
}, []);


  useEffect(() => {
  setFormData(profile);
}, [profile]);


  useEffect(() => {
    if (isEditing) {
      editModeProgress.value = withSpring(1, { damping: 15, stiffness: 150 });
      fieldAnimations.value = withTiming(1, { duration: 300 });
    } else {
      editModeProgress.value = withSpring(0, { damping: 15, stiffness: 150 });
      fieldAnimations.value = withTiming(0, { duration: 200 });
    }
  }, [isEditing]);

  useEffect(() => {
    if (imageModalVisible) {
      modalOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 150 });
      modalScale.value = withTiming(0.8, { duration: 150 });
    }
  }, [imageModalVisible]);

  const uploadAvatar = async (fileUri) => {
  const formDataData = new FormData();
  formDataData.append('avatar', {
    uri: fileUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  });

  try {
    const res = await api.post('/api/profile/upload-avatar', formDataData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (res.data.success) {
      setFormData(prev => ({ ...prev, avatar: res.data.url }));
    } else {
      Alert.alert('Upload Failed', 'Could not upload avatar');
    }
  } catch (err) {
    console.error('Avatar upload error:', err);
    Alert.alert('Upload Error', err.message);
  }
};

  // Animated styles
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: avatarScale.value },
      { 
        rotateY: `${interpolate(editModeProgress.value, [0, 1], [0, 360])}deg` 
      }
    ],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value },
      { scale: interpolate(editModeProgress.value, [0, 1], [1, 1.02]) }
    ],
    opacity: cardOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    backgroundColor: interpolate(
      editModeProgress.value,
      [0, 1],
      isDark ? [0x555555, 0x4A90E2] : [0x4A90E2, 0x27AE60]
    ),
  }));

  const fieldContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateX: interpolate(fieldAnimations.value, [0, 1], [20, 0])
      }
    ],
    opacity: interpolate(fieldAnimations.value, [0, 1], [0.7, 1]),
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  const handleChange = (field, value) => {
    if (field === 'phone') {
      if (!value.startsWith('+91')) {
        value = `+91${value.replace(/^\+91/, '')}`;
      }
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
  // Animate save action
  cardTranslateY.value = withSequence(
    withTiming(-10, { duration: 150 }),
    withTiming(0, { duration: 150 })
  );

  try {
    // Send data to backend to update MySQL `user_profiles`
    await api.put('/api/profile', formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Update Redux state
    dispatch(updateProfile(formData));
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  } catch (err) {
    console.error('❌ Failed to save profile:', err.response?.data || err.message);
    Alert.alert('Error', 'Failed to update profile. Please try again.');
  }
};

  const handleEditToggle = () => {
    // Button press animation
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    
    // Avatar bounce animation
    avatarScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    setIsEditing(prev => !prev);
  };

  const handleImageUpload = () => {
    if (!isEditing) return;

    // Shake animation for avatar
    avatarScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setImageModalVisible(true);
  };

  const handleImageOption = (option) => {
    setImageModalVisible(false);
    
    const handleResponse = (response) => {
      if (!response.didCancel && !response.error && response.assets) {
        uploadAvatar(response.assets[0].uri);

      }
    };

    switch(option) {
      case 'camera':
        launchCamera({ quality: 0.8, mediaType: 'photo' }, handleResponse);
        break;
      case 'gallery':
        launchImageLibrary({ quality: 0.8, mediaType: 'photo' }, handleResponse);
        break;
      case 'google':
        // Add Google Photos integration if available
        Alert.alert('Google Photos', 'This feature will be available soon');
        break;
    }
  };

  const themed = isDark
    ? {
        bg: '#0D1117',
        card: '#161B22',
        text: '#F0F6FC',
        subtext: '#8B949E',
        input: '#21262D',
        border: '#30363D',
        accent: '#58A6FF',
        shadow: 'rgba(0,0,0,0.3)',
      }
    : {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1E293B',
        subtext: '#64748B',
        input: '#F1F5F9',
        border: '#E2E8F0',
        accent: '#3B82F6',
        shadow: 'rgba(0,0,0,0.1)',
      };

  const fieldConfigs = [
    { label: 'Full Name', key: 'name', icon: faUser, placeholder: 'Enter your name' },
    { label: 'Email Address', key: 'email', icon: faEnvelope, placeholder: 'Enter your email' },
    { label: 'Phone Number', key: 'phone', icon: faPhone, placeholder: '+91 Enter phone' },
  ];
const isValidDate = (d) => {
  return d && !isNaN(Date.parse(d));
};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themed.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themed.text }]}>
          {isEditing ? 'Edit Profile' : 'My Profile'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: themed.subtext }]}>
          {isEditing ? 'Make changes to your profile' : 'View your profile information'}
        </Text>
      </View>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          onPress={handleImageUpload} 
          disabled={!isEditing}
          activeOpacity={0.8}>
          <Animated.View style={[styles.avatarContainer, avatarAnimatedStyle]}>
            <Image
              source={{ uri: formData.avatar || 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            {isEditing && (
              <Animated.View 
                style={[
                  styles.cameraIconContainer,
                  { backgroundColor: themed.accent }
                ]}>
                <FontAwesomeIcon icon={faCamera} size={16} color="#FFFFFF" />
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <Animated.View style={[
        styles.profileCard,
        { 
          backgroundColor: themed.card,
          shadowColor: themed.shadow,
        },
        cardAnimatedStyle
      ]}>
        
        {/* Basic Fields */}
        {fieldConfigs.map(({ label, key, icon, placeholder }, index) => (
          <Animated.View key={key} style={[styles.fieldContainer, fieldContainerStyle]}>
            <View style={styles.fieldHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${themed.accent}20` }]}>
                <FontAwesomeIcon icon={icon} size={16} color={themed.accent} />
              </View>
              <Text style={[styles.fieldLabel, { color: themed.subtext }]}>{label}</Text>
            </View>
            
            {isEditing ? (
              <TextInput
                value={formData[key] || ''}
                onChangeText={text => handleChange(key, text)}
                placeholder={placeholder}
                placeholderTextColor={themed.subtext}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: themed.input,
                    color: themed.text,
                    borderColor: themed.border,
                  }
                ]}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: themed.text }]}>
                {formData[key] || 'Not provided'}
              </Text>
            )}
          </Animated.View>
        ))}

        {/* Date of Birth */}
        <Animated.View style={[styles.fieldContainer, fieldContainerStyle]}>
          <View style={styles.fieldHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${themed.accent}20` }]}>
              <FontAwesomeIcon icon={faCalendar} size={16} color={themed.accent} />
            </View>
            <Text style={[styles.fieldLabel, { color: themed.subtext }]}>Date of Birth</Text>
          </View>
          
          {isEditing ? (
            <TouchableOpacity
              onPress={() => setDobPickerVisible(true)}
              style={[
                styles.textInput,
                styles.dateInput,
                {
                  backgroundColor: themed.input,
                  borderColor: themed.border,
                }
              ]}>
              <Text style={[styles.dateText, { color: formData.dob ? themed.text : themed.subtext }]}>
                {formData.dob || 'Select your birth date'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.fieldValue, { color: themed.text }]}>
              {formData.dob || 'Not provided'}
            </Text>
          )}
        </Animated.View>

        {/* Password Fields (Only in Edit Mode) */}
        {isEditing && (
          <>
            {['newPassword', 'confirmPassword'].map((key, index) => (
              <Animated.View 
                key={key} 
                style={[
                  styles.fieldContainer, 
                  fieldContainerStyle,
                  { 
                    transform: [{ 
                      translateY: interpolate(fieldAnimations.value, [0, 1], [30, 0]) 
                    }] 
                  }
                ]}>
                <View style={styles.fieldHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${themed.accent}20` }]}>
                    <FontAwesomeIcon icon={faLock} size={16} color={themed.accent} />
                  </View>
                  <Text style={[styles.fieldLabel, { color: themed.subtext }]}>
                    {key === 'newPassword' ? 'New Password' : 'Confirm Password'}
                  </Text>
                </View>
                
                <TextInput
                  value={formData[key] || ''}
                  onChangeText={text => handleChange(key, text)}
                  secureTextEntry
                  placeholder={key === 'newPassword' ? 'Enter new password' : 'Confirm new password'}
                  placeholderTextColor={themed.subtext}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: themed.input,
                      color: themed.text,
                      borderColor: themed.border,
                    }
                  ]}
                />
              </Animated.View>
            ))}
          </>
        )}
      </Animated.View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={isEditing ? handleSave : handleEditToggle}
        activeOpacity={0.8}>
        <Animated.View style={[styles.buttonContent, buttonAnimatedStyle]}>
          <FontAwesomeIcon 
            icon={isEditing ? faSave : faEdit} 
            size={18} 
            color="#FFFFFF" 
          />
          <Text style={styles.buttonText}>
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <DatePicker
  modal
  open={dobPickerVisible}
  date={isValidDate(formData.dob) ? new Date(formData.dob) : new Date()}
        mode="date"
        maximumDate={new Date()}
        onConfirm={date => {
          setDobPickerVisible(false);
          handleChange('dob', date.toISOString().split('T')[0]);
        }}
        onCancel={() => setDobPickerVisible(false)}
        theme={isDark ? 'dark' : 'light'}
      />

      {/* Image Upload Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setImageModalVisible(false)}>
        <Animated.View style={[styles.modalBackdrop, modalBackdropStyle]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill}
            onPress={() => setImageModalVisible(false)}
            activeOpacity={1}
          />
          <Animated.View style={[
            styles.modalContent,
            { backgroundColor: themed.card },
            modalContentStyle
          ]}>
            <Text style={[styles.modalTitle, { color: themed.text }]}>
              Upload Image
            </Text>
            <Text style={[styles.modalSubtitle, { color: themed.subtext }]}>
              Choose how you want to add your profile picture
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: themed.input }]}
                onPress={() => handleImageOption('camera')}
                activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: '#34D399' }]}>
                  <FontAwesomeIcon icon={faCamera} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: themed.text }]}>
                  Take Photo
                </Text>
                <Text style={[styles.optionSubtext, { color: themed.subtext }]}>
                  Use camera to capture
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: themed.input }]}
                onPress={() => handleImageOption('gallery')}
                activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: '#3B82F6' }]}>
                  <FontAwesomeIcon icon={faImage} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: themed.text }]}>
                  Choose from Gallery
                </Text>
                <Text style={[styles.optionSubtext, { color: themed.subtext }]}>
                  Select from your photos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: themed.input }]}
                onPress={() => handleImageOption('google')}
                activeOpacity={0.7}>
                <View style={[styles.optionIcon, { backgroundColor: '#F59E0B' }]}>
                  <FontAwesomeIcon icon={faCloud} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: themed.text }]}>
                  Open Google Photos
                </Text>
                <Text style={[styles.optionSubtext, { color: themed.subtext }]}>
                  Access cloud storage
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setImageModalVisible(false)}>
              <Text style={[styles.cancelText, { color: '#EF4444' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#3B82F6',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '500',
    paddingLeft: 44,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    marginLeft: 44,
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  actionButton: {
    marginHorizontal: 20,
    marginTop: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  optionSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});