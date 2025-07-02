import api from '../api'; // ✅ adjust the path to api.js 
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function HexaSignUpScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState('main'); // Default to main
  const [parentUserId, setParentUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get parent user ID from navigation params if passed (for sub-user creation)
  React.useEffect(() => {
    if (route?.params?.parentUserId) {
      setParentUserId(route.params.parentUserId);
      setAccountType('sub');
    }
  }, [route?.params]);

  const validateEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
  };

  const handleSignUp = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    // If sub account, parent_user_id is required
    if (accountType === 'sub' && !parentUserId.trim()) {
      Alert.alert('Error', 'Parent User ID is required for sub accounts');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        name,
        email,
        password,
        password_confirmation: confirmPassword, // Laravel expects this field name
        account_type: accountType,
      };

      // Only add parent_user_id if it's a sub account
      if (accountType === 'sub') {
        requestData.parent_user_id = parentUserId;
      }

      console.log('📤 Sending signup request:', requestData);

      const response = await api.post('/api/signup', requestData);
      
      console.log('✅ Signup Response:', response.status, response.data);
      
      Alert.alert(
        'Success', 
        response.data.message || 'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // If this was a sub-user creation, go back to the previous screen
              if (accountType === 'sub' && route?.params?.fromMainUser) {
                navigation.goBack();
              } else {
                // Otherwise go to login screen
                navigation.replace('HexaLoginScreen');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Signup error:', error.response?.data || error.message);
      
      let errorMessage = 'Signup failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join('\n');
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#c4d3d2', '#c4d3d2']} style={styles.container}>
      <Text style={styles.title}>
        {accountType === 'sub' ? 'Create Sub Account' : 'Create Account'}
      </Text>

      <View style={styles.card}>
        {/* Account Type Selection - Only show if not passed from parent */}
        {!route?.params?.parentUserId && (
          <View style={styles.accountTypeContainer}>
            <Text style={styles.accountTypeLabel}>Account Type:</Text>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'main' && styles.accountTypeButtonActive
                ]}
                onPress={() => setAccountType('main')}
              >
                <Text style={[
                  styles.accountTypeButtonText,
                  accountType === 'main' && styles.accountTypeButtonTextActive
                ]}>
                  Main Account
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'sub' && styles.accountTypeButtonActive
                ]}
                onPress={() => setAccountType('sub')}
              >
                <Text style={[
                  styles.accountTypeButtonText,
                  accountType === 'sub' && styles.accountTypeButtonTextActive
                ]}>
                  Sub Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Parent User ID - Only show for sub accounts */}
        {accountType === 'sub' && (
          <TextInput
            style={styles.input}
            placeholder="Parent User ID (e.g., HS-JOHN-ABC-2501031420)"
            placeholderTextColor="#aaa"
            value={parentUserId}
            onChangeText={setParentUserId}
            returnKeyType="next"
            editable={!route?.params?.parentUserId} // Disable if passed from parent
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#aaa"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye' : 'eye-off'}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon
              name={showConfirmPassword ? 'eye' : 'eye-off'}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.buttonContainer, isLoading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#ccc', '#999'] : ['#00C9FF', '#92FE9D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          Already have an account?{' '}
          <Text
            onPress={() => navigation.navigate('HexaLoginScreen')}
            style={{ fontWeight: '700', color: '#007BFF' }}
          >
            Login
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontFamily: 'HoryzenDigital-24',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    width: '85%',
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ perspective: 800 }],
    marginTop: 10,
    height: 'auto',
  },
  accountTypeContainer: {
    marginBottom: 20,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  accountTypeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  accountTypeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 80,
    shadowRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 5,
    textStrokeWidth: 5,
    textStrokeColor: '#000',
  },
  switchText: {
    textAlign: 'center',
    color: '#333',
    marginTop: 10,
  },
});