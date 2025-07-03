import React, { useState } from 'react';
import {
  View, StyleSheet, Text, TouchableOpacity, ScrollView, SafeAreaView,
  TextInput, Alert, Linking, Platform, Modal, ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faStar } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import api from '../../api';

export default function FeedbackPage({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => onBack ? onBack() : navigation?.goBack();

  const handleRateApp = async () => {
    try {
      const isIOS = Platform.OS === 'ios';
      const url = isIOS ? 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review' 
                        : 'market://details?id=com.yourcompany.yourapp';
      
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        const fallback = isIOS ? url : 'https://play.google.com/store/apps/details?id=com.yourcompany.yourapp';
        await Linking.openURL(fallback);
      }
    } catch {
      Alert.alert('Error', 'Failed to open app store');
    }
  };

  const handleMediaSelection = (type) => {
    setShowMediaModal(false);
    const config = { mediaType: type === 'gallery' ? 'mixed' : type, quality: 0.8 };
    const launcher = type === 'gallery' ? launchImageLibrary : launchCamera;
    
    launcher(config, (response) => {
      if (response.assets?.[0]) {
        setAttachments([...attachments, response.assets[0]]);
      }
    });
  };

  const openEmail = (type) => {
    const emails = {
      feature: 'feature@hexahavenintegrations.com',
      support: 'support@hexahavenintegrations.com',
      feedback: 'feedback@hexahavenintegrations.com'
    };
    
    const subjects = {
      feature: 'Feature Suggestion',
      support: 'Support Request',
      feedback: 'App Feedback'
    };
    
    const bodies = {
      feature: `Hi Team,\n\nI would like to suggest a new feature:\n\n[Please describe your feature suggestion here]\n\nRegards`,
      support: `Hi Support Team,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nDevice Information:\n- Platform: ${Platform.OS}\n- Version: ${Platform.Version}\n\nRegards`,
      feedback: `${rating > 0 ? `Rating: ${rating}/5 stars\n\n` : ''}Feedback:\n${feedback}`
    };
    
    const mailto = `mailto:${emails[type]}?subject=${encodeURIComponent(subjects[type])}&body=${encodeURIComponent(bodies[type])}`;
    
    Linking.openURL(mailto).catch(() => Alert.alert('Error', 'Unable to open email client'));
  };

  const submitFeedbackToAPI = async () => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/feedback', {
        rating, feedback, timestamp: new Date().toISOString(),
        platform: Platform.OS, version: Platform.Version,
        hasAttachments: attachments.length > 0, attachmentCount: attachments.length,
      });

      if ([200, 201].includes(response.status)) {
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
        setFeedback(''); setRating(0); setAttachments([]);
        return true;
      }
      throw new Error('Failed to submit feedback');
    } catch (error) {
      const isNetworkError = error.message === 'Network Error' || !error.response;
      Alert.alert(
        isNetworkError ? 'Network Error' : 'Submission Failed',
        isNetworkError 
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : 'Unable to submit feedback at this time. Please try again later or use the email option.'
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }

    Alert.alert('Submit Feedback', 'How would you like to submit your feedback?', [
      {
        text: 'Email',
        onPress: () => {
          openEmail('feedback');
          setFeedback(''); setRating(0); setAttachments([]);
        }
      },
      {
        text: 'Submit Directly',
        onPress: async () => {
          const success = await submitFeedbackToAPI();
          if (!success) {
            Alert.alert('Try Email Instead?', 'Would you like to send your feedback via email?', [
              { text: 'Send Email', onPress: () => openEmail('feedback') },
              { text: 'Cancel', style: 'cancel' }
            ]);
          }
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const ActionButton = ({ icon, text, onPress, bgColor }) => (
    <TouchableOpacity style={[styles.actionButton, darkMode && styles.actionButtonDark]} onPress={onPress}>
      <View style={[styles.actionIconContainer, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={24} color={icon === 'star-rate' ? '#FFD700' : icon === 'lightbulb-outline' ? '#4caf50' : '#2196f3'} />
      </View>
      <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>{text}</Text>
      <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
    </TouchableOpacity>
  );

  const ModalOption = ({ icon, text, onPress, bgColor }) => (
    <TouchableOpacity style={[styles.modalOption, darkMode && styles.modalOptionDark]} onPress={onPress}>
      <View style={[styles.modalIconContainer, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={24} color={icon === 'photo-camera' ? '#4caf50' : icon === 'videocam' ? '#ff9800' : '#2196f3'} />
      </View>
      <Text style={[styles.modalOptionText, darkMode && styles.textWhite]}>{text}</Text>
      <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={darkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={[styles.feedbackIconContainer, darkMode && styles.feedbackIconContainerDark]}>
            <Icon name="feedback" size={20} color="#4fc3f7" />
          </View>
          <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>Feedback</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.actionSection}>
          <ActionButton icon="star-rate" text="Rate App" onPress={handleRateApp} bgColor="#fff3e0" />
          <ActionButton icon="lightbulb-outline" text="Suggest Feature" onPress={() => openEmail('feature')} bgColor="#e8f5e8" />
          <ActionButton icon="help-outline" text="Contact Support" onPress={() => openEmail('support')} bgColor="#e3f2fd" />
        </View>

        <View style={styles.feedbackSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>Send us your feedback</Text>
          
          <View style={styles.ratingContainer}>
            <Text style={[styles.ratingLabel, darkMode && styles.textWhite]}>Rate your experience:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
                  <FontAwesomeIcon icon={faStar} size={30} color={star <= rating ? '#FFD700' : '#ccc'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={[styles.feedbackInput, darkMode && styles.feedbackInputDark]}
            placeholder="Tell us what you think..."
            placeholderTextColor={darkMode ? '#888' : '#999'}
            value={feedback} onChangeText={setFeedback}
            multiline numberOfLines={6} textAlignVertical="top"
            editable={!isSubmitting}
          />

          <TouchableOpacity 
            style={[styles.attachmentButton, darkMode && styles.attachmentButtonDark]}
            onPress={() => setShowMediaModal(true)} disabled={isSubmitting}
          >
            <Icon name="photo-camera" size={20} color={darkMode ? '#4caf50' : '#666'} />
            <Text style={[styles.attachmentButtonText, darkMode && styles.textWhite]}>Add Photo or Video</Text>
            <Icon name="keyboard-arrow-down" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>

          {attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment, index) => (
                <View key={index} style={[styles.attachmentItem, darkMode && styles.attachmentItemDark]}>
                  <Icon name="attachment" size={16} color={darkMode ? '#888' : '#666'} />
                  <Text style={[styles.attachmentName, darkMode && styles.textWhite]} numberOfLines={1}>
                    {attachment.fileName || `Attachment ${index + 1}`}
                  </Text>
                  <TouchableOpacity onPress={() => setAttachments(attachments.filter((_, i) => i !== index))} disabled={isSubmitting}>
                    <Icon name="close" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.submitButton, darkMode && styles.submitButtonDark, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitFeedback} disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={showMediaModal} onRequestClose={() => setShowMediaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Add Media</Text>
            <Text style={[styles.modalSubtitle, darkMode && styles.textGray]}>Choose how you want to add media to your feedback</Text>

            <ModalOption icon="photo-camera" text="Take Photo" onPress={() => handleMediaSelection('photo')} bgColor="#e8f5e8" />
            <ModalOption icon="videocam" text="Record Video" onPress={() => handleMediaSelection('video')} bgColor="#fff3e0" />
            <ModalOption icon="photo-library" text="Choose from Gallery" onPress={() => handleMediaSelection('gallery')} bgColor="#e3f2fd" />
            <ModalOption icon="cloud-upload" text="Open Google Photos" onPress={() => handleMediaSelection('gallery')} bgColor="#e3f2fd" />

            <TouchableOpacity style={[styles.cancelButton, darkMode && styles.cancelButtonDark]} onPress={() => setShowMediaModal(false)}>
              <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#1e1e1e' },
  textWhite: { color: '#fff' },
  textGray: { color: '#999' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerDark: { borderBottomColor: '#333' },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  feedbackIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e1f5fe', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  feedbackIconContainerDark: { backgroundColor: '#263238' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  placeholder: { width: 40 },
  
  content: { flex: 1, padding: 20 },
  actionSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  actionButtonDark: { backgroundColor: '#333', borderColor: '#444' },
  actionIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionButtonText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
  
  feedbackSection: { marginBottom: 30 },
  ratingContainer: { marginBottom: 20 },
  ratingLabel: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 10 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  starButton: { padding: 5, marginHorizontal: 5 },
  feedbackInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 16, fontSize: 16, color: '#333', minHeight: 120, marginBottom: 15 },
  feedbackInputDark: { backgroundColor: '#333', borderColor: '#444', color: '#fff' },
  
  attachmentButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e0e0e0' },
  attachmentButtonDark: { backgroundColor: '#333', borderColor: '#444' },
  attachmentButtonText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333', marginLeft: 12 },
  attachmentsContainer: { marginBottom: 15 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, borderRadius: 6, marginBottom: 5 },
  attachmentItemDark: { backgroundColor: '#444' },
  attachmentName: { flex: 1, fontSize: 12, color: '#666', marginLeft: 8, marginRight: 8 },
  
  submitButton: { backgroundColor: '#4caf50', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonDark: { backgroundColor: '#4caf50' },
  submitButtonDisabled: { backgroundColor: '#999', opacity: 0.7 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalContentDark: { backgroundColor: '#2e2e2e' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  modalOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  modalOptionDark: { backgroundColor: '#404040', borderColor: '#555' },
  modalIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modalOptionText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
  cancelButton: { backgroundColor: '#f0f0f0', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonDark: { backgroundColor: '#404040' },
  cancelButtonText: { color: '#ff4444', fontSize: 16, fontWeight: '500' },
});