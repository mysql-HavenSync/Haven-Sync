import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Switch,
  Alert 
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faEdit, faCog } from '@fortawesome/free-solid-svg-icons';
import Slider from '@react-native-community/slider'; // You'll need to install this package

export default function DeviceControlPage({ route, navigation }) {
  const { deviceId, device } = route.params || {};
  const darkMode = useSelector(state => state.profile.darkMode);

  // State for switches and sliders
  const [switches, setSwitches] = useState({});
  const [sliders, setSliders] = useState({});
  const [deviceConfig, setDeviceConfig] = useState({ switchCount: 3, hasSpeedControl: [] });

  useEffect(() => {
    if (deviceId) {
      configureDeviceControls(deviceId);
    }
  }, [deviceId]);

  const configureDeviceControls = (id) => {
    let config = { switchCount: 3, hasSpeedControl: [] };
    
    if (id && id.startsWith('hexa3chn-')) {
      config = {
        switchCount: 3,
        hasSpeedControl: [3] // 3rd switch has speed control
      };
    } else if (id && id.startsWith('hexa5chn-')) {
      config = {
        switchCount: 5,
        hasSpeedControl: [4, 5] // 4th and 5th switches have speed control
      };
    }
    
    setDeviceConfig(config);
    
    // Initialize switch states
    const initialSwitches = {};
    const initialSliders = {};
    
    for (let i = 1; i <= config.switchCount; i++) {
      initialSwitches[i] = false;
      if (config.hasSpeedControl.includes(i)) {
        initialSliders[i] = 50; // Default speed at 50%
      }
    }
    
    setSwitches(initialSwitches);
    setSliders(initialSliders);
  };

  // Handle case where device data might not be available
  if (!device && !deviceId) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, darkMode && styles.errorTextDark]}>
            Device not found
          </Text>
          <TouchableOpacity 
            style={[styles.controlButton, darkMode && styles.controlButtonDark]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleEditDevice = () => {
    navigation.navigate('EditDevice', { device });
  };

  const handleSwitchToggle = (switchNumber) => {
    setSwitches(prev => ({
      ...prev,
      [switchNumber]: !prev[switchNumber]
    }));
    
    // Add your device control logic here
    console.log(`Switch ${switchNumber} toggled to:`, !switches[switchNumber]);
    
    // Show confirmation
    Alert.alert(
      'Switch Control',
      `Switch ${switchNumber} turned ${!switches[switchNumber] ? 'ON' : 'OFF'}`,
      [{ text: 'OK' }]
    );
  };

  const handleSliderChange = (switchNumber, value) => {
    setSliders(prev => ({
      ...prev,
      [switchNumber]: value
    }));
  };

  const handleSliderComplete = (switchNumber, value) => {
    console.log(`Switch ${switchNumber} speed set to:`, value);
    
    // Add your speed control logic here
    Alert.alert(
      'Speed Control',
      `Switch ${switchNumber} speed set to ${Math.round(value)}%`,
      [{ text: 'OK' }]
    );
  };

  const renderSwitchControl = (switchNumber) => {
    const hasSpeedControl = deviceConfig.hasSpeedControl.includes(switchNumber);
    const isOn = switches[switchNumber];
    const speedValue = sliders[switchNumber] || 50;

    return (
      <View key={switchNumber} style={[styles.switchCard, darkMode && styles.switchCardDark]}>
        <View style={styles.switchHeader}>
          <Text style={[styles.switchTitle, darkMode && styles.switchTitleDark]}>
            Switch {switchNumber}
          </Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOn ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => handleSwitchToggle(switchNumber)}
            value={isOn}
            style={styles.switch}
          />
        </View>
        
        <Text style={[styles.switchStatus, darkMode && styles.switchStatusDark]}>
          Status: {isOn ? 'ON' : 'OFF'}
        </Text>
        
        {hasSpeedControl && isOn && (
          <View style={styles.speedControlContainer}>
            <Text style={[styles.speedLabel, darkMode && styles.speedLabelDark]}>
              Speed Control: {Math.round(speedValue)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={speedValue}
              onValueChange={(value) => handleSliderChange(switchNumber, value)}
              onSlidingComplete={(value) => handleSliderComplete(switchNumber, value)}
              minimumTrackTintColor={darkMode ? '#ff6b7a' : '#ff4757'}
              maximumTrackTintColor={darkMode ? '#444' : '#ddd'}
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.speedLabels}>
              <Text style={[styles.speedLabelText, darkMode && styles.speedLabelTextDark]}>0%</Text>
              <Text style={[styles.speedLabelText, darkMode && styles.speedLabelTextDark]}>100%</Text>
            </View>
          </View>
        )}
        
        {hasSpeedControl && !isOn && (
          <Text style={[styles.disabledText, darkMode && styles.disabledTextDark]}>
            Turn on switch to control speed
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={[styles.backButton, darkMode && styles.backButtonDark]}
        >
          <FontAwesomeIcon 
            icon={faArrowLeft} 
            size={20} 
            color={darkMode ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>
          Device Controls
        </Text>
        <TouchableOpacity 
          onPress={handleEditDevice}
          style={[styles.editButton, darkMode && styles.editButtonDark]}
        >
          <FontAwesomeIcon 
            icon={faEdit} 
            size={18} 
            color={darkMode ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Device Info */}
        <View style={[styles.deviceInfoCard, darkMode && styles.deviceInfoCardDark]}>
          <View style={styles.deviceInfoHeader}>
            <FontAwesomeIcon 
              icon={faCog} 
              size={24} 
              color={darkMode ? '#fff' : '#333'} 
            />
            <View style={styles.deviceInfoText}>
              <Text style={[styles.deviceName, darkMode && styles.deviceNameDark]}>
                {device?.name || 'Smart Device'}
              </Text>
              <Text style={[styles.deviceId, darkMode && styles.deviceIdDark]}>
                ID: {deviceId || device?.id || 'Unknown'}
              </Text>
            </View>
          </View>
          <Text style={[styles.configInfo, darkMode && styles.configInfoDark]}>
            Configuration: {deviceConfig.switchCount} switches
            {deviceConfig.hasSpeedControl.length > 0 && 
              ` (Speed control on switch${deviceConfig.hasSpeedControl.length > 1 ? 'es' : ''} ${deviceConfig.hasSpeedControl.join(', ')})`
            }
          </Text>
        </View>

        {/* Switch Controls */}
        <View style={styles.switchesContainer}>
          {Array.from({ length: deviceConfig.switchCount }, (_, index) => 
            renderSwitchControl(index + 1)
          )}
        </View>

        {/* Master Controls */}
        <View style={[styles.masterControlsCard, darkMode && styles.masterControlsCardDark]}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Master Controls
          </Text>
          
          <TouchableOpacity 
            style={[styles.masterButton, styles.allOnButton, darkMode && styles.allOnButtonDark]}
            onPress={() => {
              const allOn = {};
              for (let i = 1; i <= deviceConfig.switchCount; i++) {
                allOn[i] = true;
              }
              setSwitches(allOn);
              Alert.alert('Master Control', 'All switches turned ON');
            }}
          >
            <Text style={styles.masterButtonText}>Turn All ON</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.masterButton, styles.allOffButton, darkMode && styles.allOffButtonDark]}
            onPress={() => {
              const allOff = {};
              for (let i = 1; i <= deviceConfig.switchCount; i++) {
                allOff[i] = false;
              }
              setSwitches(allOff);
              Alert.alert('Master Control', 'All switches turned OFF');
            }}
          >
            <Text style={styles.masterButtonText}>Turn All OFF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerDark: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerTitleDark: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  deviceInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deviceInfoCardDark: {
    backgroundColor: '#2a2a2a',
  },
  deviceInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceInfoText: {
    marginLeft: 15,
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deviceNameDark: {
    color: '#fff',
  },
  deviceId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceIdDark: {
    color: '#aaa',
  },
  configInfo: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  configInfoDark: {
    color: '#bbb',
  },
  switchesContainer: {
    marginBottom: 20,
  },
  switchCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  switchCardDark: {
    backgroundColor: '#2a2a2a',
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  switchTitleDark: {
    color: '#fff',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  switchStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  switchStatusDark: {
    color: '#aaa',
  },
  speedControlContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  speedLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  speedLabelDark: {
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#ff4757',
    width: 20,
    height: 20,
  },
  speedLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  speedLabelText: {
    fontSize: 12,
    color: '#888',
  },
  speedLabelTextDark: {
    color: '#bbb',
  },
  disabledText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  disabledTextDark: {
    color: '#666',
  },
  masterControlsCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  masterControlsCardDark: {
    backgroundColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  masterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  allOnButton: {
    backgroundColor: '#27ae60',
  },
  allOnButtonDark: {
    backgroundColor: '#2ecc71',
  },
  allOffButton: {
    backgroundColor: '#e74c3c',
  },
  allOffButtonDark: {
    backgroundColor: '#ff6b7a',
  },
  masterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlButton: {
    backgroundColor: '#ff4757',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  controlButtonDark: {
    backgroundColor: '#ff6b7a',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorTextDark: {
    color: '#aaa',
  },
});