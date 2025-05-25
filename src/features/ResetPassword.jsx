import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const ResetPassword = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animated values
  const titleAnimation = new Animated.Value(0);
  const subtitleAnimation = new Animated.Value(0);
  const inputAnimation = new Animated.Value(0);
  const buttonAnimation = new Animated.Value(0);

  // Trigger animations on component mount
  useEffect(() => {
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
        Reset Password
      </Animated.Text>

      <Animated.Text
        style={[styles.subtitle, { opacity: subtitleAnimation }]} // Apply animation to subtitle
      >
        Enter your new password below
      </Animated.Text>

      {/* Password Input */}
      <Animated.View
        style={[styles.inputWrapper, { opacity: inputAnimation }]} // Apply animation to password input
      >
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(prev => !prev)}
        >
          <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </Animated.View>

      {/* Confirm Password Input */}
      <Animated.View
        style={[styles.inputWrapper, { opacity: inputAnimation }]} // Apply animation to confirm password input
      >
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowConfirmPassword(prev => !prev)}
        >
          <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={{ opacity: buttonAnimation }} // Apply animation to button
      >
        <TouchableOpacity
          onPress={() => {
            alert('Password reset successfully!');
            navigation.navigate('HexaLoginScreen');
          }}
          style={styles.buttonContainer}
        >
          <LinearGradient
            colors={['#00C9FF', '#92FE9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Reset Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4d3d2',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'HoryzenDigital-24',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
    position: 'relative',
    borderBottomWidth: 1.2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  input: {
    height: 50,
    fontSize: 16,
    paddingHorizontal: 16,
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 14,
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
    fontSize: 19,
    fontFamily: 'HoryzenDigital-24',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
