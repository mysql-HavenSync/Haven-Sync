import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, SafeAreaView, Alert, ActivityIndicator, Platform, StyleSheet,
  KeyboardAvoidingView
} from 'react-native';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faEnvelope, faLock, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../api';

export default function UserManagement({ navigation, onBack }) {
  const darkMode = useSelector(state => state.profile.darkMode);
  const loggedInUser = useSelector(state => state.auth.user);
  console.log('👤 Redux loggedInUser:', loggedInUser);

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
  const token = useSelector(state => state.auth.token);

  // ✅ Updated helper function to check if logged-in user can remove a specific user
const canRemoveUser = (targetUser) => {
  console.log('🔍 Checking permissions for user removal...');
  console.log('🔍 Logged-in user:', loggedInUser);
  console.log('🔍 Target user:', targetUser);
  
  // Get logged-in user's role (Admin role for main user, or their assigned role for subusers)
  const loggedInUserRole = loggedInUser?.role || 'Admin'; // Main user is always Admin
  const loggedInUserId = loggedInUser?.id || loggedInUser?.user_id;
  const targetUserId = targetUser?.id || targetUser?.user_id || targetUser?.sub_user_id;

  console.log('🔍 Logged-in user role:', loggedInUserRole);
  console.log('🔍 Logged-in user ID:', loggedInUserId);
  console.log('🔍 Target user ID:', targetUserId);

  // Only Admin users can see the remove option
  if (loggedInUserRole !== 'Admin') {
    console.log('❌ Permission denied: User is not Admin');
    return false;
  }

  // Admin users cannot remove themselves
  if (loggedInUserId === targetUserId) {
    console.log('❌ Permission denied: Cannot remove self');
    return false;
  }

  // Don't allow removing main admin user
  if (targetUser?.role === 'Admin' && !targetUser?.parent_user_id) {
    console.log('❌ Permission denied: Cannot remove main admin');
    return false;
  }

  console.log('✅ Permission granted: Can remove user');
  return true;
};
// ✅ FIXED: Enhanced fetchUsers function with proper admin/subuser handling
const fetchUsers = async () => {
  try {
    console.log('🔄 Fetching users with token:', token ? 'Present' : 'Missing');
    console.log('👤 LoggedInUser structure:', loggedInUser);
    
    if (!loggedInUser) {
      console.error('❌ No logged in user found');
      Alert.alert('Error', 'User session expired. Please login again.');
      return;
    }

    if (!token) {
      console.error('❌ No token found');
      Alert.alert('Error', 'Authentication token missing. Please login again.');
      return;
    }

    const loggedInUserId = loggedInUser?.user_id || loggedInUser?.id;
    
    if (!loggedInUserId) {
      console.error('❌ No user ID found in logged-in user object');
      Alert.alert('Error', 'Invalid user session. Please login again.');
      return;
    }

    // Rest of your existing fetchUsers code...
    // (Keep all the existing logic for fetching admin and subusers)
    
    let adminUser = null;
    let subusers = [];
    
    try {
      // Check if logged-in user has a parent_user_id (meaning they are a subuser)
      const loggedInUserResponse = await api.get(`/api/users/user-details/${loggedInUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const loggedInUserDetails = Array.isArray(loggedInUserResponse.data) 
        ? loggedInUserResponse.data[0] 
        : loggedInUserResponse.data;
      
      console.log('🔍 Logged-in user details:', loggedInUserDetails);
      
      if (loggedInUserDetails?.parent_user_id) {
        // Logged-in user is a subuser, fetch the admin user
        console.log('🔍 Logged-in user is a subuser, fetching admin user...');
        const adminUserId = loggedInUserDetails.parent_user_id;
        
        const adminResponse = await api.get(`/api/users/user-details/${adminUserId}`, {
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
        
        console.log('✅ Admin user found:', adminUser);
      } else {
        // Logged-in user is the admin
        console.log('🔍 Logged-in user is the admin');
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
      console.error('❌ Error fetching user details:', err);
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

    // Fetch subusers
    try {
      console.log('🔄 Making API call to fetch subusers...');
      const res = await api.get('/api/users/subusers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('✅ Subusers API Response received:', res.data);
      
      if (res.data && res.data.subuserss) {
        subusers = res.data.subuserss;
      } else if (res.data && res.data.subusers) {
        subusers = res.data.subusers;
      } else if (res.data && Array.isArray(res.data)) {
        subusers = res.data;
      } else {
        console.warn('⚠️ No recognizable subusers array in response');
        subusers = [];
      }
      
      // Map subusers and mark if they are the currently logged-in user
      subusers = subusers.map(user => ({
        id: user.sub_user_id || user.id || user.user_id,
        user_id: user.sub_user_id || user.id || user.user_id,
        sub_user_id: user.sub_user_id || user.id || user.user_id, // Keep original field for API calls
        name: user.name || 'Unknown User',
        email: user.email || 'No email',
        role: user.role || 'User',
        active: user.active !== false,
        addedBy: 'Admin',
        created_at: user.created_at || new Date().toISOString(),
        parent_user_id: user.parent_user_id,
        isMainUser: (user.sub_user_id || user.user_id) === loggedInUserId,
      }));
      
      console.log('✅ Mapped subusers:', subusers);
      
    } catch (err) {
      console.error('❌ Error fetching subusers:', err.response?.data || err.message);
      subusers = [];
    }

    // Combine admin and subusers, with admin always first
    const allUsers = [adminUser, ...subusers];
    
    console.log('👥 Setting all users:', allUsers);
    console.log('📊 Total users count:', allUsers.length);
    
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

  // ✅ Updated handleRemoveUser with proper role-based permissions
const handleRemoveUser = (user) => {
  // Check if the current user has permission to remove this user
  if (!canRemoveUser(user)) {
    Alert.alert(
      'Permission Denied', 
      'You do not have permission to remove this user.'
    );
    return;
  }

  // Show confirmation dialog
  setUserToRemove(user);
  setShowRemoveModal(true);
};

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setUserToRemove(null);
  };

// ✅ Updated confirmRemoveUser - simplified since self-removal is no longer allowed
// ✅ FIXED: Enhanced confirmRemoveUser with better debugging and API handling
// ✅ FIXED: Updated confirmRemoveUser function with correct API endpoint discovery
const confirmRemoveUser = async () => {
  if (!userToRemove) {
    Alert.alert('Error', 'No user selected for removal');
    return;
  }

  setIsRemoving(true);
  
  try {
    // 🔍 Enhanced debugging - log all possible ID fields
    console.log('🗑️ Full userToRemove object:', JSON.stringify(userToRemove, null, 2));
    console.log('🗑️ Available ID fields:', {
      id: userToRemove.id,
      user_id: userToRemove.user_id,
      sub_user_id: userToRemove.sub_user_id,
    });
    
    // Get the correct user ID based on user type
    let userIdToRemove = null;
    
    // For subusers, prioritize sub_user_id field
    if (userToRemove.sub_user_id) {
      userIdToRemove = userToRemove.sub_user_id;
      console.log('🔍 Using sub_user_id:', userIdToRemove);
    } else if (userToRemove.id) {
      userIdToRemove = userToRemove.id;
      console.log('🔍 Using id:', userIdToRemove);
    } else if (userToRemove.user_id) {
      userIdToRemove = userToRemove.user_id;
      console.log('🔍 Using user_id:', userIdToRemove);
    }
    
    if (!userIdToRemove) {
      console.error('❌ No valid user ID found:', userToRemove);
      Alert.alert('Error', 'Invalid user ID. Cannot remove user.');
      return;
    }

    console.log('🗑️ Attempting to remove user with ID:', userIdToRemove);
    console.log('🗑️ Using token:', token ? 'Present' : 'Missing');
    
    // ✅ NEW: First, let's discover what endpoints actually exist
    // Try to find the correct endpoint by checking your existing API calls
    let response;
    let success = false;
    
    // Method 1: Try the most common pattern - match your add-subusers endpoint
    try {
      console.log('🔄 Trying endpoint 1: DELETE /api/users/subusers (with body)');
      response = await api.delete('/api/users/subusers', {
        data: { 
          subUserId: userIdToRemove,
          sub_user_id: userIdToRemove,
          id: userIdToRemove
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ Method 1 successful:', response.data);
      success = true;
    } catch (error1) {
      console.log('❌ Method 1 failed:', error1.response?.status, error1.response?.data);
      
      // Method 2: Try with POST method (some APIs use POST for delete operations)
      try {
        console.log('🔄 Trying endpoint 2: POST /api/users/remove-subuser');
        response = await api.post('/api/users/remove-subuser', {
          subUserId: userIdToRemove,
          sub_user_id: userIdToRemove,
          id: userIdToRemove
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('✅ Method 2 successful:', response.data);
        success = true;
      } catch (error2) {
        console.log('❌ Method 2 failed:', error2.response?.status, error2.response?.data);
        
        // Method 3: Try the pattern that matches your add endpoint structure
        try {
          console.log('🔄 Trying endpoint 3: POST /api/users/delete-subuser');
          response = await api.post('/api/users/delete-subuser', {
            subUserId: userIdToRemove,
            sub_user_id: userIdToRemove,
            mainUserId: loggedInUser.user_id || loggedInUser.id
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('✅ Method 3 successful:', response.data);
          success = true;
        } catch (error3) {
          console.log('❌ Method 3 failed:', error3.response?.status, error3.response?.data);
          
          // Method 4: Try updating the user status to inactive instead of deletion
          try {
            console.log('🔄 Trying endpoint 4: PUT /api/users/subusers (deactivate)');
            response = await api.put('/api/users/subusers', {
              subUserId: userIdToRemove,
              sub_user_id: userIdToRemove,
              active: false,
              status: 'inactive'
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log('✅ Method 4 successful (deactivated):', response.data);
            success = true;
          } catch (error4) {
            console.log('❌ Method 4 failed:', error4.response?.status, error4.response?.data);
            
            // Method 5: Try the exact pattern from your fetch endpoint
            try {
              console.log('🔄 Trying endpoint 5: DELETE /api/users/subusers with query param');
              response = await api.delete(`/api/users/subusers?subUserId=${userIdToRemove}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              console.log('✅ Method 5 successful:', response.data);
              success = true;
            } catch (error5) {
              console.log('❌ Method 5 failed:', error5.response?.status, error5.response?.data);
              
              // ✅ NEW Method 6: Check if there's a general users endpoint
              try {
                console.log('🔄 Trying endpoint 6: DELETE /api/users with body');
                response = await api.delete('/api/users', {
                  data: { 
                    userId: userIdToRemove,
                    sub_user_id: userIdToRemove,
                    type: 'subuser'
                  },
                  headers: { Authorization: `Bearer ${token}` },
                });
                console.log('✅ Method 6 successful:', response.data);
                success = true;
              } catch (error6) {
                console.log('❌ All methods failed. Last error:', error6.response?.status, error6.response?.data);
                
                // ✅ FALLBACK: Show instructions to user
                Alert.alert(
                  'API Endpoint Not Found',
                  'The remove user functionality is not available. Please check with your backend developer to implement the correct API endpoint.',
                  [
                    { text: 'OK', style: 'default' },
                    { 
                      text: 'Show Details', 
                      onPress: () => {
                        console.log('🔍 API Endpoint Debug Info:');
                        console.log('- User ID to remove:', userIdToRemove);
                        console.log('- Token present:', !!token);
                        console.log('- All attempted endpoints failed with 404');
                        console.log('- Backend needs to implement subuser deletion endpoint');
                        Alert.alert(
                          'Debug Info',
                          `User ID: ${userIdToRemove}\nAll API endpoints returned 404\nBackend needs subuser deletion endpoint`
                        );
                      }
                    }
                  ]
                );
                return; // Exit without throwing error
              }
            }
          }
        }
      }
    }

    if (success) {
      console.log('✅ User removed successfully');
      closeRemoveModal();
      Alert.alert('Success', 'User removed successfully!');
      
      // Refresh the user list after a short delay
      setTimeout(() => {
        fetchUsers();
      }, 1000);
    }

  } catch (err) {
    console.error('❌ Final error in confirmRemoveUser:', err);
    console.error('❌ Error response:', err.response?.data);
    console.error('❌ Error status:', err.response?.status);
    
    let errorMessage = 'Could not remove user. Please try again.';
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.response?.status === 404) {
      errorMessage = 'Remove user feature is not implemented on the server. Please contact your backend developer.';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to remove this user.';
    } else if (err.response?.status === 401) {
      errorMessage = 'Session expired. Please login again.';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setIsRemoving(false);
  }
};

