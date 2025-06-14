import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, TextInput, Alert, Animated, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom Animated Popup Component
const AnimatedOptionsPopup = React.memo(({ 
  visible, 
  onClose, 
  options, 
  title, 
  subtitle,
  darkMode,
  position = { x: screenWidth / 2, y: screenHeight / 2 }
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity 
        style={s.popupOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            s.popupContainer,
            darkMode && s.popupContainerDark,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim }
              ],
            }
          ]}
        >
          {/* Popup Header */}
          <View style={s.popupHeader}>
            <Text style={[s.popupTitle, darkMode && s.textDark]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[s.popupSubtitle, darkMode && s.subtextDark]}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Popup Options */}
          <View style={s.popupOptions}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  s.popupOption,
                  darkMode && s.popupOptionDark,
                  option.style === 'destructive' && s.popupOptionDestructive,
                  option.style === 'cancel' && s.popupOptionCancel,
                  index === options.length - 1 && s.popupOptionLast
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(() => option.onPress?.(), 100);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.popupOptionText,
                  darkMode && s.textDark,
                  option.style === 'destructive' && s.popupOptionTextDestructive,
                  option.style === 'cancel' && s.popupOptionTextCancel
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
});

// Animated Fan Icon
const AnimatedFanIcon = React.memo(({ speed = 0, size = 16, color = '#000' }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (speed > 0) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: Math.max(500, 2000 - (speed * 300)),
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [speed, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Text style={{ fontSize: size, color }}>🌀</Text>
    </Animated.View>
  );
});

// Icon Component
const IconComponent = React.memo(({ name, size = 16, color = '#000', device }) => {
  const icons = {
    'plus': '+', 'switch': '🔘', 'sofa': '🛋️', 'bed': '🛏️', 'chef-hat': '👨‍🍳', 
    'home': '🏠', 'trash': '🗑️', 'wifi-off': '📶', 'search': '🔍', 'plug': '🔌', 
    'settings': '⚙️', 'external-link': '🔗'
  };

  if (name === 'fan' || (device && ['speed_regulator', 'fan'].includes(device.type))) {
    return <AnimatedFanIcon speed={device?.speedLevel || 0} size={size} color={color} />;
  }

  return <Text style={{ fontSize: size, color }}>{icons[name] || '🌀'}</Text>;
});

