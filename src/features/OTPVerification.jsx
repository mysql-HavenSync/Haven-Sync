import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const OTPVerification = ({ route, navigation }) => {
  const [otp, setOtp] = useState('');
  const { email } = route.params; // ✅ get email from previous screen

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp });
      console.log('✅ OTP verified:', response.data);

      alert('OTP verified successfully!');
      navigation.navigate('ResetPassword', { email }); // ✅ Pass email to reset screen
    } catch (error) {
      console.error('❌ OTP verification error:', error?.response?.data || error.message);
      alert(error?.response?.data?.message || 'Invalid or expired OTP');
    }
  };
  // Animated values
  const titleAnimation = new Animated.Value(0);
  const subtitleAnimation = new Animated.Value(0);
  const inputAnimation = new Animated.Value(0);
  const buttonAnimation = new Animated.Value(0);
  const panelAnimation = new Animated.Value(0);

  // Trigger animations on component mount
  useEffect(() => {
    Animated.timing(panelAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(titleAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.timing(subtitleAnimation, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    Animated.timing(inputAnimation, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: true,
    }).start();

    Animated.timing(buttonAnimation, {
      toValue: 1,
      duration: 1400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Animated.Text
        style={[styles.title, { opacity: titleAnimation }]} // Apply animation to title
      >
        Verify OTP
      </Animated.Text>

      {/* White Panel Background */}
      <Animated.View
        style={[styles.panel, { opacity: panelAnimation }]}
      >
        <Animated.Text
          style={[styles.subtitle, { opacity: subtitleAnimation }]} // Apply animation to subtitle
        >
          Enter the OTP sent to your email
        </Animated.Text>

        <Animated.View
          style={[styles.inputWrapper, { opacity: inputAnimation }]} // Apply animation to input field
        >
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
        </Animated.View>

        <Animated.View
          style={{ opacity: buttonAnimation }} // Apply animation to button
        >
          <TouchableOpacity onPress={handleVerifyOTP} style={styles.buttonContainer}>
            <LinearGradient
              colors={['#00C9FF', '#92FE9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default OTPVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4d3d2',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 25,
    fontFamily: 'HoryzenDigital-24',
    color: '#222',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    fontSize: 16,
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
    shadowOpacity: 30,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'HoryzenDigital-24',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});