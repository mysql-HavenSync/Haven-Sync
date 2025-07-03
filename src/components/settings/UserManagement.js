import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput, SafeAreaView, 
  Alert, ActivityIndicator, Platform, StyleSheet, KeyboardAvoidingView
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faEnvelope, faLock, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';

export default function UserManagement({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const loggedInUser = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);

  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'User', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const canRemoveUser = (targetUser) => {
    const loggedInUserRole = loggedInUser?.role || 'Admin';
    const loggedInUserId = loggedInUser?.id || loggedInUser?.user_id;
    const targetUserId = targetUser?.id || targetUser?.user_id || targetUser?.sub_user_id;

    return loggedInUserRole === 'Admin' && 
           loggedInUserId !== targetUserId && 
           !(targetUser?.role === 'Admin' && !targetUser?.parent_user_id);
  };

  const fetchUsers = async () => {
    try {
      if (!loggedInUser || !token) {
        Alert.alert('Error', 'User session expired. Please login again.');
        return;
      }

      const loggedInUserId = loggedInUser?.user_id || loggedInUser?.id;
      let adminUser = null;
      let subusers = [];
      
      try {
        const loggedInUserResponse = await api.get(`/api/users/user-details/${loggedInUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const loggedInUserDetails = Array.isArray(loggedInUserResponse.data) 
          ? loggedInUserResponse.data[0] 
          : loggedInUserResponse.data;
        
        if (loggedInUserDetails?.parent_user_id) {
          const adminResponse = await api.get(`/api/users/user-details/${loggedInUserDetails.parent_user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          const adminDetails = Array.isArray(adminResponse.data) 
            ? adminResponse.data[0] 
            : adminResponse.data;
          
          adminUser = {
            id: adminDetails.user_id,
            user_id: adminDetails.user_id,
            name: adminDetails.name,
            email: adminDetails.email,
            role: 'Admin',
            active: true,
            addedBy: 'Self',
            created_at: adminDetails.created_at,
            isMainUser: false,
          };
        } else {
          adminUser = {
            id: loggedInUserId,
            user_id: loggedInUserId,
            name: loggedInUserDetails.name || loggedInUser.name,
            email: loggedInUserDetails.email || loggedInUser.email,
            role: 'Admin',
            active: true,
            addedBy: 'Self',
            created_at: loggedInUserDetails.created_at || loggedInUser.created_at || new Date().toISOString(),
            isMainUser: true,
          };
        }
      } catch (err) {
        const isSubuser = loggedInUser?.parent_user_id;
        if (isSubuser) {
          Alert.alert('Error', 'Unable to fetch admin user details. Please try again.');
          return;
        } else {
          adminUser = {
            id: loggedInUserId,
            user_id: loggedInUserId,
            name: loggedInUser.name,
            email: loggedInUser.email,
            role: 'Admin',
            active: true,
            addedBy: 'Self',
            created_at: loggedInUser.created_at || new Date().toISOString(),
            isMainUser: true,
          };
        }
      }

      try {
        const res = await api.get('/api/users/subusers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data?.subusers) {
          subusers = res.data.subusers;
        } else if (Array.isArray(res.data)) {
          subusers = res.data;
        }
        
        subusers = subusers.map(user => ({
          id: user.sub_user_id || user.id || user.user_id,
          user_id: user.sub_user_id || user.id || user.user_id,
          sub_user_id: user.sub_user_id || user.id || user.user_id,
          name: user.name || 'Unknown User',
          email: user.email || 'No email',
          role: user.role || 'User',
          active: user.active !== false,
          addedBy: 'Admin',
          created_at: user.created_at || new Date().toISOString(),
          parent_user_id: user.parent_user_id,
          isMainUser: (user.sub_user_id || user.user_id) === loggedInUserId,
        }));
      } catch (err) {
        subusers = [];
      }

      setUsers([adminUser, ...subusers]);
    } catch (err) {
      Alert.alert('Error', 'Could not load user data. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (loggedInUser && token) fetchUsers();
    });
    return unsubscribe;
  }, [navigation, loggedInUser, token]);

  useEffect(() => {
    if (loggedInUser && token) fetchUsers();
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

  const handleRemoveUser = (user) => {
    if (!canRemoveUser(user)) {
      Alert.alert('Permission Denied', 'You do not have permission to remove this user.');
      return;
    }
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setUserToRemove(null);
  };

  const confirmRemoveUser = async () => {
    try {
      if (!userToRemove) {
        Alert.alert('Error', 'No user selected for removal');
        return;
      }

      setIsRemoving(true);
      const response = await api.delete(`/api/users/subusers/${userToRemove.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userToRemove.user_id));
      setShowRemoveModal(false);
      setUserToRemove(null);
      Alert.alert('Success', 'User removed successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove user. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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
      await api.post('/api/users/send-subusers-otp', { email: newUserData.email, otp });
      setShowAddUserModal(false);
      setShowOtpModal(true);
      Alert.alert('OTP Sent', `Verification code sent to ${newUserData.email}`);
    } catch (err) {
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

      const response = await api.post('/api/users/add-subusers', {
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        password: newUserData.password,
        mainUserId: mainUserId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Subuser added successfully!');
      setShowOtpModal(false);
      setOtpCode('');
      setGeneratedOtp('');
      setNewUserData({ name: '', email: '', role: 'User', password: '' });
      
      setTimeout(() => fetchUsers(), 1000);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not add user');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleUsers = users;

  if (isLoading && users.length === 0) {
    return (
      <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={onBack || (() => navigation.goBack())}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color={darkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>User Management</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.loadingContainer, darkMode && styles.containerDark]}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={[styles.loadingText, darkMode && styles.textWhite]}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderInput = (label, value, onChangeText, placeholder, props = {}) => (
    <>
      <Text style={[styles.label, darkMode && styles.textWhite]}>{label}</Text>
      <TextInput
        style={[styles.input, darkMode && styles.inputDark]}
        placeholder={placeholder}
        placeholderTextColor={darkMode ? '#999' : '#666'}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </>
  );

  const renderIconInput = (label, value, onChangeText, placeholder, icon, iconColor, bgColor, props = {}) => (
    <>
      <Text style={[styles.label, darkMode && styles.textWhite]}>{label}</Text>
      <View style={[styles.inputContainer, darkMode && styles.inputContainerDark]}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <FontAwesomeIcon icon={icon} size={14} color={iconColor} />
        </View>
        <TextInput
          style={[styles.inputWithIcon, darkMode && styles.textWhite]}
          placeholder={placeholder}
          placeholderTextColor={darkMode ? '#999' : '#666'}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
      </View>
    </>
  );

  const renderModal = (visible, onClose, title, children) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faTimes} size={20} color={darkMode ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={onBack || (() => navigation.goBack())}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={darkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>User Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.actionButton, darkMode && styles.actionButtonDark]} onPress={handleAddUser}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="person-add" size={20} color="#2196F3" />
            </View>
            <Text style={[styles.actionButtonText, darkMode && styles.textWhite]}>Add New User</Text>
            <Icon name="chevron-right" size={20} color={darkMode ? '#888' : '#ccc'} />
          </TouchableOpacity>
        </View>

        <View style={styles.usersSection}>
          <Text style={[styles.sectionTitle, darkMode && styles.textWhite]}>
            Current Users ({visibleUsers.length})
          </Text>
          {visibleUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, darkMode && styles.textGray]}>No users found</Text>
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
                      {user.isMainUser && <Text style={styles.youLabel}> (You)</Text>}
                    </Text>
                    <Text style={[styles.userEmail, darkMode && styles.textGray]}>{user.email}</Text>
                    <View style={styles.userMeta}>
                      <Text style={[styles.userRole, darkMode && styles.textGray]}>{user.role}</Text>
                      <View style={[styles.statusBadge, user.active !== false ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={styles.statusText}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {canRemoveUser(user) && (
                  <TouchableOpacity
                    style={[styles.removeButton, darkMode && styles.removeButtonDark]}
                    onPress={() => handleRemoveUser(user)}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} size={16} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      {renderModal(showAddUserModal, closeAddUserModal, "Add New User", (
        <>
          <View style={styles.formContainer}>
            {renderInput('Full Name', newUserData.name, (text) => setNewUserData({...newUserData, name: text}), 'Enter full name')}
            {renderIconInput('Email Address', newUserData.email, (text) => setNewUserData({...newUserData, email: text}), 'Enter email address', faEnvelope, '#4CAF50', '#E8F5E9', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            {renderIconInput('Password', newUserData.password, (text) => setNewUserData({...newUserData, password: text}), 'Enter password', faLock, '#FF9800', '#FFF3E0', { secureTextEntry: true })}
            
            <Text style={[styles.label, darkMode && styles.textWhite]}>Role</Text>
            <View style={styles.roleContainer}>
              {['User', 'Admin'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    newUserData.role === role && styles.roleOptionSelected,
                    darkMode && styles.roleOptionDark,
                    newUserData.role === role && darkMode && styles.roleOptionSelectedDark
                  ]}
                  onPress={() => setNewUserData({...newUserData, role})}
                >
                  <Text style={[
                    styles.roleText,
                    newUserData.role === role && styles.roleTextSelected,
                    darkMode && styles.textWhite
                  ]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelButton, darkMode && styles.cancelButtonDark]} onPress={closeAddUserModal}>
              <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>Cancel</Text>
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
        </>
      ))}

      {/* OTP Modal */}
      <Modal visible={showOtpModal} animationType="fade" transparent={true} onRequestClose={closeOtpModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.otpModalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Verify Email</Text>
              <TouchableOpacity onPress={closeOtpModal}>
                <FontAwesomeIcon icon={faTimes} size={20} color={darkMode ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            <View style={styles.otpInfo}>
              <View style={[styles.otpIcon, darkMode && styles.otpIconDark]}>
                <FontAwesomeIcon icon={faLock} size={24} color="#4caf50" />
              </View>
              <Text style={[styles.otpTitle, darkMode && styles.textWhite]}>Enter Verification Code</Text>
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

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
              <Text style={styles.verifyButtonText}>Verify & Add User</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendContainer} onPress={() => handleSendOTP()}>
              <Text style={[styles.resendText, darkMode && styles.textGray]}>
                Didn't receive code? <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Remove User Modal */}
      <Modal visible={showRemoveModal} animationType="fade" transparent={true} onRequestClose={closeRemoveModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.removeModalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>Remove User</Text>
              <TouchableOpacity onPress={closeRemoveModal}>
                <FontAwesomeIcon icon={faTimes} size={20} color={darkMode ? '#fff' : '#333'} />
              </TouchableOpacity>
            </View>

            <View style={styles.removeInfo}>
              <View style={[styles.removeIcon, darkMode && styles.removeIconDark]}>
                <FontAwesomeIcon icon={faTrashAlt} size={24} color="#ff4444" />
              </View>
              <Text style={[styles.removeTitle, darkMode && styles.textWhite]}>Are you sure?</Text>
              <Text style={[styles.removeSubtitle, darkMode && styles.textGray]}>
                You are about to remove <Text style={styles.boldText}>{userToRemove?.name}</Text> from your account. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.removeActions}>
              <TouchableOpacity style={[styles.cancelButton, darkMode && styles.cancelButtonDark]} onPress={closeRemoveModal}>
                <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.removeConfirmButton, isRemoving && styles.buttonDisabled]}
                onPress={confirmRemoveUser}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.removeConfirmButtonText}>Remove User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e0e0e0'
  },
  headerDark: { backgroundColor: '#2a2a2a', borderBottomColor: '#444' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  textWhite: { color: '#fff' },
  textGray: { color: '#999' },
  content: { flex: 1, padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  actionSection: { marginBottom: 30 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15,
    borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4
  },
  actionButtonDark: { backgroundColor: '#2a2a2a' },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  actionButtonText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
  usersSection: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 5 },
  emptySubText: { fontSize: 14, color: '#999' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15,
    borderRadius: 12, marginBottom: 10, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  userCardDark: { backgroundColor: '#2a2a2a' },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  userAvatarDark: { backgroundColor: '#444' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#333' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  youLabel: { fontSize: 14, fontWeight: '500', color: '#4caf50' },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 5 },
  userMeta: { flexDirection: 'row', alignItems: 'center' },
  userRole: { fontSize: 12, color: '#999', marginRight: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadge: { backgroundColor: '#e8f5e9' },
  inactiveBadge: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 10, fontWeight: '500', color: '#4caf50' },
  removeButton: { padding: 10, borderRadius: 8, backgroundColor: '#ffebee' },
  removeButtonDark: { backgroundColor: '#2d1b1b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 0, width: '90%', maxWidth: 400 },
  modalContentDark: { backgroundColor: '#2a2a2a' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  formContainer: { padding: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  inputDark: { borderColor: '#444', backgroundColor: '#1a1a1a', color: '#fff' },
  inputContainer: { flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  inputContainerDark: {
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
  },
  inputWithIcon: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  roleOptionDark: {
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
  },
  roleOptionSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
  },
  roleOptionSelectedDark: {
    borderColor: '#4caf50',
    backgroundColor: '#1a2e1a',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  roleTextSelected: {
    color: '#4caf50',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#1a1a1a',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
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
  otpModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  otpIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  otpIconDark: {
    backgroundColor: '#1a2e1a',
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  otpInputContainer: {
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
    letterSpacing: 3,
  },
  otpInputDark: {
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  verifyButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    marginBottom: 15,
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
  removeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  removeInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  removeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  removeIconDark: {
    backgroundColor: '#2d1b1b',
  },
  removeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  removeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600',
  },
  removeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  removeConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  removeConfirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});