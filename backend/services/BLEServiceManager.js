// Enhanced BLE Service with improved connection flow and error handling
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-status';

class EnhancedBLEService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.isScanning = false;
    this.connectionTimeout = 30000; // 30 seconds
    this.scanTimeout = 20000; // 20 seconds
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
    
    // Service and characteristic UUIDs
    this.SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
    this.CHARACTERISTIC_UUID = 'abcd1234-ab12-cd34-ef56-1234567890ab';
    
    this.setupBLEStateListener();
  }

  setupBLEStateListener() {
    this.manager.onStateChange((state) => {
      console.log('🔧 BLE State Changed:', state);
      if (state === 'PoweredOff') {
        this.cleanup();
      }
    });
  }

  // Enhanced permission handling
  async requestPermissions() {
    if (Platform.OS === 'android') {
      const permissions = Platform.Version >= 31 ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ] : [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      try {
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          throw new Error('Required permissions not granted');
        }
        
        console.log('✅ All BLE permissions granted');
        return true;
      } catch (error) {
        console.error('❌ Permission request failed:', error);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission requests for BLE
  }

  // Check if Bluetooth is enabled
  async checkBluetoothState() {
    try {
      const state = await BluetoothStateManager.getState();
      console.log('📡 Bluetooth state:', state);
      
      if (state !== 'on') {
        throw new Error('Bluetooth is not enabled');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Bluetooth state check failed:', error);
      return false;
    }
  }

  // Enhanced device scanning with better error handling
  async scanForDevice(targetDeviceId, onDeviceFound = null, onProgress = null) {
    console.log('🔍 Starting scan for device:', targetDeviceId);
    
    // Check prerequisites
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Required permissions not granted');
    }

    const bluetoothEnabled = await this.checkBluetoothState();
    if (!bluetoothEnabled) {
      throw new Error('Bluetooth is not enabled');
    }

    return new Promise((resolve, reject) => {
      let scanSubscription;
      let foundDevice = null;
      let scanTimer;
      
      const cleanup = () => {
        if (scanSubscription) {
          scanSubscription.remove();
        }
        if (scanTimer) {
          clearTimeout(scanTimer);
        }
        if (this.isScanning) {
          this.manager.stopDeviceScan();
          this.isScanning = false;
        }
      };

      // Set up scan timeout
      scanTimer = setTimeout(() => {
        cleanup();
        reject(new Error(`Device "${targetDeviceId}" not found within ${this.scanTimeout / 1000} seconds`));
      }, this.scanTimeout);

      // Start scanning
      this.isScanning = true;
      scanSubscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.manager.startDeviceScan(null, null, (error, scannedDevice) => {
            if (error) {
              console.error('❌ Scan error:', error);
              cleanup();
              reject(error);
              return;
            }

            // Report progress
            if (onProgress && scannedDevice?.name) {
              onProgress(scannedDevice.name);
            }

            // Call device found callback
            if (onDeviceFound && scannedDevice?.name) {
              onDeviceFound({
                id: scannedDevice.id,
                name: scannedDevice.name,
                rssi: scannedDevice.rssi
              });
            }

            // Check if this is our target device
            if (scannedDevice?.name === targetDeviceId) {
              console.log('✅ Target device found:', scannedDevice.name);
              foundDevice = scannedDevice;
              cleanup();
              resolve(foundDevice);
            }
          });
        }
      }, true);
    });
  }

  // Enhanced connection with retry logic
  async connectToDevice(device) {
    console.log('🔗 Attempting to connect to device:', device.name);
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/${this.retryAttempts}`);
        
        // Set connection timeout
        const connectionPromise = device.connect({ timeout: this.connectionTimeout });
        
        this.connectedDevice = await connectionPromise;
        console.log('✅ Connected to device:', device.name);
        
        // Discover services and characteristics
        await this.connectedDevice.discoverAllServicesAndCharacteristics();
        console.log('✅ Services and characteristics discovered');
        
        return this.connectedDevice;
        
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
        
        // Clean up failed connection
        if (this.connectedDevice) {
          try {
            await this.connectedDevice.disconnect();
          } catch (disconnectError) {
            console.warn('⚠️  Disconnect after failed connection error:', disconnectError);
          }
          this.connectedDevice = null;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.retryAttempts) {
          throw new Error(`Failed to connect after ${this.retryAttempts} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  // Enhanced credential sending with proper error handling
  async sendWiFiCredentials(deviceId, ssid, password) {
    console.log('📡 Sending WiFi credentials to device:', deviceId);
    
    try {
      // First, scan for the device
      const device = await this.scanForDevice(deviceId);
      
      // Connect to the device
      const connectedDevice = await this.connectToDevice(device);
      
      // Get the service and characteristic
      const services = await connectedDevice.services();
      const targetService = services.find(s => 
        s.uuid.toLowerCase() === this.SERVICE_UUID.toLowerCase()
      );
      
      if (!targetService) {
        throw new Error(`Service ${this.SERVICE_UUID} not found`);
      }
      
      const characteristics = await targetService.characteristics();
      const targetCharacteristic = characteristics.find(c => 
        c.uuid.toLowerCase() === this.CHARACTERISTIC_UUID.toLowerCase()
      );
      
      if (!targetCharacteristic) {
        throw new Error(`Characteristic ${this.CHARACTERISTIC_UUID} not found`);
      }
      
      // Prepare and send the payload
      const payload = JSON.stringify({
        ssid: ssid,
        password: password,
        deviceId: deviceId,
        timestamp: Date.now()
      });
      
      console.log('📦 Sending payload:', { ssid, deviceId, timestamp: Date.now() });
      
      const encodedPayload = Buffer.from(payload).toString('base64');
      
      // Write with response for better reliability
      await targetCharacteristic.writeWithResponse(encodedPayload);
      
      console.log('✅ WiFi credentials sent successfully');
      
      // Wait a moment for the device to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Disconnect
      await this.disconnect();
      
      return {
        success: true,
        message: 'WiFi credentials sent successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to send WiFi credentials:', error);
      
      // Ensure cleanup
      await this.disconnect();
      
      throw new Error(`Failed to send WiFi credentials: ${error.message}`);
    }
  }

  // Enhanced disconnect with proper cleanup
  async disconnect() {
    if (this.connectedDevice) {
      try {
        console.log('🔌 Disconnecting from device...');
        await this.connectedDevice.disconnect();
        console.log('✅ Disconnected successfully');
      } catch (error) {
        console.warn('⚠️  Disconnect error:', error);
      } finally {
        this.connectedDevice = null;
      }
    }
  }

  // Stop scanning if in progress
  stopScanning() {
    if (this.isScanning) {
      console.log('🛑 Stopping device scan...');
      this.manager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  // Complete cleanup
  cleanup() {
    console.log('🧹 Cleaning up BLE service...');
    this.stopScanning();
    this.disconnect();
  }

  // Utility method to check if device is connected
  isConnected() {
    return this.connectedDevice !== null;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected(),
      isScanning: this.isScanning,
      deviceName: this.connectedDevice?.name || null
    };
  }
}

// Export singleton instance
export default new EnhancedBLEService();

// Usage example:
/*
import BLEService from './EnhancedBLEService';

// Send WiFi credentials
try {
  const result = await BLEService.sendWiFiCredentials(
    'HEXA-ABC123',
    'MyWiFiNetwork',
    'mypassword123'
  );
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
*/