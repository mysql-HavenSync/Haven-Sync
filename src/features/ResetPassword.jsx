import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../api'; // ✅ make sure this exists and is configured

const ResetPassword = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const titleAnimation = new Animated.Value(0);
  const subtitleAnimation = new Animated.Value(0);
  const inputAnimation = new Animated.Value(0);
  const buttonAnimation = new Animated.Value(0);
  const panelAnimation = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(panelAnimation, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();

    Animated.timing(titleAnimation, {
      toValue: 1, duration: 1000, useNativeDriver: true,
    }).start();

    Animated.timing(subtitleAnimation, {
      toValue: 1, duration: 1200, useNativeDriver: true,
    }).start();

    Animated.timing(inputAnimation, {
      toValue: 1, duration: 1300, useNativeDriver: true,
    }).start();

    Animated.timing(buttonAnimation, {
      toValue: 1, duration: 1400, useNativeDriver: true,
    }).start();
  }, []);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const res = await api.post(`/api/auth/reset-password?email=${email}`, {
        newPassword: password,
        confirmPassword: confirmPassword,
      });

      Alert.alert('Success', 'Password reset successful', [
        { text: 'OK', onPress: () => navigation.navigate('HexaLoginScreen') },
      ]);
    } catch (err) {
      console.error('❌ Reset password error:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Animated.Text style={[styles.title, { opacity: titleAnimation }]}>
        Reset Password
      </Animated.Text>

      <Animated.View style={[styles.panel, { opacity: panelAnimation }]}>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleAnimation }]}>
          Enter your new password below
        </Animated.Text>

        {/* New Password */}
        <Animated.View style={[styles.inputWrapper, { opacity: inputAnimation }]}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </Animated.View>

        {/* Confirm Password */}
        <Animated.View style={[styles.inputWrapper, { opacity: inputAnimation }]}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: buttonAnimation }}>
          <TouchableOpacity onPress={handleResetPassword} style={styles.buttonContainer}>
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
    textAlign: 'center',
    color: '#222',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 20,
    position: 'relative',
    borderBottomWidth: 1.2,
    borderColor: '#ccc',
    backgroundColor: '#f8f9fa',
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
    elevation: 10,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
    fontFamily: 'HoryzenDigital-24',
  },
});
