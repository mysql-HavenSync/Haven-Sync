import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function IntegrationsPage({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const [integrations, setIntegrations] = useState({
    google: { connected: false, name: 'Google Assistant' },
    alexa: { connected: true, name: 'Amazon Alexa' },
    homekit: { connected: false, name: 'Apple HomeKit' },
    smartthings: { connected: true, name: 'Samsung SmartThings' },
  });

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleToggleIntegration = (service) => {
    const isConnected = integrations[service].connected;
    
    if (isConnected) {
      Alert.alert(
        'Disconnect Service',
        `Are you sure you want to disconnect ${integrations[service].name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: () => {
              setIntegrations(prev => ({
                ...prev,
                [service]: { ...prev[service], connected: false }
              }));
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Connect Service',
        `Connect to ${integrations[service].name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Connect',
            onPress: () => {
              setIntegrations(prev => ({
                ...prev,
                [service]: { ...prev[service], connected: true }
              }));
            }
          }
        ]
      );
    }
  };

  const integrationsList = [
    {
      id: 'google',
      name: 'Google Assistant',
      description: 'Control your devices with voice commands',
      icon: 'assistant',
      color: '#4285f4',
      features: ['Voice Control', 'Routine Automation', 'Smart Displays']
    },
    {
      id: 'alexa',
      name: 'Amazon Alexa',
      description: 'Connect with Echo devices and skills',
      icon: 'mic',
      color: '#00d2d3',
      features: ['Echo Integration', 'Skills', 'Drop In']
    },
    {
      id: 'homekit',
      name: 'Apple HomeKit',
      description: 'Secure control through Apple devices',
      icon: 'home',
      color: '#007aff',
      features: ['Siri Control', 'Home App', 'Secure Video']
    },
    {
      id: 'smartthings',
      name: 'Samsung SmartThings',
      description: 'Integrate with SmartThings ecosystem',
      icon: 'devices',
      color: '#1c7cd6',
      features: ['Device Automation', 'Scenes', 'Energy Monitoring']
    }
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
          Third Party Integrations
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.subtitle, darkMode && styles.textGray]}>
          Connect with your favorite smart home platforms
        </Text>

        {integrationsList.map((integration) => (
          <View 
            key={integration.id} 
            style={[styles.integrationCard, darkMode && styles.integrationCardDark]}
          >
            <View style={styles.integrationHeader}>
              <View style={styles.integrationInfo}>
                <View style={[styles.integrationIcon, { backgroundColor: integration.color }]}>
                  <Icon name={integration.icon} size={24} color="#fff" />
                </View>
                <View style={styles.integrationDetails}>
                  <Text style={[styles.integrationName, darkMode && styles.textWhite]}>
                    {integration.name}
                  </Text>
                  <Text style={[styles.integrationDescription, darkMode && styles.textGray]}>
                    {integration.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={integrations[integration.id].connected}
                onValueChange={() => handleToggleIntegration(integration.id)}
                trackColor={{ false: '#ccc', true: integration.color }}
                thumbColor={integrations[integration.id].connected ? '#fff' : '#f4f3f4'}
              />
            </View>

            {integrations[integration.id].connected && (
              <View style={styles.featuresSection}>
                <Text style={[styles.featuresTitle, darkMode && styles.textWhite]}>
                  Available Features:
                </Text>
                <View style={styles.featuresContainer}>
                  {integration.features.map((feature, index) => (
                    <View key={index} style={[styles.featureTag, darkMode && styles.featureTagDark]}>
                      <Text style={[styles.featureText, darkMode && styles.textWhite]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        {/* Connection Status Summary */}
        <View style={[styles.summaryCard, darkMode && styles.summaryCardDark]}>
          <Text style={[styles.summaryTitle, darkMode && styles.textWhite]}>
            Integration Status
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, darkMode && styles.textWhite]}>
                {Object.values(integrations).filter(i => i.connected).length}
              </Text>
              <Text style={[styles.statLabel, darkMode && styles.textGray]}>
                Connected
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, darkMode && styles.textWhite]}>
                {Object.values(integrations).filter(i => !i.connected).length}
              </Text>
              <Text style={[styles.statLabel, darkMode && styles.textGray]}>
                Available
              </Text>
            </View>
          </View>
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
  
  // Integrations Styles
  integrationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  integrationCardDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  integrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  integrationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationDetails: {
    flex: 1,
  },
  integrationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  integrationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  featuresSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  featureTagDark: {
    backgroundColor: '#555',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryCardDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});