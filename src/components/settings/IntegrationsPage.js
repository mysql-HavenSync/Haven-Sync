import React, { useState, useEffect } from 'react';

import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSync, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Try to import AsyncStorage, fallback to a mock if not available
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('AsyncStorage not available, using fallback');
  // Mock AsyncStorage for development
  AsyncStorage = {
    getItem: async (key) => {
      console.log(`Mock AsyncStorage getItem: ${key}`);
      return 'mock-auth-token'; // Return a mock token
    },
    setItem: async (key, value) => {
      console.log(`Mock AsyncStorage setItem: ${key} = ${value}`);
    },
    removeItem: async (key) => {
      console.log(`Mock AsyncStorage removeItem: ${key}`);
    },
  };
}

const API_BASE_URL = 'https://haven-sync-production.up.railway.app/api'; // Fixed: Added /api prefix

export default function IntegrationsPage({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [lastSync, setLastSync] = useState({});

  const integrationsList = [
    {
      id: 'google',
      name: 'Google Assistant',
      description: 'Control your devices with voice commands',
      icon: 'assistant',
      color: '#4285f4',
      features: ['Voice Control', 'Routine Automation', 'Smart Displays'],
      oauthUrl: 'https://accounts.google.com/oauth/authorize'
    },
    {
      id: 'alexa',
      name: 'Amazon Alexa',
      description: 'Connect with Echo devices and skills',
      icon: 'mic',
      color: '#00d2d3',
      features: ['Echo Integration', 'Skills', 'Drop In'],
      oauthUrl: 'https://www.amazon.com/ap/oa'
    },
    {
      id: 'homekit',
      name: 'Apple HomeKit',
      description: 'Secure control through Apple devices',
      icon: 'home',
      color: '#007aff',
      features: ['Siri Control', 'Home App', 'Secure Video'],
      setupRequired: true
    },
    {
      id: 'smartthings',
      name: 'Samsung SmartThings',
      description: 'Integrate with SmartThings ecosystem',
      icon: 'devices',
      color: '#1c7cd6',
      features: ['Device Automation', 'Scenes', 'Energy Monitoring'],
      oauthUrl: 'https://account.smartthings.com/oauth/authorize'
    }
  ];

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
console.log('🔑 Available AsyncStorage keys:', allKeys);

const token = await AsyncStorage.getItem('token'); // ✅ Adjust key here
console.log('🛡️ Using token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/integrations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        console.log('Response not ok, status:', response.status);
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Integrations data:', data);
      
      if (data.success) {
        setIntegrations(data.integrations);
        
        // Extract last sync times
        const syncTimes = {};
        Object.keys(data.integrations).forEach(key => {
          if (data.integrations[key].lastSync) {
            syncTimes[key] = new Date(data.integrations[key].lastSync);
          }
        });
        setLastSync(syncTimes);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch integrations');
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      
      // For development, let's mock some data to test the UI
      console.log('Setting mock integrations data for development');
      setIntegrations({
        google: { connected: false, name: 'Google Assistant' },
        alexa: { connected: true, name: 'Amazon Alexa', lastSync: new Date().toISOString() },
        homekit: { connected: false, name: 'Apple HomeKit' },
        smartthings: { connected: false, name: 'Samsung SmartThings' }
      });
      
      setLastSync({
        alexa: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      });
      
      Alert.alert('Development Mode', 'Using mock data for testing. Check console for actual error details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleToggleIntegration = async (service) => {
    const integration = integrations[service];
    const isConnected = integration?.connected || false;
    
    if (isConnected) {
      // Disconnect
      Alert.alert(
        'Disconnect Service',
        `Are you sure you want to disconnect ${integration.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: () => performToggleIntegration(service, 'disconnect')
          }
        ]
      );
    } else {
      // Connect
      const serviceInfo = integrationsList.find(s => s.id === service);
      
      if (serviceInfo.setupRequired) {
        Alert.alert(
          'Setup Required',
          `${serviceInfo.name} requires manual setup. Would you like to proceed?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Setup',
              onPress: () => handleManualSetup(service)
            }
          ]
        );
      } else if (serviceInfo.oauthUrl) {
        Alert.alert(
          'Connect Service',
          `You'll be redirected to ${serviceInfo.name} to authorize the connection.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue',
              onPress: () => handleOAuthConnection(service)
            }
          ]
        );
      } else {
        performToggleIntegration(service, 'connect');
      }
    }
  };

  const handleOAuthConnection = async (service) => {
    try {
      const serviceInfo = integrationsList.find(s => s.id === service);
      const token = await AsyncStorage.getItem('token');
      
      // Create OAuth URL with callback
      const oauthUrl = `${API_BASE_URL}/integrations/${service}/oauth?redirect_uri=havensync://integration/success`;
      
      // Open OAuth URL
      const supported = await Linking.canOpenURL(oauthUrl);
      if (supported) {
        await Linking.openURL(oauthUrl);
      } else {
        Alert.alert('Error', 'Cannot open OAuth URL');
      }
    } catch (error) {
      console.error('OAuth connection error:', error);
      Alert.alert('Error', 'Failed to initiate OAuth connection');
    }
  };

  const handleManualSetup = (service) => {
    const serviceInfo = integrationsList.find(s => s.id === service);
    
    Alert.alert(
      `Setup ${serviceInfo.name}`,
      `To setup ${serviceInfo.name}:\n\n1. Open the ${serviceInfo.name} app\n2. Go to Home settings\n3. Add new bridge/hub\n4. Scan for devices\n5. Select your smart home hub\n\nOnce setup is complete, toggle the switch here to sync your devices.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as Connected',
          onPress: () => performToggleIntegration(service, 'connect')
        }
      ]
    );
  };

  const performToggleIntegration = async (service, action) => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`Performing ${action} for ${service}`);
      
      const response = await fetch(`${API_BASE_URL}/integrations/${service}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Toggle response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Toggle error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('Non-JSON toggle response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Toggle response data:', data);
      
      if (data.success) {
        // Update local state
        setIntegrations(prev => ({
          ...prev,
          [service]: {
            ...prev[service],
            connected: action === 'connect',
            lastSync: action === 'connect' ? new Date().toISOString() : null
          }
        }));

        if (action === 'connect') {
          setLastSync(prev => ({
            ...prev,
            [service]: new Date()
          }));
        } else {
          setLastSync(prev => {
            const newSync = { ...prev };
            delete newSync[service];
            return newSync;
          });
        }

        Alert.alert(
          'Success',
          `${integrationsList.find(s => s.id === service).name} ${action === 'connect' ? 'connected' : 'disconnected'} successfully`
        );
      } else {
        Alert.alert('Error', data.message || `Failed to ${action} integration`);
      }
    } catch (error) {
      console.error(`Error ${action}ing integration:`, error);
      
      // For development, simulate the action
      console.log(`Simulating ${action} for ${service}`);
      setIntegrations(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          connected: action === 'connect',
          lastSync: action === 'connect' ? new Date().toISOString() : null
        }
      }));

      if (action === 'connect') {
        setLastSync(prev => ({
          ...prev,
          [service]: new Date()
        }));
      } else {
        setLastSync(prev => {
          const newSync = { ...prev };
          delete newSync[service];
          return newSync;
        });
      }

      Alert.alert('Development Mode', `Simulated ${action} for ${integrationsList.find(s => s.id === service).name}. Check console for actual error details.`);
    }
  };

  const handleSync = async (service) => {
    setSyncing(prev => ({ ...prev, [service]: true }));
    
    try {
      const token = await AsyncStorage.getItem('token');
      console.log(`Syncing ${service}`);
      
      const response = await fetch(`${API_BASE_URL}/integrations/${service}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Sync response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Sync error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('Non-JSON sync response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('Sync response data:', data);
      
      if (data.success) {
        setLastSync(prev => ({
          ...prev,
          [service]: new Date()
        }));
        Alert.alert('Success', `${integrationsList.find(s => s.id === service).name} synced successfully`);
      } else {
        Alert.alert('Error', data.message || 'Failed to sync integration');
      }
    } catch (error) {
      console.error('Error syncing integration:', error);
      
      // For development, simulate sync
      console.log(`Simulating sync for ${service}`);
      setLastSync(prev => ({
        ...prev,
        [service]: new Date()
      }));
      Alert.alert('Development Mode', `Simulated sync for ${integrationsList.find(s => s.id === service).name}. Check console for actual error details.`);
    } finally {
      setSyncing(prev => ({ ...prev, [service]: false }));
    }
  };

  const handleOpenExternal = (service) => {
    const serviceInfo = integrationsList.find(s => s.id === service);
    const urls = {
      google: 'https://assistant.google.com/services/a/uid/000000f5c61c994e',
      alexa: 'https://alexa.amazon.com/spa/index.html',
      homekit: 'https://support.apple.com/en-us/HT204893',
      smartthings: 'https://smartthings.samsung.com/'
    };
    
    const url = urls[service];
    if (url) {
      Linking.openURL(url);
    }
  };

  const formatLastSync = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: darkMode ? '#333' : '#e0e0e0',
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: darkMode ? '#ffffff' : '#000000',
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: darkMode ? '#ffffff' : '#666666',
    },
    integrationCard: {
      backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    integrationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    integrationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    integrationInfo: {
      flex: 1,
    },
    integrationName: {
      fontSize: 18,
      fontWeight: '600',
      color: darkMode ? '#ffffff' : '#000000',
      marginBottom: 4,
    },
    integrationDescription: {
      fontSize: 14,
      color: darkMode ? '#cccccc' : '#666666',
    },
    integrationToggle: {
      marginLeft: 12,
    },
    integrationBody: {
      marginTop: 12,
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    featureTag: {
      backgroundColor: darkMode ? '#3a3a3a' : '#f0f0f0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginBottom: 4,
    },
    featureText: {
      fontSize: 12,
      color: darkMode ? '#cccccc' : '#666666',
    },
    integrationActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: darkMode ? '#333' : '#e0e0e0',
    },
    syncInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    syncText: {
      fontSize: 12,
      color: darkMode ? '#cccccc' : '#666666',
      marginLeft: 8,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      borderRadius: 20,
      marginLeft: 8,
      backgroundColor: darkMode ? '#3a3a3a' : '#f0f0f0',
    },
    disabledCard: {
      opacity: 0.6,
    },
    connectedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#4CAF50',
      marginRight: 8,
    },
    disconnectedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#f44336',
      marginRight: 8,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <FontAwesomeIcon 
              icon={faArrowLeft} 
              size={24} 
              color={darkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Integrations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading integrations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesomeIcon 
            icon={faArrowLeft} 
            size={24} 
            color={darkMode ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {integrationsList.map((service) => {
          const integration = integrations[service.id] || {};
          const isConnected = integration.connected || false;
          const isSyncing = syncing[service.id] || false;
          
          return (
            <View 
              key={service.id} 
              style={[
                styles.integrationCard,
                !isConnected && styles.disabledCard
              ]}
            >
              <View style={styles.integrationHeader}>
                <View style={[styles.integrationIcon, { backgroundColor: service.color }]}>
                  <Icon name={service.icon} size={20} color="#ffffff" />
                </View>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>{service.name}</Text>
                  <Text style={styles.integrationDescription}>
                    {service.description}
                  </Text>
                </View>
                <Switch
                  style={styles.integrationToggle}
                  value={isConnected}
                  onValueChange={() => handleToggleIntegration(service.id)}
                  trackColor={{ false: '#767577', true: service.color }}
                  thumbColor={isConnected ? '#ffffff' : '#f4f3f4'}
                />
              </View>
              
              {isConnected && (
                <View style={styles.integrationBody}>
                  <View style={styles.featuresContainer}>
                    {service.features.map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.integrationActions}>
                    <View style={styles.syncInfo}>
                      <View style={isConnected ? styles.connectedIndicator : styles.disconnectedIndicator} />
                      <Text style={styles.syncText}>
                        Last sync: {formatLastSync(lastSync[service.id])}
                      </Text>
                    </View>
                    
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSync(service.id)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                          <FontAwesomeIcon 
                            icon={faSync} 
                            size={16} 
                            color={darkMode ? '#ffffff' : '#000000'} 
                          />
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOpenExternal(service.id)}
                      >
                        <FontAwesomeIcon 
                          icon={faExternalLinkAlt} 
                          size={16} 
                          color={darkMode ? '#ffffff' : '#000000'} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}