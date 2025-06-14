// Same imports as before...
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

const { height, width } = Dimensions.get('window');

export default function HexaWelcomeScreen({ navigation }) {
  const [showEntry, setShowEntry] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const hexPatternOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkVibrationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            'android.permission.VIBRATE',
            {
              title: 'Vibration Permission',
              message: 'Haven needs vibration permission for haptic feedback.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }
          );
          setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
        } catch (err) {
          console.warn(err);
          setPermissionGranted(true);
        }
      } else {
        setPermissionGranted(true);
      }
    };
    checkVibrationPermission();
  }, []);

  useEffect(() => {
    // Reset animations when component mounts/focuses
    setShowEntry(false);
    fadeAnim.setValue(0);
    hexPatternOpacity.setValue(0);
    
    const timer = setTimeout(() => {
      setShowEntry(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(hexPatternOpacity, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
      startPulseAnimation();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Add focus listener to reset when navigating back
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset state when screen comes into focus
      setShowEntry(false);
      fadeAnim.setValue(0);
      hexPatternOpacity.setValue(0);
      
      const timer = setTimeout(() => {
        setShowEntry(true);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(hexPatternOpacity, {
            toValue: 0.4,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start();
        startPulseAnimation();
      }, 5000);
    });

    return unsubscribe;
  }, [navigation]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleTap = () => {
    rippleScale.setValue(0.1);
    rippleOpacity.setValue(0.8);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pressAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rippleScale, {
          toValue: 3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      navigation.navigate('HexaLoginScreen');
    });
  };

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/videos/welcome.mp4')}
        style={styles.backgroundVideo}
        resizeMode="cover"
        repeat
      />
      <Animated.View style={[styles.hexPattern, { opacity: hexPatternOpacity }]} />

      {showEntry && (
        <Animated.View style={[styles.entryContainer, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.rippleEffect,
              {
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
          <Animated.View style={[styles.glowEffect, { opacity: glowAnim }]} />
          
          {/* 3D Button Shadow */}
          <Animated.View 
            style={[
              styles.buttonShadow, 
              { 
                transform: [
                  { scale: pulseAnim },
                  { 
                    translateY: pressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 2]
                    })
                  }
                ] 
              }
            ]} 
          />
          
          <TouchableWithoutFeedback onPress={handleTap}>
            <Animated.View
              style={[
                styles.hexagonContainer, 
                { 
                  transform: [
                    { scale: pulseAnim },
                    { 
                      translateY: pressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 4]
                      })
                    }
                  ] 
                }
              ]}
            >
              {/* Bottom/Shadow Layer */}
              <View style={styles.hexagonShadowLayer} />
              
              {/* Main Top Face */}
              <View style={styles.hexagon3D}>
                <LinearGradient
                  colors={['#B0E0E6', '#87CEEB', '#4682B4']}
                  style={styles.hexagonTopFace}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.innerBevel}>
                    <View style={styles.innerHighlight} />
                    <View style={styles.textContainer}>
                      <Text style={styles.hexagonText}>ENTER</Text>
                      <Text style={styles.hexagonTextSmall}>HAVEN</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4d3d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
  },
  hexPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  entryContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
    justifyContent: 'center',
  },
 
  hexagonContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexagonShadowLayer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#3B4F5A',
    transform: [{ rotate: '45deg' }, { translateX: 2 }, { translateY: 2 }],
    shadowColor: '#000',
    shadowOffset: { width: 10, height: -20 },
    shadowOpacity:100,
    shadowRadius: 50,
    elevation: 10,
  },
  
  hexagon3D: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 26,
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 100,
    shadowRadius: 12,
    elevation: 15,
  },
  hexagonTopFace: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderTopColor: 'rgba(135, 206, 235, 0.4)',
    borderLeftColor: 'rgba(135, 206, 235, 0.3)',
    borderRightColor: 'rgba(0, 0, 0, 0.2)',
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
  },
  innerBevel: {
    width: '80%',
    height: '80%',
    backgroundColor: '#102935',
    borderRadius: 20,
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#88e1f2',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 50,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderTopColor: '#1a4a5c',
    borderLeftColor: '#1a4a5c',
    borderRightColor: '#0a1f28',
    borderBottomColor: '#0a1f28',
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 15,
    height: '45%',
    backgroundColor: 'rgba(136, 225, 242, 0.15)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonText: {
    fontFamily: 'Horyzen Digital 24',
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(136, 225, 242, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  hexagonTextSmall: {
    fontFamily: 'Horyzen Digital 24',
    fontSize: 9,
    color: '#c1f5ff',
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 2,
    textShadowColor: 'rgba(136, 225, 242, 0.6)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 3,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 110,
    backgroundColor: 'transparent',
    shadowColor: '#88e1f2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 100,
    shadowRadius: 35,
    elevation: 20,
  },
  rippleEffect: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(136, 225, 242, 0.7)',
    shadowColor: '#88e1f2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 80,
    shadowRadius: 15,
    elevation: 12,
  },
});