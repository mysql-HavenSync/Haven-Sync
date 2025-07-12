// src/hooks/useDeviceConnection.js
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { webSocketService } from '../services/WebSocketService';
import { 
  controlDevice, 
  fetchUserDevices, 
  fetchDeviceStatus,
  setWebSocketConnected 
} from '../redux/slices/switchSlice';

export const useDeviceConnection = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const { devices, wsConnected } = useSelector(state => state.switches);

  // Initialize WebSocket connection
  useEffect(() => {
    if (token && user?.user_id) {
      console.log('🔌 Initializing WebSocket connection...');
      webSocketService.connect(token, user.user_id);
      
      // Set up connection status listener
      const checkConnection = () => {
        const connected = webSocketService.isConnected();
        dispatch(setWebSocketConnected(connected));
      };
      
      const interval = setInterval(checkConnection, 5000);
      checkConnection(); // Initial check
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [token, user?.user_id, dispatch]);

  // Fetch initial device data
  useEffect(() => {
    if (token) {
      dispatch(fetchUserDevices());
    }
  }, [token, dispatch]);

  // Subscribe to device updates when devices change
  useEffect(() => {
    if (wsConnected && devices.length > 0) {
      devices.forEach(device => {
        webSocketService.subscribeToDevice(device.id);
      });
    }
  }, [wsConnected, devices]);

  // Device control functions
  const controlDeviceSwitch = useCallback(async (deviceId, switchIndex, state) => {
    const command = {
      type: 'switch',
      index: switchIndex,
      state: state
    };
    
    try {
      // Send WebSocket command for real-time response
      webSocketService.sendDeviceCommand(deviceId, command);
      
      // Also dispatch Redux action for state management
      await dispatch(controlDevice({ deviceId, command }));
    } catch (error) {
      console.error('❌ Switch control error:', error);
    }
  }, [dispatch]);

  const controlDeviceRegulator = useCallback(async (deviceId, regulatorIndex, value) => {
    const command = {
      type: 'regulator',
      index: regulatorIndex,
      value: value
    };
    
    try {
      // Send WebSocket command for real-time response
      webSocketService.sendDeviceCommand(deviceId, command);
      
      // Also dispatch Redux action for state management
      await dispatch(controlDevice({ deviceId, command }));
    } catch (error) {
      console.error('❌ Regulator control error:', error);
    }
  }, [dispatch]);

  const refreshDeviceStatus = useCallback(async (deviceId) => {
    try {
      await dispatch(fetchDeviceStatus(deviceId));
    } catch (error) {
      console.error('❌ Device status refresh error:', error);
    }
  }, [dispatch]);

  const refreshAllDevices = useCallback(async () => {
    try {
      await dispatch(fetchUserDevices());
    } catch (error) {
      console.error('❌ All devices refresh error:', error);
    }
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return {
    devices,
    wsConnected,
    controlDeviceSwitch,
    controlDeviceRegulator,
    refreshDeviceStatus,
    refreshAllDevices,
  };
};

export default useDeviceConnection;