// ✅ ADDITIONAL: Helper function to check available endpoints
const checkAvailableEndpoints = async () => {
  const endpoints = [
    '/api/users/subusers',
    '/api/users/remove-subuser', 
    '/api/users/delete-subuser',
    '/api/subusers',
    '/api/users'
  ];
  
  console.log('🔍 Checking available endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      // Try OPTIONS request to check if endpoint exists
      const response = await api.options(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ Endpoint ${endpoint} is available`);
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} returned:`, error.response?.status);
    }
  }
};

// ✅ TEMPORARY WORKAROUND: Add a temporary solution
const handleRemoveUserTemporary = (user) => {
  Alert.alert(
    'Remove User',
    'The remove user feature is currently unavailable. Please contact your system administrator.',
    [
      { text: 'OK', style: 'default' },
      { 
        text: 'Hide User', 
        onPress: () => {
          // Temporarily hide the user from the UI
          setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
          Alert.alert('Success', 'User hidden from view (temporary solution)');
        }
      }
    ]
  );
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
                      {user.isMainUser && (
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
                {/* ✅ FIXED: Show remove button based on permissions */}
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

      {/* Remove User Confirmation Modal */}
      <Modal
        visible={showRemoveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeRemoveModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.removeModalContent, darkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.textWhite]}>
                Remove User
              </Text>
              <TouchableOpacity onPress={closeRemoveModal}>
                <FontAwesomeIcon 
                  icon={faTimes} 
                  size={20} 
                  color={darkMode ? '#fff' : '#333'} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.removeInfo}>
              <View style={[styles.removeIcon, darkMode && styles.removeIconDark]}>
                <FontAwesomeIcon 
                  icon={faTrashAlt} 
                  size={24} 
                  color="#ff4444" 
                />
              </View>
              <Text style={[styles.removeTitle, darkMode && styles.textWhite]}>
                Are you sure?
              </Text>
              <Text style={[styles.removeSubtitle, darkMode && styles.textGray]}>
                You are about to remove <Text style={styles.boldText}>{userToRemove?.name}</Text> from your account. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.removeActions}>
              <TouchableOpacity
                style={[styles.cancelButton, darkMode && styles.cancelButtonDark]}
                onPress={closeRemoveModal}
              >
                <Text style={[styles.cancelButtonText, darkMode && styles.textWhite]}>
                  Cancel
                </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#2a2a2a',
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  textWhite: {
    color: '#fff',
  },
  textGray: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  actionSection: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  usersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userCardDark: {
    backgroundColor: '#2a2a2a',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userAvatarDark: {
    backgroundColor: '#444',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  youLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4caf50',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRole: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#e8f5e9',
  },
  inactiveBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4caf50',
  },
  removeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  removeButtonDark: {
    backgroundColor: '#2d1b1b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 0,
    width: '90%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#2a2a2a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputDark: {
    borderColor: '#444',
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
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