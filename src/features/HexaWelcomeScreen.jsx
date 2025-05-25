import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Vibration,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';

const { height, width } = Dimensions.get('window');

export default function HexaWelcomeScreen({ navigation }) {
  // State for the circular indicator
  const [progress, setProgress] = useState(0);
  const [showEntry, setShowEntry] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // For the swipe indicator
  const swipePosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const swipeOpacity = useRef(new Animated.Value(0)).current;

  // For the hexagon pattern
  const hexPatternOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show the entry mechanism after video plays for a bit
    const timer = setTimeout(() => {
      setShowEntry(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(hexPatternOpacity, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();

      // Start the pulse animation
      startPulseAnimation();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Create the pulse effect
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Start the hint animation after a delay
    setTimeout(() => {
      showSwipeHint();
    }, 3000);
  };

  // Show a hint about how to enter
  const showSwipeHint = () => {
    swipePosition.setValue({ x: -width * 0.15, y: 0 });
    Animated.sequence([
      Animated.timing(swipeOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(swipePosition, {
        toValue: { x: width * 0.15, y: 0 },
        duration: 1800,
        useNativeDriver: true,
      }),
      Animated.timing(swipeOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Repeat the hint after a delay
      setTimeout(showSwipeHint, 6000);
    });
  };

  // Create the pan responder for the circular interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.moveX - width / 2;
        const dy = gestureState.moveY - height / 2;
        const angle = Math.atan2(dy, dx);

        // Clamp angle to range
        const clampedAngle = Math.max(-Math.PI, Math.min(Math.PI, angle));
        rotateAnim.setValue(clampedAngle); // important!

        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        const newProgress = Math.min(1, Math.max(0, gestureState.moveX / width));
        setProgress(newProgress);

        if (newProgress >= 0.8) {
          Vibration.vibrate(50);
          navigation.navigate('HexaLoginScreen');
        }
      },

      onPanResponderRelease: () => {
        // Reset progress when released before completion
        if (progress < 0.8) {
          setProgress(0);
        }
      },
    })
  ).current;

  // Interpolate the progress to visual properties
  const circleColor = progress > 0.7
    ? ['#6ec1e4', '#3ba7cc', '#2294b8']
    : ['#3ba7cc', '#2294b8', '#1a7a9c'];

  const progressInterpolate = progress * 100;

  // Calculate rotation for visual effect
  const spin = rotateAnim.interpolate({
    inputRange: [-Math.PI, Math.PI],
    outputRange: ['-180deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/videos/welcome.mp4')}
        style={styles.backgroundVideo}
        resizeMode="cover"
        repeat
      />

      {/* Hexagon Pattern Overlay */}
      <Animated.View style={[styles.hexPattern, { opacity: hexPatternOpacity }]}>
        {/* This would be an SVG or image with hexagon pattern */}
      </Animated.View>

      {showEntry && (
        <Animated.View
          style={[
            styles.entryContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.instructionText}>Slide to enter Haven</Text>

          <LinearGradient
            colors={circleColor}
            style={[styles.circleGradient, { transform: [{ rotate:  '0deg' }] }]}
          >
            <View style={styles.innerCircle}>
              <LinearGradient
                colors={['#1e1e1e', '#2a2a2a']}
                style={styles.progressCircle}
              >
                <Text style={styles.percentText}>{Math.round(progressInterpolate)}%</Text>
              </LinearGradient>
            </View>
          </LinearGradient>

          {/* Swipe Hint Animation */}
          <Animated.View
            style={[
              styles.swipeHint,
              {
                opacity: swipeOpacity,
                transform: [{ translateX: swipePosition.x }],
              }
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.swipeGradient}
            />
          </Animated.View>
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
    backgroundColor: 'transparent',
    // You would add a background image with hexagons here
  },
  entryContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
    width: width * 0.8,
  },
  instructionText: {
    fontFamily: 'HoryzenDigital24',
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  circleGradient: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 15,
  },
  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  percentText: {
    fontFamily: 'HoryzenDigital24',
    fontSize: 28,
    color: '#6ec1e4',
    fontWeight: '700',
  },
  swipeHint: {
    position: 'absolute',
    width: width * 0.3,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  swipeGradient: {
    width: '100%',
    height: '100%',
  },
});
