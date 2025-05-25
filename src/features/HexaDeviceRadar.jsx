import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWifi, faPlug } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addDevice } from '../redux/slices/switchSlice'; // ✅ Ensure path is correct

const { width } = Dimensions.get('window');
const RADIUS = width * 0.6;

const mockDevices = [
  { id: '1', name: 'Living Room Switch' },
  { id: '2', name: 'Bedroom Fan' },
  { id: '3', name: 'Balcony Light' },
];

export default function HexaDeviceRadar() {
  const [foundDevices, setFoundDevices] = useState([]);
  const [scanning, setScanning] = useState(true);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const pulseAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    animatePulse();
    animateRotation();
    animateScale();

    const timer = setTimeout(() => {
      setFoundDevices(mockDevices);
      setScanning(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.circle),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.in(Easing.circle),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateRotation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const animateScale = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const pulseStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2],
        }),
      },
    ],
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 0],
    }),
  };

  const rotateStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const scaleStyle = {
    transform: [
      {
        scale: scaleAnim,
      },
    ],
  };

  const handleConnect = (device) => {
    dispatch(
      addDevice({
        name: device.name,
        icon: 'fan', // Change this based on device type if needed
        isOn: false,
        isConnected: true,
        switches: [false, false, false], // for 3-channel switch
      })
    );
    navigation.navigate('HexaDashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanning for Devices...</Text>
      <View style={styles.radarContainer}>
        <Animated.View style={[styles.radarPulse, pulseStyle]} />
        <Animated.View style={[styles.radarCore, rotateStyle, scaleStyle]}>
          <FontAwesomeIcon icon={faWifi} size={40} color="#fff" />
        </Animated.View>
      </View>

      {!scanning && (
        <FlatList
          data={foundDevices}
          keyExtractor={(item) => item.id}
          style={{ marginTop: 30, width: '100%' }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceItem}
              onPress={() => handleConnect(item)}
            >
              <FontAwesomeIcon icon={faPlug} size={20} color="#fff" />
              <Text style={styles.deviceName}>{item.name}</Text>
              <Text style={styles.connectText}>Tap to connect</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  radarContainer: {
    width: RADIUS,
    height: RADIUS,
    borderRadius: RADIUS / 2,
    backgroundColor: 'rgba(114, 188, 217, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },
  radarPulse: {
    position: 'absolute',
    width: RADIUS,
    height: RADIUS,
    borderRadius: RADIUS / 2,
    backgroundColor: '#a3ddf5',
    opacity: 0.5,
  },
  radarCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5fa9ce',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  deviceItem: {
    backgroundColor: '#2c3e50',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#fff',
  },
  connectText: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 4,
  },
});
