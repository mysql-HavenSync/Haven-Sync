import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import api from '../../api';

export default function BugReport({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [description, setDescription] = useState('');
  const [attachedMedia, setAttachedMedia] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = [
    { id: 'crash', title: 'App Crash', icon: 'error-outline', color: '#ff4444' },
    { id: 'connection', title: 'Device Connection Issue', icon: 'wifi-off', color: '#ff9800' },
    { id: 'ui', title: 'UI/UX Problem', icon: 'palette', color: '#2196f3' },
    { id: 'multiuser', title: 'Multiple Users Access', icon: 'group', color: '#9c27b0' },
    { id: 'feedback', title: 'Feedback Issue', icon: 'feedback', color: '#00bcd4' },
    { id: 'integration', title: 'Third Party Integration', icon: 'extension', color: '#ff5722' },
    { id: 'other', title: 'Other Issue', icon: 'bug-report', color: '#607d8b' },
  ];

  const enhancedMediaOptions = [
    { id: 0, title: 'Take Photo', icon: 'camera-alt', color: '#4caf50' },
    { id: 1, title: 'Record Video', icon: 'videocam', color: '#ff5722' },
    { id: 2, title: 'Choose from Gallery', icon: 'photo-library', color: '#2196f3' },
    { id: 3, title: 'Open Google Photos', icon: 'photo', color: '#4285f4' },
  ];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  // Toggle selection function
  const toggleIssueSelection = (issueId) => {
    setSelectedIssues(prevSelected => {
      if (prevSelected.includes(issueId)) {
        return prevSelected.filter(id => id !== issueId);
      } else {
        return [...prevSelected, issueId];
      }
    });
  };

  // Enhanced media picker functions
  const showMediaOptions = () => {
    if (Platform.OS === 'ios') {
      const options = ['Take Photo', 'Record Video', 'Choose from Gallery', 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          title: 'Add Media',
          message: 'Choose how you want to add media to your bug report',
        },
        (buttonIndex) => {
          if (buttonIndex !== 3) {
            handleMediaOption(buttonIndex);
          }
        }
      );
    } else {
      setShowMediaModal(true);
    }
  };

  const hideMediaModal = () => {
    setShowMediaModal(false);
  };

  const selectMediaOption = (index) => {
    hideMediaModal();
    if (index === 3) {
      openGooglePhotos();
    } else {
      handleMediaOption(index);
    }
  };

  // Direct Google Photos access
  const openGooglePhotos = () => {
    const googlePhotosPackage = 'com.google.android.apps.photos';
    const googlePhotosIntent = `intent://photos/#Intent;package=${googlePhotosPackage};end`;
    
    if (Platform.OS === 'android') {
      Linking.canOpenURL(googlePhotosIntent)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googlePhotosIntent);
          } else {
            Alert.alert(
              'Google Photos Not Available',
              'Google Photos is not installed. Opening default gallery instead.',
              [{ text: 'OK', onPress: () => handleMediaOption(2) }]
            );
          }
        })
        .catch(() => {
          handleMediaOption(2);
        });
    } else {
      handleMediaOption(2);
    }
  };

  const handleMediaOption = (index) => {
    if (index < 0 || index > 2) {
      return;
    }

    const baseOptions = {
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    switch (index) {
      case 0: // Take Photo
        launchCamera(
          { 
            ...baseOptions, 
            mediaType: 'photo',
            saveToPhotos: true,
          }, 
          handleMediaResponse
        );
        break;
        
      case 1: // Record Video
        launchCamera(
          { 
            ...baseOptions, 
            mediaType: 'video', 
            videoQuality: 'medium',
            durationLimit: 60,
          }, 
          handleMediaResponse
        );
        break;
        
      case 2: // Choose from Gallery
        launchImageLibrary(
          {
            ...baseOptions,
            mediaType: 'mixed',
            selectionLimit: 5, // Allow multiple selections
            includeExtra: true,
            presentationStyle: 'fullScreen',
            storageOptions: {
              skipBackup: true,
              path: 'images',
            },
          }, 
          handleMultipleMediaResponse
        );
        break;
        
      default:
        break;
    }
  };

  const handleMediaResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled media selection');
      return;
    }

    if (response.error) {
      console.log('Media selection error: ', response.error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
      return;
    }

    if (response.errorCode === 'permission') {
      Alert.alert(
        'Permission Required', 
        'Please grant camera and photo library permissions to attach media to your bug report.',
        [
          { text: 'OK' },
          { 
            text: 'Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return;
    }

    if (response.assets && response.assets[0]) {
      const media = response.assets[0];
      
      const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
      if (media.fileSize && media.fileSize > maxSizeInBytes) {
        Alert.alert(
          'File Too Large', 
          'Please select a file smaller than 50MB.',
          [{ text: 'OK' }]
        );
        return;
      }

      setAttachedMedia(prev => [...prev, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: media.uri,
        type: media.type,
        fileName: media.fileName || `media_${Date.now()}`,
        fileSize: media.fileSize,
        width: media.width,
        height: media.height,
      }]);
    }
  };

  // Enhanced response handler for multiple media selection
  const handleMultipleMediaResponse = (response) => {
    if (response.didCancel) {
      console.log('User cancelled media selection');
      return;
    }

    if (response.error) {
      console.log('Media selection error: ', response.error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
      return;
    }

    if (response.errorCode === 'permission') {
      Alert.alert(
        'Permission Required', 
        'Please grant photo library permissions to attach media from your gallery.',
        [
          { text: 'OK' },
          { 
            text: 'Settings', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return;
    }

    // Handle multiple assets
    if (response.assets && response.assets.length > 0) {
      const maxSizeInBytes = 50 * 1024 * 1024; // 50MB per file
      const validAssets = [];
      const invalidAssets = [];

      response.assets.forEach((media) => {
        if (media.fileSize && media.fileSize > maxSizeInBytes) {
          invalidAssets.push(media.fileName || 'Unknown file');
        } else {
          validAssets.push({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uri: media.uri,
            type: media.type,
            fileName: media.fileName || `media_${Date.now()}`,
            fileSize: media.fileSize,
            width: media.width,
            height: media.height,
          });
        }
      });

      // Show warning for invalid files
      if (invalidAssets.length > 0) {
        Alert.alert(
          'Some Files Too Large',
          `The following files are larger than 50MB and cannot be attached:\n${invalidAssets.join(', ')}`,
          [{ text: 'OK' }]
        );
      }

      // Add valid assets
      if (validAssets.length > 0) {
        setAttachedMedia(prev => [...prev, ...validAssets]);
      }
    }
  };

  const removeMedia = (mediaId) => {
    Alert.alert(
      'Remove Media',
      'Are you sure you want to remove this media file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setAttachedMedia(prev => prev.filter(media => media.id !== mediaId));
          }
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (selectedIssues.length === 0 || !description.trim()) {
      Alert.alert('Incomplete Report', 'Please select at least one issue type and provide a description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTitles = selectedIssues.map(id => 
        issueTypes.find(issue => issue.id === id)?.title
      ).filter(Boolean);

      const reportData = {
        to: 'bugreport@hexahavenintegrations.com',
        subject: 'Bug Report - Mobile App',
        issues: selectedTitles,
        description: description.trim(),
        mediaCount: attachedMedia.length,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        mediaFiles: attachedMedia.map(media => ({
          fileName: media.fileName,
          type: media.type,
          fileSize: media.fileSize
        }))
      };

      // Create email body
      const emailBody = `
Bug Report Details:
==================

Issue Types: ${selectedTitles.join(', ')}

Description:
${description.trim()}

Additional Information:
- Platform: ${Platform.OS}
- Timestamp: ${new Date().toLocaleString()}
- Media Files Attached: ${attachedMedia.length}

${attachedMedia.length > 0 ? 'Media Files:\n' + attachedMedia.map(media => `- ${media.fileName} (${media.type})`).join('\n') : ''}
      `;

      const emailData = {
        to: reportData.to,
        subject: reportData.subject,
        body: emailBody,
        attachments: attachedMedia // Include media files if your API supports it
      };

      // Send email via API
      await api.post('/api/feedback/send-feedback-email', {
  to: 'feedback@hexahavenintegrations.com', // or create bugreport@ if you want
  subject: 'Bug Report - HavenSync App',
  body: bugDescription, // Or whatever your text is
  attachments: attachedMedia.map(file => ({
    filename: file.fileName || 'attachment',
    uri: file.uri,
    type: file.type
  })),
  user: {
    name: loggedInUser?.name,
    email: loggedInUser?.email,
    user_id: loggedInUser?.user_id,
    role: loggedInUser?.role,
    platform: Platform.OS,
    version: Platform.Version,
    rating: null
  }
});


      if (response.data.success) {
        Alert.alert(
          'Report Submitted Successfully!', 
          'Thank you for reporting the issue(s). Our team will investigate and get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setSelectedIssues([]);
                setDescription('');
                setAttachedMedia([]);
                // Navigate back
                handleBack();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error submitting bug report:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your bug report. Please try again or contact support directly at bugreport@hexahavenintegrations.com',
        [
          { text: 'Retry', onPress: handleSubmitReport },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesomeIcon 
            icon={faArrowLeft} 
            size={20} 
            color={darkMode ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>
          Bug Error Report
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Issue Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            What type of issues are you experiencing? (Select multiple)
          </Text>
          
          {issueTypes.map((issue) => {
            const isSelected = selectedIssues.includes(issue.id);
            
            return (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueButton,
                  darkMode && styles.issueButtonDark,
                  isSelected && [styles.selectedIssue, darkMode && styles.selectedIssueDark]
                ]}
                onPress={() => toggleIssueSelection(issue.id)}
              >
                <Icon name={issue.icon} size={24} color={issue.color} />
                <Text style={[styles.issueButtonText, darkMode && styles.textWhite]}>
                  {issue.title}
                </Text>
                {isSelected && (
                  <Icon name="check-circle" size={20} color="#4caf50" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Issues Counter */}
        {selectedIssues.length > 0 && (
          <View style={[styles.selectedCounter, darkMode && styles.selectedCounterDark]}>
            <Text style={[styles.selectedCounterText, darkMode && styles.textWhite]}>
              {selectedIssues.length} issue{selectedIssues.length > 1 ? 's' : ''} selected
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            Describe the issue{selectedIssues.length > 1 ? 's' : ''}
          </Text>
          <TextInput
            style={[styles.descriptionInput, darkMode && styles.descriptionInputDark]}
            placeholder="Please provide details about the issue(s) you encountered..."
            placeholderTextColor={darkMode ? '#888' : '#999'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Media Attachment Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            Attach Photos/Videos (Optional)
          </Text>
          
          {/* Add Media Button */}
          <TouchableOpacity 
            style={[styles.addMediaButton, darkMode && styles.addMediaButtonDark]}
            onPress={showMediaOptions}
          >
            <Icon name="add-a-photo" size={24} color={darkMode ? '#fff' : '#666'} />
            <Text style={[styles.addMediaText, darkMode && styles.textWhite]}>
              Add Photo or Video
            </Text>
            <Icon name="arrow-drop-down" size={24} color={darkMode ? '#fff' : '#666'} />
          </TouchableOpacity>

          {/* Media Preview */}
          {attachedMedia.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={[styles.mediaPreviewTitle, darkMode && styles.textWhite]}>
                Attached Files ({attachedMedia.length})
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                {attachedMedia.map((media) => (
                  <View key={media.id} style={[styles.mediaItem, darkMode && styles.mediaItemDark]}>
                    {media.type && media.type.startsWith('image') ? (
                      <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Icon name="videocam" size={32} color="#666" />
                        <Text style={styles.videoText}>Video</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.removeMediaButton}
                      onPress={() => removeMedia(media.id)}
                    >
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={[styles.mediaFileName, darkMode && styles.textWhite]} numberOfLines={1}>
                      {media.fileName}
                    </Text>
                    
                    {media.fileSize && (
                      <Text style={styles.mediaFileSize}>
                        {(media.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            darkMode && styles.submitButtonDark,
            (selectedIssues.length === 0 || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitReport}
          disabled={selectedIssues.length === 0 || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (selectedIssues.length === 0 || isSubmitting) && styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? 'Submitting...' : `Submit Report (${selectedIssues.length})`}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Enhanced Custom Media Selection Modal for Android */}
      <Modal
        visible={showMediaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={hideMediaModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                Add Media
              </Text>
              <Text style={[styles.modalSubtitle, darkMode && styles.textGray]}>
                Choose how you want to add media to your bug report
              </Text>
            </View>

            <View style={styles.modalOptions}>
              {enhancedMediaOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.modalOption, darkMode && styles.modalOptionDark]}
                  onPress={() => selectMediaOption(option.id)}
                >
                  <Icon name={option.icon} size={24} color={option.color} />
                  <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>
                    {option.title}
                  </Text>
                  <Icon name="chevron-right" size={20} color={darkMode ? '#666' : '#ccc'} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalCancelButton, darkMode && styles.modalCancelButtonDark]}
              onPress={hideMediaModal}
            >
              <Text style={[styles.modalCancelText, darkMode && styles.textWhite]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
  },
  textWhite: {
    color: '#fff',
  },
  textGray: {
    color: '#999',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  
  // Bug Report Styles
  issueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  issueButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  selectedIssue: {
    borderColor: '#4caf50',
    backgroundColor: '#f8fff8',
  },
  selectedIssueDark: {
    backgroundColor: '#2d4a2d',
  },
  issueButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  
  // Selected Counter Styles
  selectedCounter: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedCounterDark: {
    backgroundColor: '#1a3a52',
  },
  selectedCounterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
  },
  
  descriptionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 150,
  },
  descriptionInputDark: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDark: {
    backgroundColor: '#4caf50',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  
  // Media Attachment Styles
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addMediaButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  addMediaText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  mediaPreviewContainer: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  mediaScrollView: {
    flexDirection: 'row',
  },
  mediaItem: {
    width: 120,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 8,
    position: 'relative',
  },
  mediaItemDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  mediaPreview: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  videoPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaFileName: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  mediaFileSize: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOptions: {
    padding: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOptionDark: {
    backgroundColor: '#333',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  modalCancelButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonDark: {
    backgroundColor: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff4444',
  },
});