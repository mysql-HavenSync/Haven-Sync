import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DeviceRadar() {
  const rotate = useSharedValue(0);
  
  // Rotate animation for the radar
  rotate.value = withRepeat(
    withTiming(360, { duration: 3000, easing: Easing.linear }),
    -1,
    false
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Device</Text>
      <Text style={styles.subtitle}>Searching Device...</Text>
      
      {/* Radar Container */}
      <View style={styles.radarContainer}>
        <View style={[styles.radarCircle, { width: 300, height: 300, borderRadius: 150 }]} />
        <View style={[styles.radarCircle, { width: 240, height: 240, borderRadius: 120 }]} />
        <View style={[styles.radarCircle, { width: 180, height: 180, borderRadius: 90 }]} />
        <View style={[styles.radarCircle, { width: 120, height: 120, borderRadius: 60 }]} />
        
        {/* Device Detector Loader */}
        <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, animatedStyle]}>
          <View style={{ width: '50%', height: 2, backgroundColor: '#4CD964', position: 'absolute', right: '50%', top: '50%' }} />
          <View style={{ width: 15, height: 15, borderRadius: 7.5, backgroundColor: '#4CD964', position: 'absolute', right: '50%', top: '50%', marginTop: -7.5 }} />
        </Animated.View>
        
        {/* Detected Devices */}
        <View style={[styles.device, { top: '25%', right: '20%' }]}>
          <Icon name="bulb-outline" size={24} color="#4CD964" />
          <Text style={styles.deviceText}>Lamp 32-12k</Text>
        </View>
        
        <View style={[styles.device, { bottom: '30%', left: '25%' }]}>
          <Icon name="game-controller-outline" size={24} color="#4CD964" />
          <Text style={styles.deviceText}>PS8</Text>
        </View>
        
        <View style={[styles.device, { top: '60%', right: '30%' }]}>
          <Icon name="tv-outline" size={24} color="#4CD964" />
          <Text style={styles.deviceText}>TV Samsung</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  radarContainer: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#2a2a3d',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarCircle: {
    borderWidth: 2,
    borderColor: '#84c3e0',
    position: 'absolute',
  },
  device: {
    position: 'absolute',
    alignItems: 'center',
  },
  deviceText: {
    color: '#fff',
    marginTop: 5,
  },
});