// Generic Item Component (handles both devices and groups)
const ItemComponent = React.memo(({ 
  item, 
  type, 
  isSelected, 
  darkMode, 
  devices, 
  onSelect, 
  onLongPress,
  onDevicePage,
  getDeviceStatus 
}) => {
  const lastTap = useRef(null);
  const tapTimeout = useRef(null);
  
  const handlePress = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (type === 'device') {
      if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
        clearTimeout(tapTimeout.current);
        onDevicePage?.(item);
      } else {
        lastTap.current = now;
        tapTimeout.current = setTimeout(() => {
          onSelect(item, type);
        }, DOUBLE_PRESS_DELAY);
      }
    } else {
      onSelect(item, type);
    }
  }, [item, type, onSelect, onDevicePage]);

  const handleLongPress = useCallback(() => {
    clearTimeout(tapTimeout.current);
    onLongPress(item, type);
  }, [item, type, onLongPress]);

  // Group-specific calculations
  const groupData = useMemo(() => {
    if (type !== 'group') return null;
    const groupDevices = devices.filter(d => item.deviceIds.includes(d.id));
    const activeCount = groupDevices.filter(d => d.isOn).length;
    const avgSpeed = groupDevices.filter(d => ['speed_regulator', 'fan'].includes(d.type))
      .reduce((sum, d, _, arr) => sum + (d.speedLevel || 0) / arr.length, 0);
    
    return {
      deviceCount: item.deviceIds.length,
      activeCount,
      avgSpeed: Math.round(avgSpeed),
      groupWithFanData: { ...item, speedLevel: Math.round(avgSpeed) }
    };
  }, [type, item, devices]);

  return (
    <TouchableOpacity
      style={[
        s.item,
        isSelected && [s.itemActive, type === 'group' && { backgroundColor: item.color }],
        darkMode && s.itemDark
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={s.itemContent}>
        <View style={[s.iconContainer, isSelected && s.iconContainerActive]}>
          <IconComponent 
            name={item.icon} 
            size={16} 
            color={isSelected ? '#fff' : (type === 'group' ? item.color : '#6b7280')} 
            device={type === 'group' ? groupData?.groupWithFanData : item}
          />
        </View>
        
        <View style={s.itemInfo}>
          <Text style={[s.itemText, isSelected && s.itemTextActive, darkMode && s.textDark]}>
            {item.name}
          </Text>
          <Text style={[s.statusText, isSelected && s.statusTextActive, darkMode && s.subtextDark]}>
            {type === 'device' 
              ? getDeviceStatus(item)
              : `${groupData?.deviceCount || 0} devices${groupData?.deviceCount ? ` • ${groupData.activeCount} active` : ''}`
            }
          </Text>
          {/* No additional content for device here */}
        </View>
        
        {type === 'device' ? (
          <View style={s.connectionIndicator}>
            <View style={[s.statusDot, { backgroundColor: item.isConnected ? '#10b981' : '#ef4444' }]} />
            
          </View>
        ) : (
          <View style={[s.badge, isSelected && s.badgeActive]}>
            <Text style={s.badgeText}>{groupData?.deviceCount || 0}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const DeviceNavigationDrawer = ({ onDeviceSelect, onGroupSelect, selectedItem }) => {
  const dispatch = useDispatch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deletingGroupId, setDeletingGroupId] = useState(null);

  const navigation = useNavigation();
  const darkMode = useSelector(state => state.profile?.darkMode);
  const connectedDevices = useSelector(state => state.switches?.activeDevices || []);

  const [devices, setDevices] = useState([]);
  const [customDeviceNames, setCustomDeviceNames] = useState({});

  // Custom popup state
  const [showOptionsPopup, setShowOptionsPopup] = useState(false);
  const [popupOptions, setPopupOptions] = useState([]);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');

  // Update devices with custom names
  const devicesList = useMemo(() => {
    return connectedDevices.map((device, index) => ({
      id: device.id,
      name: customDeviceNames[device.id] || device.name,
      type: device.type === '3-channel' ? 'switch' : device.type,
      icon: device.type === '3-channel' ? 'plug' : 
            ['speed_regulator', 'fan'].includes(device.type) ? 'fan' : 'switch',
      isOn: device.isOn || device.switches?.some(s => s) || false,
      
      speedLevel: device.speedLevel || (device.switches ? device.switches.filter(s => s).length : 0),
      isConnected: device.isConnected !== false,
      originalDevice: device,
      deviceIndex: index
    }));
  }, [connectedDevices, customDeviceNames]);

  useEffect(() => {
    setDevices(devicesList);
  }, [devicesList]);

  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const getDeviceStatus = useCallback((device) => {
    if (device.type === '3-channel' || device.speedLevel !== undefined) {
      const activeCount = device.speedLevel || 0;
      return activeCount > 0 ? `${activeCount} switches on` : 'All off';
    }
    if (['speed_regulator', 'fan'].includes(device.type)) {
      return device.speedLevel > 0 ? `Speed ${device.speedLevel}` : (device.isOn ? 'On' : 'Off');
    }
    return device.isOn ? 'On' : 'Off';
  }, []);

  const ungroupedDevices = useMemo(() => {
    const groupedIds = groups.flatMap(g => g.deviceIds);
    return devices.filter(d => !groupedIds.includes(d.id));
  }, [devices, groups]);

  const handleSelect = useCallback((item, type) => {
    if (type === 'device') {
      const currentDeviceState = connectedDevices.find(d => d.id === item.id) || item.originalDevice;
      const deviceWithCurrentState = {
        ...item,
        isOn: currentDeviceState.isOn || currentDeviceState.switches?.some(s => s) || false,
        speedLevel: currentDeviceState.speedLevel || (currentDeviceState.switches ? currentDeviceState.switches.filter(s => s).length : 0),
        isConnected: currentDeviceState.isConnected !== false,
        originalDevice: currentDeviceState,
        dispatch
      };
      onDeviceSelect?.(deviceWithCurrentState);
    } else {
      const groupDevices = devices.filter(d => item.deviceIds.includes(d.id));
      onGroupSelect?.({ ...item, devices: groupDevices, dispatch });
    }
  }, [devices, dispatch, onDeviceSelect, onGroupSelect, connectedDevices]);

  const handleDevicePage = useCallback((device) => {
    const currentDeviceState = connectedDevices.find(d => d.id === device.id) || device.originalDevice;
    const deviceWithCurrentState = {
      ...device,
      isOn: currentDeviceState.isOn || currentDeviceState.switches?.some(s => s) || false,
      speedLevel: currentDeviceState.speedLevel || (currentDeviceState.switches ? currentDeviceState.switches.filter(s => s).length : 0),
      isConnected: currentDeviceState.isConnected !== false,
      originalDevice: currentDeviceState,
      dispatch
    };

    navigation.navigate('DevicePage', { 
      device: deviceWithCurrentState,
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type
    });
  }, [connectedDevices, dispatch, navigation]);

  const openModal = useCallback((type, item = null, value = '') => {
    setModalType(type);
    setEditingItem(item ? {
      ...item,
      deviceIds: Array.isArray(item.deviceIds) ? [...item.deviceIds] : []
    } : null);
    setInputValue(value);
    setShowModal(true);
  }, []);

  // Enhanced long press handler with custom popup
  const handleLongPress = useCallback((item, type) => {
    const deviceOptions = [
      { text: 'Edit Name', onPress: () => openModal('editDevice', item, item.name) },
      { text: 'Move to Group', onPress: () => openModal('moveToGroup', item) },
      { text: 'Cancel', style: 'cancel', onPress: () => {} }
    ];

    const groupOptions = [
      { text: 'Manage Devices', onPress: () => openModal('manageGroup', item) },
      { text: 'Rename Group', onPress: () => openModal('editGroup', item, item.name) },
      { text: 'Delete Group', style: 'destructive', onPress: () => deleteGroup(item.id) },
      { text: 'Cancel', style: 'cancel', onPress: () => {} }
    ];
    
    const options = type === 'device' ? deviceOptions : groupOptions;
    
    setPopupTitle(`${type === 'device' ? 'Device' : 'Group'} Options`);
    setPopupSubtitle(`Options for "${item.name}"`);
    setPopupOptions(options);
    setShowOptionsPopup(true);
  }, [groups, openModal]);

  const updateDeviceName = useCallback(() => {
    if (!inputValue.trim()) return;
    
    setCustomDeviceNames(prev => ({
      ...prev,
      [editingItem.id]: inputValue.trim()
    }));
    
    setShowModal(false);
    setEditingItem(null);
    setInputValue('');
  }, [inputValue, editingItem]);

  const createOrEditGroup = useCallback(() => {
    if (!inputValue.trim()) return;
    
    if (modalType === 'createGroup') {
      const colors = ['#6366f1', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777'];
      const icons = ['home', 'sofa', 'bed', 'chef-hat', 'fan', 'plug'];
      
      const newGroup = {
        id: `group-${Date.now()}`,
        name: inputValue.trim(),
        icon: icons[groups.length % icons.length],
        deviceIds: [],
        color: colors[groups.length % colors.length],
      };
      setGroups(prev => [...prev, newGroup]);
    } else if (modalType === 'editGroup') {
      setGroups(prev => prev.map(g => 
        g.id === editingItem.id ? { ...g, name: inputValue.trim() } : g
      ));
    } else if (modalType === 'editDevice') {
      updateDeviceName();
      return;
    }
    
    setShowModal(false);
    setEditingItem(null);
    setInputValue('');
  }, [inputValue, modalType, editingItem, groups.length, updateDeviceName]);

  const moveDeviceToGroup = useCallback((deviceId, groupId) => {
    setGroups(prev => prev.map(group => ({
      ...group,
      deviceIds: group.id === groupId 
        ? [...group.deviceIds.filter(id => id !== deviceId), deviceId]
        : group.deviceIds.filter(id => id !== deviceId)
    })));
    setShowModal(false);
  }, []);

  const toggleDeviceInGroup = useCallback((deviceId, groupId) => {
    console.log('Toggling device:', deviceId, 'in group:', groupId);
    
    setGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        if (group.id !== groupId) return group;

        const isInGroup = group.deviceIds.includes(deviceId);
        const updatedDeviceIds = isInGroup
          ? group.deviceIds.filter(id => id !== deviceId)
          : [...group.deviceIds, deviceId];

        console.log('Updated deviceIds for group:', updatedDeviceIds);
        return { ...group, deviceIds: updatedDeviceIds };
      });
      
      return updatedGroups;
    });

    setEditingItem(prev => {
      if (!prev || prev.id !== groupId) return prev;
      
      const isInGroup = prev.deviceIds.includes(deviceId);
      const updatedDeviceIds = isInGroup
        ? prev.deviceIds.filter(id => id !== deviceId)
        : [...prev.deviceIds, deviceId];

      console.log('Updated editingItem deviceIds:', updatedDeviceIds);
      return { ...prev, deviceIds: updatedDeviceIds };
    });
  }, []);

  const deleteGroup = useCallback((groupId) => {
  setDeletingGroupId(groupId);
  setShowDeleteConfirm(true);
}, []);


  const renderModal = useCallback(() => {
    const baseStyle = [s.modalContent, darkMode && s.modalContentDark];
    
    switch (modalType) {
      case 'moveToGroup':
        return (
          <View style={baseStyle}>
            <Text style={[s.modalTitle, darkMode && s.textDark]}>
              Move "{editingItem?.name}" to Group
            </Text>
            <ScrollView style={s.optionsList}>
              <TouchableOpacity
                style={[s.optionItem, s.createOption]}
                onPress={() => { setShowModal(false); setTimeout(() => openModal('createGroup'), 100); }}
              >
                <Text style={s.optionText}>+ Create New Group</Text>
              </TouchableOpacity>
              {groups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={s.optionItem}
                  onPress={() => moveDeviceToGroup(editingItem.id, group.id)}
                >
                  <Text style={s.optionText}>{group.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.cancelButton} onPress={() => setShowModal(false)}>
              <Text style={s.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'createGroup':
      case 'editGroup':
      case 'editDevice':
        return (
          <View style={baseStyle}>
            <Text style={[s.modalTitle, darkMode && s.textDark]}>
              {modalType === 'createGroup' ? 'Create Group' : 
               modalType === 'editGroup' ? 'Edit Group' : 'Edit Device Name'}
            </Text>
            <TextInput
              style={[s.modalInput, darkMode && s.modalInputDark]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={modalType === 'editDevice' ? 'Device name' : 'Group name'}
              placeholderTextColor={darkMode ? '#9ca3af' : '#6b7280'}
              autoFocus
            />
            <View style={s.modalButtons}>
              <TouchableOpacity style={s.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={s.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveButton} onPress={createOrEditGroup}>
                <Text style={s.saveButtonText}>
                  {modalType === 'createGroup' ? 'Create' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'manageGroup':
        return (
          <View style={[baseStyle, { maxHeight: '80%' }]}>
            <Text style={[s.modalTitle, darkMode && s.textDark]}>
              Manage "{editingItem?.name}"
            </Text>
            <Text style={[s.modalSubtitle, darkMode && s.subtextDark]}>
              Select devices to add/remove from this group
            </Text>
            
            <ScrollView style={s.deviceScrollView} showsVerticalScrollIndicator={true}>
              {devices.length === 0 ? (
                <View style={s.noDevicesContainer}>
                  <Text style={[s.noDevicesText, darkMode && s.textDark]}>
                    No devices available
                  </Text>
                </View>
              ) : (
                devices.map(device => {
                  const isInGroup = editingItem?.deviceIds?.includes(device.id) ?? false;
                  
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        s.deviceItem, 
                        isInGroup && s.deviceItemSelected,
                        darkMode && s.deviceItemDark,
                        isInGroup && darkMode && s.deviceItemSelectedDark
                      ]}
                      onPress={() => {
                        console.log('Device pressed:', device.id, device.name);
                        toggleDeviceInGroup(device.id, editingItem?.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={s.deviceItemContent}>
                        <View style={s.deviceInfo}>
                          <Text style={[s.deviceName, darkMode && s.textDark]}>
                            {device.name}
                          </Text>
                          
                        </View>
                        <View style={[s.checkbox, isInGroup && s.checkboxSelected]}>
                          <Text style={[s.checkboxText, isInGroup && s.checkboxTextSelected]}>
                            {isInGroup ? '✓' : '○'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            
            <View style={s.modalFooter}>
              <Text style={[s.selectedCount, darkMode && s.subtextDark]}>
                {editingItem?.deviceIds?.length || 0} devices selected
              </Text>
              <TouchableOpacity 
                style={s.saveButton} 
                onPress={() => {
                  console.log('Saving group with devices:', editingItem?.deviceIds);
                  setShowModal(false);
                }}
              >
                <Text style={s.saveButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  }, [modalType, editingItem, groups, devices, darkMode, inputValue, openModal, moveDeviceToGroup, createOrEditGroup, toggleDeviceInGroup]);

  if (devices.length === 0) {
    return (
      <View style={[s.container, darkMode && s.containerDark]}>
        <View style={s.header}>
          <Text style={[s.headerTitle, darkMode && s.textDark]}>Devices & Groups</Text>
          <TouchableOpacity style={s.addButton} onPress={() => openModal('createGroup')}>
            <Text style={s.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={s.emptyState}>
          <Text style={[s.emptyTitle, darkMode && s.textDark]}>No Connected Devices</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, darkMode && s.containerDark]}>
      <View style={s.header}>
        <Text style={[s.headerTitle, darkMode && s.textDark]}>Devices & Groups</Text>
        <View style={s.headerRight}>
          <Text style={[s.connectedCount, darkMode && s.connectedCountDark]}>
            {devices.length} connected
          </Text>
          <TouchableOpacity style={s.addButton} onPress={() => openModal('createGroup')}>
            <Text style={s.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scrollView}>
        {groups.map(group => (
          <ItemComponent
            key={group.id}
            item={group}
            type="group"
            isSelected={selectedItem?.id === group.id}
            darkMode={darkMode}
            devices={devices}
            onSelect={handleSelect}
            onLongPress={handleLongPress}
            onDevicePage={handleDevicePage}
            getDeviceStatus={getDeviceStatus}
          />
        ))}

        {ungroupedDevices.map(device => (
          <ItemComponent
            key={device.id}
            item={device}
            type="device"
            isSelected={selectedItem?.id === device.id}
            darkMode={darkMode}
            devices={devices}
            onSelect={handleSelect}
            onLongPress={handleLongPress}
            onDevicePage={handleDevicePage}
            getDeviceStatus={getDeviceStatus}
          />
        ))}
      </ScrollView>

      {/* Custom Animated Options Popup */}
      <AnimatedOptionsPopup
        visible={showOptionsPopup}
        onClose={() => setShowOptionsPopup(false)}
        options={popupOptions}
        title={popupTitle}
        subtitle={popupSubtitle}
        darkMode={darkMode}
      />

      {/* Existing Modal for other operations */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalOverlay}>{renderModal()}</View>
      </Modal>
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
  <View style={s.modalOverlay}>
    <View style={[s.deleteModalBox, darkMode && s.deleteModalBoxDark]}>
      <Text style={[s.deleteTitle, darkMode && s.textDark]}>Delete Group</Text>
      <Text style={[s.deleteMessage, darkMode && s.subtextDark]}>Are you sure?</Text>
      <View style={s.deleteActions}>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(false)}>
          <Text style={s.deleteCancelText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setGroups(prev => prev.filter(g => g.id !== deletingGroupId));
          setShowDeleteConfirm(false);
        }}>
          <Text style={s.deleteConfirmText}>DELETE</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </View>
  );
};

const s = StyleSheet.create({
  container: { backgroundColor: 'transparent', flex: 1 },
  containerDark: { backgroundColor: 'transparent' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectedCount: { fontSize: 12, fontWeight: '500', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,marginBottom: 5 },
  connectedCountDark: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  addButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  textDark: { color: '#f9fafb' },
  
  scrollView: { paddingHorizontal: 16 },
  
  item: { 
    width: 200, 
    height: 70,
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 0, 
    marginRight: 5, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 2,
    shadowRadius: 2,
    elevation: 2
  },
  itemDark: { backgroundColor: '#374151', borderColor: '#4b5563' },
  itemActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  
  itemContent: { flexDirection: 'row', alignItems: 'center' },
  
  iconContainer: { 
    width: 30, 
    height:30, 
    borderRadius: 50, 
    backgroundColor: '#e5e7eb', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15,
    marginLeft: 10,
  },
  iconContainerActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  
  itemInfo: { flex: 5 },
  itemText: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 5 , marginTop: 8},
  itemTextActive: { color: '#fff' },
  statusText: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  statusTextActive: { color: 'rgba(255, 255, 255, 0.8)' },
  hintText: { fontSize: 10, color: '#9ca3af', fontStyle: 'italic', marginTop: 2 , marginBottom: 2,  },
  hintTextActive: { color: 'rgba(255, 255, 255, 0.6)' },
  subtextDark: { color: '#9ca3af' ,marginBottom: 20},
  
  connectionIndicator: { alignItems: 'flex-end' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4, marginRight: 20 },
  radarId: { fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' },
  
  badge: { 
    minWidth: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#e5e7eb', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 20, 
  },
  badgeActive: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' },
  
  // Custom Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    minWidth: 280,
    maxWidth: screenWidth - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8
  },
  popupContainerDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    borderWidth: 1
  },
  popupHeader: {
    marginBottom: 16,
    alignItems: 'center'
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center'
  },
  popupOptions: {
    gap: 2
  },
  popupOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 2
  },
  popupOptionDark: {
    backgroundColor: '#4b5563'
  },
  popupOptionDestructive: {
    backgroundColor: '#fef2f2'
  },
  popupOptionCancel: {
    backgroundColor: '#f3f4f6',
    marginTop: 8
  },
  popupOptionLast: {
    marginBottom: 0
  },
  popupOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center'
  },
  popupOptionTextDestructive: {
    color: '#dc2626'
  },
  popupOptionTextCancel: {
    color: '#6b7280'
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8
  },
  modalContentDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
    borderWidth: 1
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16
  },
  modalInputDark: {
    backgroundColor: '#4b5563',
    borderColor: '#6b7280',
    color: '#f9fafb'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280'
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff'
  },
  
  // Options List Styles
  optionsList: {
    maxHeight: 300,
    marginBottom: 16
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  createOption: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center'
  },
  
  // Device Management Styles
  deviceScrollView: {
    maxHeight: 400,
    marginBottom: 16
  },
  noDevicesContainer: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  noDevicesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center'
  },
  deviceItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  deviceItemDark: {
    backgroundColor: '#4b5563',
    borderColor: '#6b7280'
  },
  deviceItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  deviceItemSelectedDark: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6'
  },
  deviceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  deviceType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize'
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6'
  },
  checkboxText: {
    fontSize: 14,
    color: '#d1d5db'
  },
  checkboxTextSelected: {
    color: '#fff',
    fontWeight: 'bold'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selectedCount: {
    fontSize: 14,
    color: '#6b7280'
  },
  deleteModalBox: {
  backgroundColor: '#fff',
  padding: 24,
  borderRadius: 12,
  width: '90%',
  maxWidth: 320,
  alignItems: 'center',
  elevation: 10
},
deleteModalBoxDark: {
  backgroundColor: '#1f2937',
  borderColor: '#374151',
  borderWidth: 1
},
deleteTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#111827',
  marginBottom: 8
},
deleteMessage: {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 24
},
deleteActions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%'
},
deleteCancelText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#047857', // green-700
  paddingHorizontal: 16
},
deleteConfirmText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#b91c1c', // red-700
  paddingHorizontal: 16
}

});

export default DeviceNavigationDrawer;