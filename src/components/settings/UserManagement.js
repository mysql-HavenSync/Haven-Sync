import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, SafeAreaView, Alert, ActivityIndicator, Platform, StyleSheet,
  KeyboardAvoidingView
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faEnvelope, faLock, faTimes } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';

export default function UserManagement({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const loggedInUser = useSelector(state => state.auth.user);
  console.log('👤 Redux loggedInUser:', loggedInUser);

  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'User', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const token = useSelector(state => state.auth.token);

  // ✅ FIXED: Enhanced fetchUsers function with better error handling and field mapping
  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users with token:', token);
      console.log('👤 LoggedInUser structure:', loggedInUser);
      
      if (!loggedInUser) {
        console.error('❌ No logged in user found');
        Alert.alert('Error', 'User session expired. Please login again.');
        return;
      }

      let subusers = [];
      
      try {
        console.log('🔄 Making API call to fetch subusers...');
        const res = await api.get('/api/users/subusers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('✅ API Response received:', res.data);
        console.log('🔍 Response structure:', Object.keys(res.data));
        
        // ✅ FIXED: Handle different possible response structures
        if (res.data && res.data.subuserss) {
          subusers = res.data.subuserss;
          console.log('✅ Found subuserss array:', subusers.length, 'users');
        } else if (res.data && res.data.subusers) {
          subusers = res.data.subusers;
          console.log('✅ Found subusers array:', subusers.length, 'users');
        } else if (res.data && Array.isArray(res.data)) {
          subusers = res.data;
          console.log('✅ Found direct array:', subusers.length, 'users');
        } else {
          console.warn('⚠️ No recognizable subusers array in response');
          subusers = [];
        }
        
        // ✅ FIXED: Map database fields to expected UI fields
        subusers = subusers.map(user => ({
          id: user.sub_user_id || user.id || user.user_id,
          user_id: user.sub_user_id || user.id || user.user_id,
          name: user.name || 'Unknown User',
          email: user.email || 'No email',
          role: user.role || 'User',
          active: user.active !== false,
          addedBy: user.addedBy || 'Admin',
          created_at: user.created_at || new Date().toISOString(),
          parent_user_id: user.parent_user_id,
        }));
        
        console.log('✅ Mapped subusers:', subusers);
        
      } catch (err) {
        console.error('❌ Error fetching subusers:', err.response?.data || err.message);
        console.error('❌ Error status:', err.response?.status);
        
        if (err.response?.status !== 404) {
          Alert.alert('Warning', 'Could not load subusers. Please try again.');
        }
        subusers = [];
      }

      // ✅ Always include the main user first
      const mainUser = {
        id: loggedInUser?.id || loggedInUser?.user_id || 'main_user',
        user_id: loggedInUser?.user_id || loggedInUser?.id,
        name: loggedInUser?.name || 'Main User',
        email: loggedInUser?.email || 'No email',
        role: 'Admin',
        active: true,
        addedBy: 'Self',
        created_at: new Date().toISOString(),
      };

      const allUsers = [mainUser, ...subusers];
      
      console.log('👥 Setting all users:', allUsers);
      console.log('📊 Total users count:', allUsers.length);
      console.log('📋 Users details:', allUsers.map(u => ({ 
        id: u.id, 
        name: u.name, 
        email: u.email, 
        role: u.role 
      })));
      
      setUsers(allUsers);
      
    } catch (err) {
      console.error('❌ Critical error in fetchUsers:', err);
      Alert.alert('Error', 'Could not load user data. Please try again.');
    }
  };

  // ✅ Refresh on component focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('📱 Screen focused, refreshing users...');
      if (loggedInUser && token) {
        fetchUsers();
      }
    });

    return unsubscribe;
  }, [navigation, loggedInUser, token]);

  // ✅ Initial load
  useEffect(() => {
    console.log('🔄 UseEffect triggered with loggedInUser:', loggedInUser);
    console.log('🔄 UseEffect triggered with token:', !!token);
    
    if (loggedInUser && token) {
      console.log('🚀 Initial fetch users...');
      fetchUsers();
    } else {
      console.warn('⚠️ Missing loggedInUser or token:', { 
        loggedInUser: !!loggedInUser, 
        token: !!token 
      });
    }
  }, [loggedInUser, token]);

  const handleAddUser = () => setShowAddUserModal(true);
  
  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setNewUserData({ name: '', email: '', role: 'User', password: '' });
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode('');
    setGeneratedOtp('');
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const handleSendOTP = async () => {
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateEmail(newUserData.email)) {
      Alert.alert('Error', 'Invalid email format');
      return;
    }

    if (users.some(u => u.email === newUserData.email)) {
      Alert.alert('Error', 'User already exists');
      return;
    }

    setIsLoading(true);
    const otp = generateOTP();
    setGeneratedOtp(otp);

    try {
      await api.post('/api/users/send-subusers-otp', {
        email: newUserData.email,
        otp,
      });

      setShowAddUserModal(false);
      setShowOtpModal(true);
      Alert.alert('OTP Sent', `Verification code sent to ${newUserData.email}`);
    } catch (err) {
      console.error('❌ OTP send error:', err);
      Alert.alert('Error', 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode !== generatedOtp) {
      Alert.alert('Error', 'Invalid OTP');
      return;
    }

    try {
      setIsLoading(true);

      const mainUserId = loggedInUser.user_id || loggedInUser.id;
      
      if (!mainUserId) {
        Alert.alert('Error', 'User session invalid. Please login again.');
        return;
      }

      console.log('🔄 Adding subuser with mainUserId:', mainUserId);
      console.log('📦 Sending new user data:', newUserData);

      const response = await api.post(
        '/api/users/add-subusers',
        {
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          password: newUserData.password,
          mainUserId: mainUserId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('✅ Subuser added successfully:', response.data);
      
      Alert.alert('Success', 'Subuser added successfully!');
      setShowOtpModal(false);
      setOtpCode('');
      setGeneratedOtp('');
      setNewUserData({ name: '', email: '', role: 'User', password: '' });

      // ✅ FIXED: Add small delay before refresh to ensure database is updated
      setTimeout(() => {
        fetchUsers();
      }, 1000);

    } catch (err) {
      console.error('❌ Failed to add user:', err);
      console.error('❌ Error response:', err.response?.data);
      Alert.alert('Error', err?.response?.data?.message || 'Could not add user');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleUsers = users;

  // ✅ Show loading state while fetching
  if (isLoading && users.length === 0) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={onBack || (() => navigation.goBack())}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={darkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>
            User Management
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.loadingContainer, darkMode && styles.containerDark]}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onBack || (() => navigation.goBack())}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={darkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>
          User Management
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, darkMode && styles.actionButtonDark]}
            onPress={handleAddUser}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="person-add" size={20} color="#2196F3" />
            </View>
            <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>
              Add New User
            </Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>
        </View>

        {/* User List */}
        <View style={styles.usersSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            Current Users ({visibleUsers.length})
          </Text>
          {visibleUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, darkMode && styles.textGray]}>
                No users found
              </Text>
              <Text style={[styles.emptySubText, darkMode && styles.textGray]}>
                Add your first subuser to get started
              </Text>
            </View>
          ) : (
            visibleUsers.map((user, index) => (
              <View key={user.id || user.user_id || index} style={[styles.userCard, darkMode && styles.userCardDark]}>
                <View style={styles.userInfo}>
                  <View style={[styles.userAvatar, darkMode && styles.userAvatarDark]}>
                    <Text style={[styles.avatarText, darkMode && styles.textWhite]}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={[styles.userName, darkMode && styles.textWhite]}>
                      {user.name}
                      {user.role === 'Admin' && (
                        <Text style={styles.youLabel}> (You)</Text>
                      )}
                    </Text>
                    <Text style={[styles.userEmail, darkMode && styles.textGray]}>
                      {user.email}
                    </Text>
                    <View style={styles.userMeta}>
                      <Text style={[styles.userRole, darkMode && styles.textGray]}>
                        {user.role}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        user.active !== false ? styles.activeBadge : styles.inactiveBadge
                      ]}>
                        <Text style={styles.statusText}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddUserModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                Add New User
              </Text>
              <TouchableOpacity onPress={closeAddUserModal}>
                <FontAwesomeIcon 
                  icon={faTimes} 
                  size={20} 
                  color={darkMode ? '#fff' : '#333'} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={[styles.label, darkMode && styles.textWhite]}>Full Name</Text>
              <TextInput
                style={[styles.input, darkMode && styles.inputDark]}
                placeholder="Enter full name"
                placeholderTextColor={darkMode ? '#999' : '#666'}
                value={newUserData.name}
                onChangeText={(text) => setNewUserData({...newUserData, name: text})}
              />

              <Text style={[styles.label, darkMode && styles.textWhite]}>Email Address</Text>
              <View style={[styles.inputContainer, darkMode && styles.inputContainerDark]}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <FontAwesomeIcon 
                    icon={faEnvelope} 
                    size={14} 
                    color="#4CAF50" 
                  />
                </View>
                <TextInput
                  style={[styles.inputWithIcon, darkMode && styles.textWhite]}
                  placeholder="Enter email address"
                  placeholderTextColor={darkMode ? '#999' : '#666'}
                  value={newUserData.email}
                  onChangeText={(text) => setNewUserData({...newUserData, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={[styles.label, darkMode && styles.textWhite]}>Password</Text>
              <View style={[styles.inputContainer, darkMode && styles.inputContainerDark]}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <FontAwesomeIcon icon={faLock} size={14} color="#FF9800" />
                </View>
                <TextInput
                  style={[styles.inputWithIcon, darkMode && styles.textWhite]}
                  placeholder="Enter password"
                  placeholderTextColor={darkMode ? '#999' : '#666'}
                  secureTextEntry={true}
                  value={newUserData.password}
                  onChangeText={(text) => setNewUserData({ ...newUserData, password: text })}
                />
              </View>

              <Text style={[styles.label, darkMode && styles.textWhite]}>Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newUserData.role === 'User' && styles.roleOptionSelected,
                    darkMode && styles.roleOptionDark,
                    newUserData.role === 'User' && darkMode && styles.roleOptionSelectedDark
                  ]}
                  onPress={() => setNewUserData({...newUserData, role: 'User'})}
                >
                  <Text style={[
                    styles.roleText,
                    newUserData.role === 'User' && styles.roleTextSelected,
                    darkMode && styles.textWhite
                  ]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    newUserData.role === 'Admin' && styles.roleOptionSelected,
                    darkMode && styles.roleOptionDark,
                    newUserData.role === 'Admin' && darkMode && styles.roleOptionSelectedDark
                  ]}
                  onPress={() => setNewUserData({...newUserData, role: 'Admin'})}
                >
                  <Text style={[
                    styles.roleText,
                    newUserData.role === 'Admin' && styles.roleTextSelected,
                    darkMode && styles.textWhite
                  ]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, darkMode && styles.cancelButtonDark]}
                onPress={closeAddUserModal}
              >
                <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendOtpButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendOtpButtonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeOtpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.otpModalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                Verify Email
              </Text>
              <TouchableOpacity onPress={closeOtpModal}>
                <FontAwesomeIcon 
                  icon={faTimes} 
                  size={20} 
                  color={darkMode ? '#fff' : '#333'} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.otpInfo}>
              <View style={[styles.otpIcon, darkMode && styles.otpIconDark]}>
                <FontAwesomeIcon 
                  icon={faLock} 
                  size={24} 
                  color="#4caf50" 
                />
              </View>
              <Text style={[styles.otpTitle, darkMode && styles.textWhite]}>
                Enter Verification Code
              </Text>
              <Text style={[styles.otpSubtitle, darkMode && styles.textGray]}>
                We've sent a 6-digit code to {newUserData.email}
              </Text>
            </View>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={[styles.otpInput, darkMode && styles.otpInputDark]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={darkMode ? '#999' : '#666'}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyOTP}
            >
              <Text style={styles.verifyButtonText}>Verify & Add User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={() => handleSendOTP()}
            >
              <Text style={[styles.resendText, darkMode && styles.textGray]}>
                Didn't receive code? 
                <Text style={styles.resendLink}> Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
  },
  textWhite: {
    color: '#fff',
  },
  textGray: {
    color: '#999',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDark: {
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  
  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  
  // You label style
  youLabel: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '500',
  },
  
  // Icon Container Style
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // Action Button Styles
  actionSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  
  // User List Styles
  usersSection: {
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userCardDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarDark: {
    backgroundColor: '#555',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#e8f5e8',
  },
  inactiveBadge: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  // Form Styles
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#555',
    backgroundColor: '#444',
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputContainerDark: {
    borderColor: '#555',
    backgroundColor: '#444',
  },
  inputWithIcon: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    marginLeft: 8,
  },

  // Role Selection
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  roleOptionDark: {
    borderColor: '#555',
    backgroundColor: '#444',
  },
  roleOptionSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  roleOptionSelectedDark: {
    backgroundColor: '#2d4a2d',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  roleTextSelected: {
    color: '#4caf50',
  },

  // Action Buttons
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonDark: {
    borderColor: '#555',
    backgroundColor: '#444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  sendOtpButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  sendOtpButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // OTP Modal Styles
  otpModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  otpIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  otpIconDark: {
    backgroundColor: '#2d4a2d',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpInputContainer: {
    width: '100%',
    marginBottom:30
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    backgroundColor: '#fff',
  },
  otpInputDark: {
    borderColor: '#555',
    backgroundColor: '#444',
    color: '#fff',
  },
  verifyButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    color: '#4caf50',
    fontWeight: '500',
  },
});