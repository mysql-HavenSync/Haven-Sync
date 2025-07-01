import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../api'; // Make sure this is present

const ForgotPasswordRequest = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Animated values for scaling and fading
  const titleAnimation = new Animated.Value(0);
  const inputAnimation = new Animated.Value(0);
  const buttonAnimation = new Animated.Value(0);

  // Trigger animations on component mount
  useEffect(() => {
    Animated.timing(titleAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(inputAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(buttonAnimation, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  // 🔄 UPDATED FUNCTION - Replace your existing handleSendOTP with this
  const handleSendOTP = async () => {
    if (!email.trim()) {
      alert('Please enter your email.');
      return;
    }

    try {
      console.log('🚀 Sending OTP request for:', email);
      
      const response = await api.post('/api/auth/forgot-password', { email });

      console.log('✅ OTP Response:', response.data);
      console.log('✅ Full Response:', response);
      
      // Show more detailed success message
      const message = response.data.message || 'OTP sent successfully!';
      alert(`${message}\n\nCheck your email (including spam folder) for the OTP code.`);

      // Navigate to OTP screen and pass email
      navigation.navigate('OTPVerification', { email });
    } catch (error) {
      console.error('❌ Full Error Object:', error);
      console.error('❌ Error Response:', error?.response);
      console.error('❌ Error Data:', error?.response?.data);
      console.error('❌ Error Status:', error?.response?.status);
      
      const errorMessage = error?.response?.data?.message || error.message || 'Failed to send OTP';
      const errorDetails = error?.response?.data?.details || '';
      
      alert(`Error: ${errorMessage}${errorDetails ? '\nDetails: ' + errorDetails : ''}`);
    }
  };

  return (
    <LinearGradient colors={['#c4d3d2', '#e0e7e9']} style={styles.container}>
      <Animated.Text
        style={[
          styles.pageTitle,
          {
            opacity: titleAnimation,
            transform: [
              {
                scale: titleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        Reclaim Entry
      </Animated.Text>

      {/* White Panel */}
      <View style={styles.panelContainer}>
        <Animated.View style={[{ opacity: inputAnimation }, styles.inputWrapper]}>
          <Text style={styles.subtitle}>
            Enter your registered email to receive an OTP
          </Text>

          {/* Email Input */}
          <View
            style={[
              styles.emailInputWrapper,
              isFocused && styles.focusedInput,
            ]}
          >
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#aaa"
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          <Animated.View style={{ opacity: buttonAnimation }}>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleSendOTP} // ✅ this calls the updated function
            >
              <LinearGradient
                colors={['#00C9FF', '#92FE9D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Send OTP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

export default ForgotPasswordRequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontFamily: 'HoryzenDigital-24',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: '#555',
    marginBottom: 32,
    fontSize: 14,
    textAlign: 'center',
  },
  panelContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    width: '100%',
  },
  emailInputWrapper: {
    marginBottom: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  focusedInput: {
    borderColor: '#007BFF',
    borderWidth: 1.5,
  },
  textInput: {
    height: 40,
    fontSize: 16,
    fontFamily: 'Kiona-Regular',
    paddingVertical: 4,
    color: '#333',
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});