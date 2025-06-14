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
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function FeedbackPage({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleRateApp = async () => {
    try {
      let url;
      if (Platform.OS === 'ios') {
        // Replace YOUR_APP_ID with your actual App Store ID
        // This URL directly opens the rating dialog
        url = 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review';
      } else {
        // For Android, this opens the app page with rating section highlighted
        // Replace com.yourcompany.yourapp with your actual package name
        url = 'market://details?id=com.yourcompany.yourapp';
      }
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web version if native app store is not available
        let fallbackUrl;
        if (Platform.OS === 'ios') {
          fallbackUrl = 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review';
        } else {
          fallbackUrl = 'https://play.google.com/store/apps/details?id=com.yourcompany.yourapp';
        }
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open app store');
    }
  };

  const selectAttachment = () => {
    setShowMediaModal(true);
  };

  const handleTakePhoto = () => {
    setShowMediaModal(false);
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setAttachments([...attachments, response.assets[0]]);
        }
      }
    );
  };

  const handleRecordVideo = () => {
    setShowMediaModal(false);
    launchCamera(
      {
        mediaType: 'video',
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setAttachments([...attachments, response.assets[0]]);
        }
      }
    );
  };

  const handleChooseFromGallery = () => {
    setShowMediaModal(false);
    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setAttachments([...attachments, response.assets[0]]);
        }
      }
    );
  };

  const handleOpenGooglePhotos = () => {
    setShowMediaModal(false);
    // This would require Google Photos integration or fallback to gallery
    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.8,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          setAttachments([...attachments, response.assets[0]]);
        }
      }
    );
  };

  const handleSuggestFeature = () => {
    const subject = 'Feature Suggestion';
    const body = `Hi Team,

I would like to suggest a new feature:

[Please describe your feature suggestion here]

Regards`;
    
    const mailto = `mailto:feature@hexahavenintegrations.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleContactSupport = () => {
    const subject = 'Support Request';
    const body = `Hi Support Team,

I need assistance with:

[Please describe your issue here]

Device Information:
- Platform: ${Platform.OS}
- Version: ${Platform.Version}

Regards`;
    
    const mailto = `mailto:support@hexahavenintegrations.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      // You can also send this feedback via email or API
      const subject = 'App Feedback';
      const ratingText = rating > 0 ? `Rating: ${rating}/5 stars\n\n` : '';
      const body = `${ratingText}Feedback:\n${feedback}`;
      
      const mailto = `mailto:support@hexahavenintegrations.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      Alert.alert(
        'Submit Feedback',
        'How would you like to submit your feedback?',
        [
          {
            text: 'Email',
            onPress: () => {
              Linking.openURL(mailto).catch(() => {
                Alert.alert('Error', 'Unable to open email client');
              });
            },
          },
          {
            text: 'Submit Directly',
            onPress: () => {
              Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
              setFeedback('');
              setRating(0);
              setAttachments([]);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
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
        <View style={styles.headerTitleContainer}>
          <View style={[styles.feedbackIconContainer, darkMode && styles.feedbackIconContainerDark]}>
            <Icon name="feedback" size={20} color="#4fc3f7" />
          </View>
          <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>
            Feedback
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, darkMode && styles.actionButtonDark]}
            onPress={handleRateApp}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#fff3e0' }]}>
              <Icon name="star-rate" size={24} color="#FFD700" />
            </View>
            <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>
              Rate App
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, darkMode && styles.actionButtonDark]}
            onPress={handleSuggestFeature}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#e8f5e8' }]}>
              <Icon name="lightbulb-outline" size={24} color="#4caf50" />
            </View>
            <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>
              Suggest Feature
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, darkMode && styles.actionButtonDark]}
            onPress={handleContactSupport}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Icon name="help-outline" size={24} color="#2196f3" />
            </View>
            <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>
              Contact Support
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>
        </View>

        {/* Feedback Form */}
        <View style={styles.feedbackSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            Send us your feedback
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={[styles.ratingLabel, darkMode && styles.textWhite]}>
              Rate your experience:
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    size={30}
                    color={star <= rating ? '#FFD700' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feedback Text */}
          <TextInput
            style={[styles.feedbackInput, darkMode && styles.feedbackInputDark]}
            placeholder="Tell us what you think..."
            placeholderTextColor={darkMode ? '#888' : '#999'}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          {/* Attachments */}
          <TouchableOpacity 
            style={[styles.attachmentButton, darkMode && styles.attachmentButtonDark]}
            onPress={selectAttachment}
          >
            <Icon name="photo-camera" size={20} color={darkMode ? '#4caf50' : '#666'} />
            <Text style={[styles.attachmentButtonText, darkMode && styles.textWhite]}>
              Add Photo or Video
            </Text>
            <Icon name="keyboard-arrow-down" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>

          {/* Display Attachments */}
          {attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment, index) => (
                <View key={index} style={[styles.attachmentItem, darkMode && styles.attachmentItemDark]}>
                  <Icon name="attachment" size={16} color={darkMode ? '#888' : '#666'} />
                  <Text style={[styles.attachmentName, darkMode && styles.textWhite]} numberOfLines={1}>
                    {attachment.fileName || `Attachment ${index + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => removeAttachment(index)}>
                    <Icon name="close" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, darkMode && styles.submitButtonDark]}
            onPress={handleSubmitFeedback}
          >
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Media Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMediaModal}
        onRequestClose={() => setShowMediaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
              Add Media
            </Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.textGray]}>
              Choose how you want to add media to your bug report
            </Text>

            <TouchableOpacity 
              style={[styles.modalOption, darkMode && styles.modalOptionDark]}
              onPress={handleTakePhoto}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: '#e8f5e8' }]}>
                <Icon name="photo-camera" size={24} color="#4caf50" />
              </View>
              <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>
                Take Photo
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, darkMode && styles.modalOptionDark]}
              onPress={handleRecordVideo}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: '#fff3e0' }]}>
                <Icon name="videocam" size={24} color="#ff9800" />
              </View>
              <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>
                Record Video
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, darkMode && styles.modalOptionDark]}
              onPress={handleChooseFromGallery}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="photo-library" size={24} color="#2196f3" />
              </View>
              <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>
                Choose from Gallery
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalOption, darkMode && styles.modalOptionDark]}
              onPress={handleOpenGooglePhotos}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="cloud-upload" size={24} color="#2196f3" />
              </View>
              <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>
                Open Google Photos
              </Text>
              <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.cancelButton, darkMode && styles.cancelButtonDark]}
              onPress={() => setShowMediaModal(false)}
            >
              <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e1f5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  feedbackIconContainerDark: {
    backgroundColor: '#263238',
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Action Button Styles
  actionSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  
  // Feedback Styles
  feedbackSection: {
    marginBottom: 30,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
    marginHorizontal: 5,
  },
  feedbackInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    marginBottom: 15,
  },
  feedbackInputDark: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  
  // Attachment Styles
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attachmentButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  attachmentButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  attachmentsContainer: {
    marginBottom: 15,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
  },
  attachmentItemDark: {
    backgroundColor: '#444',
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
  },
  
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDark: {
    backgroundColor: '#4caf50',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalContentDark: {
    backgroundColor: '#2e2e2e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalOptionDark: {
    backgroundColor: '#404040',
    borderColor: '#555',
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonDark: {
    backgroundColor: '#404040',
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '500',
  },
});