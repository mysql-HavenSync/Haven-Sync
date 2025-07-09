// utils/BleHelper.js
import { BleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

export default class BleHelper {
  constructor() {
    this.manager = new BleManager();
    this.scanTimeout = 20000; // 20 seconds
    this.isScanning = false;
  }

  // ✅ Check BLE state using BleManager
  async checkBluetoothState() {
    const state = await this.manager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not powered on');
    }
    return true;
  }

  // ✅ Scan and find BLE device by name
  async scanAndFindDevice(targetDeviceId, onDeviceFound, onProgress) {
    const bluetoothEnabled = await this.checkBluetoothState();
    if (!bluetoothEnabled) {
      throw new Error('Bluetooth is not enabled');
    }

    return new Promise((resolve, reject) => {
      let foundDevice = null;
      let scanTimer;

      const cleanup = () => {
        this.manager.stopDeviceScan();
        this.isScanning = false;
        if (scanTimer) clearTimeout(scanTimer);
      };

      // ⏳ Set a timeout to stop scanning
      scanTimer = setTimeout(() => {
        cleanup();
        reject(new Error(`Device "${targetDeviceId}" not found within ${this.scanTimeout / 1000} seconds`));
      }, this.scanTimeout);

      // 🚀 Start BLE scan
      this.isScanning = true;
      this.manager.startDeviceScan(null, null, (error, scannedDevice) => {
        if (error) {
          console.error('❌ BLE scan error:', error);
          cleanup();
          reject(error);
          return;
        }

        if (onProgress && scannedDevice?.name) {
          onProgress(scannedDevice.name);
        }

        if (onDeviceFound && scannedDevice?.name) {
          onDeviceFound({
            id: scannedDevice.id,
            name: scannedDevice.name,
            rssi: scannedDevice.rssi
          });
        }

        if (scannedDevice?.name?.toLowerCase().includes(targetDeviceId.toLowerCase()))
 {
          console.log('✅ Found target device:', scannedDevice.name);
          foundDevice = scannedDevice;
          cleanup();
          resolve(foundDevice);
        }
      });
    });
  }
}
