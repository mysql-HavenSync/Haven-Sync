// src/services/WebSocketService.js
import { store } from '../redux/store';
import { updateDeviceStatus, updateDeviceState } from '../redux/slices/switchSlice';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.messageQueue = [];
    this.deviceSubscriptions = new Set();
  }

  connect(token, userId) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `wss://havensync.hexahavenintegrations.com/ws?token=${token}&userId=${userId}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Process any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
        
        // Subscribe to all user devices
        this.subscribeToUserDevices();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token, userId);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
    }
  }

  scheduleReconnect(token, userId) {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect(token, userId);
    }, delay);
  }

  handleMessage(data) {
    console.log('📨 WebSocket message received:', data);
    
    switch (data.type) {
      case 'device_status':
        this.handleDeviceStatus(data);
        break;
      case 'device_state_update':
        this.handleDeviceStateUpdate(data);
        break;
      case 'device_connected':
        this.handleDeviceConnected(data);
        break;
      case 'device_disconnected':
        this.handleDeviceDisconnected(data);
        break;
      case 'error':
        console.error('❌ WebSocket error message:', data.message);
        break;
      default:
        console.log('🔍 Unknown message type:', data.type);
    }
  }

  handleDeviceStatus(data) {
    const { deviceId, status, signalStrength } = data;
    store.dispatch(updateDeviceStatus({
      deviceId,
      status,
      signalStrength,
      lastSeen: new Date().toISOString()
    }));
  }

  handleDeviceStateUpdate(data) {
    const { deviceId, switches, regulators } = data;
    store.dispatch(updateDeviceState({
      deviceId,
      switches: switches || [],
      regulators: regulators || []
    }));
  }

  handleDeviceConnected(data) {
    const { deviceId } = data;
    store.dispatch(updateDeviceStatus({
      deviceId,
      status: 'online',
      isConnected: true,
      lastSeen: new Date().toISOString()
    }));
  }

  handleDeviceDisconnected(data) {
    const { deviceId } = data;
    store.dispatch(updateDeviceStatus({
      deviceId,
      status: 'offline',
      isConnected: false,
      lastSeen: new Date().toISOString()
    }));
  }

  subscribeToUserDevices() {
    if (this.isConnected()) {
      const message = {
        type: 'subscribe_user_devices',
        timestamp: new Date().toISOString()
      };
      this.send(message);
    }
  }

  subscribeToDevice(deviceId) {
    if (this.deviceSubscriptions.has(deviceId)) {
      return; // Already subscribed
    }

    const message = {
      type: 'subscribe_device',
      deviceId,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected()) {
      this.send(message);
      this.deviceSubscriptions.add(deviceId);
    } else {
      this.messageQueue.push(message);
    }
  }

  unsubscribeFromDevice(deviceId) {
    const message = {
      type: 'unsubscribe_device',
      deviceId,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected()) {
      this.send(message);
    }
    
    this.deviceSubscriptions.delete(deviceId);
  }

  sendDeviceCommand(deviceId, command) {
    const message = {
      type: 'device_command',
      deviceId,
      command,
      timestamp: new Date().toISOString()
    };

    if (this.isConnected()) {
      this.send(message);
    } else {
      console.warn('⚠️ WebSocket not connected, queueing command');
      this.messageQueue.push(message);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not ready, message queued');
      this.messageQueue.push(message);
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.deviceSubscriptions.clear();
    this.messageQueue = [];
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;