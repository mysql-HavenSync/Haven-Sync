import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

const { width, height } = Dimensions.get('window');

export default function HexaLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [emailAnim] = useState(new Animated.Value(email ? 1 : 0));
  const [passAnim] = useState(new Animated.Value(password ? 1 : 0));
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const [titleOpacity] = useState(new Animated.Value(0));
  const [titleTranslateY] = useState(new Animated.Value(-30));

  // Enhanced animation values for visual feedback
  const [feedbackScale] = useState(new Animated.Value(0));
  const [feedbackOpacity] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [cardShakeAnim] = useState(new Animated.Value(0));

  // Function to get gradient colors based on login status
  const getGradientColors = () => {
    if (loginStatus === 'success') {
      return ['#4CAF50', '#8BC34A']; // Green gradient for success
    } else if (loginStatus === 'failed') {
      return ['#F44336', '#FF5722']; // Red gradient for error
    } else {
      return ['#00C9FF', '#92FE9D']; // Default blue-green gradient
    }
  };

  useEffect(() => {
    return () => {
      setLoginStatus(null);
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let timer;
    if (loginStatus === 'failed' || loginStatus === 'success') {
      // Enhanced visual feedback animations
      if (loginStatus === 'success') {
        // Success animation - scale up with pulse
        Animated.sequence([
          Animated.parallel([
            Animated.spring(feedbackScale, {
              toValue: 1,
              tension: 50,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.timing(feedbackOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 2 }
          ),
        ]).start();
      } else {
        // Error animation - shake and show feedback
        Animated.parallel([
          Animated.spring(feedbackScale, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(feedbackOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(cardShakeAnim, {
              toValue: -10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(cardShakeAnim, {
              toValue: 10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(cardShakeAnim, {
              toValue: -10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(cardShakeAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }

      const timeoutDuration = 2500;
      timer = setTimeout(() => {
        // Fade out feedback
        Animated.parallel([
          Animated.timing(feedbackOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(feedbackScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setLoginStatus(null);
          setIsLoading(false);
          pulseAnim.setValue(1);
        });
      }, timeoutDuration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loginStatus, buttonScaleAnim, feedbackScale, feedbackOpacity, pulseAnim, cardShakeAnim]);

  const handleFocus = input => {
    setFocusedInput(input);
    Animated.timing(input === 'email' ? emailAnim : passAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = input => {
    setFocusedInput(null);
    if ((input === 'email' && !email) || (input === 'password' && !password)) {
      Animated.timing(input === 'email' ? emailAnim : passAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const getInputStyle = input =>
    focusedInput === input ? styles.focusedInput : styles.defaultInput;

  const handleLogin = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.trim() === '') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      setLoginStatus('failed');
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const isSuccess = Date.now() % 2 === 0;
      setLoginStatus(isSuccess ? 'success' : 'failed');
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      if (isSuccess) {
        setTimeout(() => {
          navigation.replace('DashboardDrawer');
        }, 1500);
      }
    }, 1000);
  };

  const getButtonText = () => {
    if (isLoading && !loginStatus) return 'Syncing...';
    if (loginStatus === 'success') return 'Welcome!';
    if (loginStatus === 'failed') return 'Retry';
    return 'Login';
  };

  const getFeedbackContent = () => {
    if (loginStatus === 'success') {
      return {
        icon: 'checkmark-circle',
        text: 'Login Successful!',
        color: '#4CAF50',
        gif: require('../assets/gif/login.gif')
      };
    } else if (loginStatus === 'failed') {
      return {
        icon: 'close-circle',
        text: 'Login Failed',
        color: '#F44336',
        gif: require('../assets/gif/fail.gif')
      };
    }
    return null;
  };

  const feedbackContent = getFeedbackContent();

  return (
    <LinearGradient colors={['#c4d3d2', '#c4d3d2']} style={styles.container}>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}
      >
        Ready To Sync
      </Animated.Text>

      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ translateX: cardShakeAnim }],
          },
        ]}
      >
        <View style={[styles.inputWrapper, getInputStyle('email')]}>
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                opacity: emailAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                top: emailAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, -10],
                }),
                fontSize: emailAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 12],
                }),
              },
            ]}
          >
            Email
          </Animated.Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.inputWrapper, getInputStyle('password')]}>
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                opacity: passAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                top: passAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, -10],
                }),
                fontSize: passAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 12],
                }),
              },
            ]}
          >
            Password
          </Animated.Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            secureTextEntry={!showPassword}
            editable={!isLoading}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(prev => !prev)}
            disabled={isLoading}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPasswordRequest')}
          disabled={isLoading}
        >
          <Text style={[styles.forgotPasswordText, isLoading && styles.disabledText]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            disabled={isLoading}
            onPress={handleLogin}
            style={{ overflow: 'hidden', borderRadius: 20 }}
          >
            <LinearGradient
              colors={getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>{getButtonText()}</Text>
              {loginStatus === 'success' && (
                <Icon name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
              )}
              {loginStatus === 'failed' && (
                <Icon name="close-circle" size={20} color="#fff" style={styles.buttonIcon} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.switchText, isLoading && styles.disabledText]}>
          Don't have an account?{' '}
          <Text
            onPress={() => !isLoading && navigation.navigate('HexaSignUpScreen')}
            style={{ fontWeight: '700', color: isLoading ? '#999' : '#007BFF' }}
          >
            Sign Up
          </Text>
        </Text>
      </Animated.View>

      {/* Enhanced Feedback Overlay */}
      {feedbackContent && (
        <Animated.View
          style={[
            styles.feedbackOverlay,
            {
              opacity: feedbackOpacity,
              transform: [
                { scale: feedbackScale },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={[styles.feedbackContainer, { borderColor: feedbackContent.color }]}>
            <FastImage
              source={feedbackContent.gif}
              style={styles.feedbackGif}
              resizeMode={FastImage.resizeMode.contain}
            />
            <View style={styles.feedbackContent}>
              <Icon 
                name={feedbackContent.icon} 
                size={40} 
                color={feedbackContent.color} 
                style={styles.feedbackIcon}
              />
              <Text style={[styles.feedbackText, { color: feedbackContent.color }]}>
                {feedbackContent.text}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 28,
    fontFamily: 'HoryzenDigital-24',
    color: '#333',
    marginBottom: 10,
  },
  card: {
    width: '80%',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    elevation: 12,
  },
  inputWrapper: {
    marginBottom: 24,
    borderBottomWidth: 1.2,
    borderColor: '#ccc',
    position: 'relative',
  },
  defaultInput: { borderColor: '#ccc' },
  focusedInput: { borderColor: '#007BFF' },
  textInput: {
    height: 40,
    fontSize: 16,
    fontFamily: 'Kiona-Regular',
    paddingVertical: 4,
    paddingHorizontal: 4,
    color: '#333',
  },
  floatingLabel: {
    position: 'absolute',
    left: 0,
    color: '#666',
    fontFamily: 'Kiona-Regular',
  },
  eyeIcon: {
    position: 'absolute',
    right: 0,
    top: 10,
  },
  forgotPasswordText: {
    alignSelf: 'flex-end',
    color: '#007BFF',
    marginBottom: 28,
    fontFamily: 'Kiona-Regular',
    fontSize: 14,
  },
  disabledText: {
    color: '#999',
    fontFamily: 'Kiona-Regular',
  },
  gradientButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Kiona-Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Kiona-Regular',
    textAlign: 'center',
    marginTop: 22,
  },
  // Enhanced feedback styles
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    minWidth: 200,
  },
  feedbackGif: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  feedbackContent: {
    alignItems: 'center',
  },
  feedbackIcon: {
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Kiona-Regular',
    textAlign: 'center',
  },
});