import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMoon,
  faUsers,
  faCommentDots,
  faBug,
  faInfoCircle,
  faSignOutAlt,
  faPlug,
  faChevronRight,
  faChevronDown,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { toggleDarkMode } from '../redux/slices/profileSlice';
import { CommonActions } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function HexaSettings({ navigation, onClose }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const dispatch = useDispatch();
  const [expandedOption, setExpandedOption] = useState(null);

  const handleClose = () => {
    // If onClose prop is provided, use it
    if (onClose) {
      onClose();
    }
    // If navigation is available, navigate back to dashboard
    else if (navigation) {
      navigation.goBack(); // or navigation.navigate('Dashboard')
    }
  };

  // Navigation handler for sub-pages
  const handleNavigateToPage = (pageName) => {
    if (navigation) {
      navigation.navigate(pageName);
    } else {
      Alert.alert('Navigation Error', 'Navigation prop not available');
    }
  };

  // Enhanced logout function with proper navigation reset
  const handleLogout = async () => {
    try {
      console.log('Starting logout process...');

      // Method 1: Clear Redux state (uncomment if you have auth actions)
      // dispatch({ type: 'AUTH_LOGOUT' });
      // dispatch(clearUserData());

      // Method 2: Reset navigation to login screen using CommonActions
      if (navigation) {
        console.log('Resetting navigation to HexaLoginScreen...');
        
        // Get the root navigation (this ensures we reset from the very top)
        const rootNavigation = navigation.getParent() || navigation;
        
        // Reset the entire navigation stack to MainStack with HexaLoginScreen
        rootNavigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'MainStack',
                state: {
                  routes: [{ name: 'HexaLoginScreen' }],
                  index: 0,
                },
              },
            ],
          })
        );
      } else {
        Alert.alert('Logged Out', 'You have been logged out successfully.');
      }

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleSettingsOption = (option) => {
    switch (option) {
      case 'darkMode':
        dispatch(toggleDarkMode());
        break;
      case 'multipleUsers':
        // Navigate directly to UserManagement page
        handleNavigateToPage('UserManagement');
        break;
      case 'feedback':
        // Navigate directly to FeedbackPage
        handleNavigateToPage('FeedbackPage');
        break;
      case 'bugReport':
        // Navigate directly to BugReport page
        handleNavigateToPage('BugReport');
        break;
      case 'about':
        // Navigate directly to AboutPage
        handleNavigateToPage('AboutPage');
        break;
      case 'logout':
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Logout', 
              style: 'destructive', 
              onPress: handleLogout
            }
          ]
        );
        break;
      case 'integrations':
        // Navigate directly to IntegrationsPage
        handleNavigateToPage('IntegrationsPage');
        break;
    }
  };

  // Enhanced color scheme for icons
  const getIconColors = (optionId, isDestructive = false) => {
    if (isDestructive) {
      return {
        iconColor: '#FF4757',
        backgroundColor: darkMode ? 'rgba(255, 71, 87, 0.15)' : 'rgba(255, 71, 87, 0.1)',
        gradientColors: ['rgba(255, 71, 87, 0.2)', 'rgba(255, 71, 87, 0.05)']
      };
    }

    const colorMap = {
      darkMode: {
        iconColor: darkMode ? '#FFD93D' : '#4A90E2',
        backgroundColor: darkMode ? 'rgba(255, 217, 61, 0.15)' : 'rgba(74, 144, 226, 0.1)',
      },
      multipleUsers: {
        iconColor: darkMode ? '#6C5CE7' : '#5A67D8',
        backgroundColor: darkMode ? 'rgba(108, 92, 231, 0.15)' : 'rgba(90, 103, 216, 0.1)',
      },
      feedback: {
        iconColor: darkMode ? '#00CEC9' : '#38B2AC',
        backgroundColor: darkMode ? 'rgba(0, 206, 201, 0.15)' : 'rgba(56, 178, 172, 0.1)',
      },
      bugReport: {
        iconColor: darkMode ? '#FF7675' : '#E53E3E',
        backgroundColor: darkMode ? 'rgba(255, 118, 117, 0.15)' : 'rgba(229, 62, 62, 0.1)',
      },
      about: {
        iconColor: darkMode ? '#74B9FF' : '#3182CE',
        backgroundColor: darkMode ? 'rgba(116, 185, 255, 0.15)' : 'rgba(49, 130, 206, 0.1)',
      },
      integrations: {
        iconColor: darkMode ? '#A29BFE' : '#805AD5',
        backgroundColor: darkMode ? 'rgba(162, 155, 254, 0.15)' : 'rgba(128, 90, 213, 0.1)',
      },
      logout: {
        iconColor: '#FF4757',
        backgroundColor: darkMode ? 'rgba(255, 71, 87, 0.15)' : 'rgba(255, 71, 87, 0.1)',
      }
    };

    return colorMap[optionId] || {
      iconColor: darkMode ? '#81C784' : '#4CAF50',
      backgroundColor: darkMode ? 'rgba(129, 199, 132, 0.15)' : 'rgba(76, 175, 80, 0.1)',
    };
  };

  const settingsOptions = [
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: faMoon,
      hasSwitch: true,
      value: darkMode
    },
    {
      id: 'multipleUsers',
      title: 'Multiple Users Access',
      icon: faUsers,
      hasSwitch: false,
      navigateDirectly: true
    },
    {
      id: 'feedback',
      title: 'Feedback',
      icon: faCommentDots,
      hasSwitch: false,
      navigateDirectly: true
    },
    {
      id: 'bugReport',
      title: 'Bug Error Report',
      icon: faBug,
      hasSwitch: false,
      navigateDirectly: true
    },
    {
      id: 'about',
      title: 'About',
      icon: faInfoCircle,
      hasSwitch: false,
      navigateDirectly: true
    },
    {
      id: 'integrations',
      title: 'Third Party Integrations',
      icon: faPlug,
      hasSwitch: false,
      subtitle: 'Google, Alexa, Apple, Samsung',
      navigateDirectly: true
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: faSignOutAlt,
      hasSwitch: false,
      isDestructive: true
    }
  ];

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Settings Header with Close Button */}
      <View style={[styles.settingsHeader, darkMode && styles.settingsHeaderDark]}>
        <Text style={[styles.settingsTitle, darkMode && styles.textWhite]}>
          Settings
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, darkMode && styles.closeButtonDark]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <FontAwesomeIcon 
            icon={faTimes} 
            size={20} 
            color={darkMode ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
      </View>

      {/* Settings Options */}
      <ScrollView style={styles.settingsContent} showsVerticalScrollIndicator={false}>
        {settingsOptions.map((option, index) => {
          const iconColors = getIconColors(option.id, option.isDestructive);
          
          return (
            <React.Fragment key={option.id}>
              <TouchableOpacity
                style={[
                  styles.settingsOption,
                  darkMode && styles.settingsOptionDark,
                  index === settingsOptions.length - 1 && styles.lastOption
                ]}
                onPress={() => handleSettingsOption(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIconContainer,
                    {
                      backgroundColor: iconColors.backgroundColor,
                      borderWidth: 1,
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      shadowColor: iconColors.iconColor,
                      shadowOffset: {
                        width: 0,
                        height: 2,
                      },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3,
                    }
                  ]}>
                    <FontAwesomeIcon 
                      icon={option.icon} 
                      size={18} 
                      color={iconColors.iconColor}
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={[
                      styles.optionTitle,
                      darkMode && styles.textWhite,
                      option.isDestructive && styles.destructiveText
                    ]}>
                      {option.title}
                    </Text>
                    {option.subtitle && (
                      <Text style={[styles.optionSubtitle, darkMode && styles.optionSubtitleDark]}>
                        {option.subtitle}
                      </Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.optionRight}>
                  {option.hasSwitch ? (
                    <Switch
                      value={option.value}
                      onValueChange={() => handleSettingsOption(option.id)}
                      trackColor={{ 
                        false: darkMode ? '#444' : '#ccc', 
                        true: iconColors.iconColor 
                      }}
                      thumbColor={option.value ? '#fff' : (darkMode ? '#666' : '#f4f3f4')}
                      ios_backgroundColor={darkMode ? '#444' : '#ccc'}
                    />
                  ) : option.navigateDirectly ? (
                    // Enhanced arrow with color
                    <View style={[
                      styles.arrowContainer,
                      { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
                    ]}>
                      <FontAwesomeIcon 
                        icon={faChevronRight} 
                        size={12} 
                        color={darkMode ? '#888' : '#ccc'} 
                      />
                    </View>
                  ) : (
                    <View style={[
                      styles.arrowContainer,
                      { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
                    ]}>
                      <FontAwesomeIcon 
                        icon={expandedOption === option.id ? faChevronDown : faChevronRight} 
                        size={12} 
                        color={darkMode ? '#888' : '#ccc'} 
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Expanded Content - Only show for non-direct navigation items */}
              {expandedOption === option.id && !option.hasSwitch && !option.navigateDirectly && (
                <View style={[styles.expandedContent, darkMode && styles.expandedContentDark]}>
                  {/* No expanded content since all options now navigate directly */}
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* App Version */}
      <View style={[styles.settingsFooter, darkMode && styles.settingsFooterDark]}>
        <Text style={[styles.versionText, darkMode && styles.versionTextDark]}>
          HavenSync v1.0(1)
        </Text>
      </View>
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
  
  // Settings Header
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsHeaderDark: {
    borderBottomColor: '#333',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonDark: {
    backgroundColor: '#333',
  },
  
  // Settings Content
  settingsContent: {
    flex: 1,
    paddingTop: 10,
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingsOptionDark: {
    borderBottomColor: '#2a2a2a',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  destructiveText: {
    color: '#ff4444',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  optionSubtitleDark: {
    color: '#999',
  },
  optionRight: {
    alignItems: 'center',
  },
  arrowContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Footer
  settingsFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  settingsFooterDark: {
    borderTopColor: '#333',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  versionTextDark: {
    color: '#666',
  },
  
  // Expanded Content Styles
  expandedContent: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expandedContentDark: {
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#333',
  },
  contentSection: {
    width: '100%',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contentButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  contentButtonIcon: {
    marginRight: 8,
  },
  contentButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  infoRowDark: {
    borderBottomColor: '#444',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
  },
  integrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  googleButton: {
    backgroundColor: '#4285f4',
  },
  alexaButton: {
    backgroundColor: '#00d2d3',
  },
  homeKitButton: {
    backgroundColor: '#007aff',
  },
  smartThingsButton: {
    backgroundColor: '#1c7cd6',
  },
  integrationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
});