import React from 'react';
import DeviceInfo from 'react-native-device-info';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function AboutPage({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'This will open the privacy policy document.');
    // Linking.openURL('https://hexatech.com/privacy-policy');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'This will open the terms of service document.');
    // Linking.openURL('https://hexatech.com/terms-of-service');
  };
const version = DeviceInfo.getVersion();       // e.g., "1.0.1"
const buildNumber = DeviceInfo.getBuildNumber(); // e.g., "3"

  const appInfo = [
  { label: 'Version', value: `${version} (${buildNumber})` },
  { label: 'Developer', value: 'Hexahaven Integrations' },
];


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
          About
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* App Logo/Info */}
        <View style={styles.appSection}>
          <View style={[styles.appLogoContainer, darkMode && styles.appLogoContainerDark]}>
            <Image 
              source={require('../../assets/images/logo.png')}
              style={styles.appLogoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, darkMode && styles.textWhite]}>
            HavenSync
          </Text>
          <Text style={[styles.appTagline, darkMode && styles.textGray]}>
            Smart Living Starts Here
          </Text>
        </View>

        {/* App Information */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            App Information
          </Text>
          {appInfo.map((info, index) => (
            <View key={index} style={[styles.infoRow, darkMode && styles.infoRowDark]}>
              <Text style={[styles.infoLabel, darkMode && styles.textWhite]}>
                {info.label}:
              </Text>
              <Text style={[styles.infoValue, darkMode && styles.textGray]}>
                {info.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity 
            style={[styles.legalButton, darkMode && styles.legalButtonDark]}
            onPress={handlePrivacyPolicy}
          >
            <Icon name="security" size={24} color={darkMode ? '#4caf50' : '#333'} />
            <Text style={[styles.legalButtonText, darkMode && styles.textWhite]}>
              Privacy Policy
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.legalButton, darkMode && styles.legalButtonDark]}
            onPress={handleTermsOfService}
          >
            <Icon name="description" size={24} color={darkMode ? '#4caf50' : '#333'} />
            <Text style={[styles.legalButtonText, darkMode && styles.textWhite]}>
              Terms of Service
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={[styles.copyrightText, darkMode && styles.textGray]}>
            © 2025 Hexahaven Integrations. All rights reserved.
          </Text>
          <Text style={[styles.copyrightText, darkMode && styles.textGray]}>
            Made with ❤️ from Hexahaven Integrations
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Shared Styles for all components
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // About Page Styles
  appSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  appLogoContainer: {
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogoContainerDark: {
    // No background color needed
  },
  appLogoImage: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRowDark: {
    borderBottomColor: '#444',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  legalSection: {
    marginBottom: 30,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  legalButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  legalButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});