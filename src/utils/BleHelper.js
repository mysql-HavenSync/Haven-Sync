// BleHelper.js
import { BleManager } from 'react-native-ble-plx';
import BluetoothStateManager from 'react-native-bluetooth-status';

export default class BleHelper {
  constructor() {
    this.manager = new BleManager();
    this.scanTimeout = 20000; // 20 seconds
    this.isScanning = false;
  }

  async checkBluetoothState() {
    const state = await BluetoothStateManager.getState();
    if (state !== 'on') {
      const enabled = await BluetoothStateManager.enable();
      if (!enabled) throw new Error('Bluetooth not enabled');
    }
    return true;
  }

  async scanAndFindDevice(targetDeviceId, onDeviceFound, onProgress) {
    const bluetoothEnabled = await this.checkBluetoothState();
    if (!bluetoothEnabled) {
      throw new Error('Bluetooth is not enabled');
    }

    return new Promise((resolve, reject) => {
      let scanSubscription;
      let foundDevice = null;
      let scanTimer;

      const cleanup = () => {
        if (scanSubscription) scanSubscription.remove();
        if (scanTimer) clearTimeout(scanTimer);
        if (this.isScanning) {
          this.manager.stopDeviceScan();
          this.isScanning = false;
        }
      };

      // Timeout
      scanTimer = setTimeout(() => {
        cleanup();
        reject(new Error(`Device "${targetDeviceId}" not found within ${this.scanTimeout / 1000} seconds`));
      }, this.scanTimeout);

      // BLE state listener
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

            if (onProgress && scannedDevice?.name) onProgress(scannedDevice.name);
            if (onDeviceFound && scannedDevice?.name) {
              onDeviceFound({
                id: scannedDevice.id,
                name: scannedDevice.name,
                rssi: scannedDevice.rssi
              });
            }

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
}
