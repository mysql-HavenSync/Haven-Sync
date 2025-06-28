// utils/deviceRegistry.js
import { generateDevicePageComponent } from './DevicePageGenerator';

class DeviceRegistry {
  constructor() {
    this.registeredDevices = new Map();
    this.deviceComponents = new Map();
  }

  // Enhanced Parse device ID to determine device type and configuration
  parseDeviceId(deviceId) {
    const id = deviceId.toLowerCase();

    if (id.startsWith('hexa3chn')) {
      return {
        deviceType: 'Switch Controller',
        channelCount: 3,
        regularSwitches: 2,
        speedControlSwitches: 1,
        regulatorCount: 1,
        speedControlIndices: [2],
        category: '3-channel'
      };
    } else if (id.startsWith('hexa5chn')) {
      return {
        deviceType: 'Switch Controller',
        channelCount: 5,
        regularSwitches: 3,
        speedControlSwitches: 2,
        regulatorCount: 2,
        speedControlIndices: [3, 4],
        category: '5-channel'
      };
    } else if (id.startsWith('hexa4chn')) {
      return {
        deviceType: 'Switch Controller',
        channelCount: 4,
        regularSwitches: 3,
        speedControlSwitches: 1,
        regulatorCount: 1,
        speedControlIndices: [3],
        category: '4-channel'
      };
    } else if (id.startsWith('hexa6chn')) {
      return {
        deviceType: 'Switch Controller',
        channelCount: 6,
        regularSwitches: 4,
        speedControlSwitches: 2,
        regulatorCount: 2,
        speedControlIndices: [4, 5],
        category: '6-channel'
      };
    } else if (id.startsWith('hexa8chn')) {
      return {
        deviceType: 'Switch Controller',
        channelCount: 8,
        regularSwitches: 5,
        speedControlSwitches: 3,
        regulatorCount: 3,
        speedControlIndices: [5, 6, 7],
        category: '8-channel'
      };
    }

    // Default fallback
    return {
      deviceType: 'Generic Device',
      channelCount: 1,
      regularSwitches: 1,
      speedControlSwitches: 0,
      regulatorCount: 0,
      speedControlIndices: [],
      category: 'generic'
    };
  }

  registerDevice(device) {
    const config = this.parseDeviceId(device.deviceId);

    const deviceConfig = {
      deviceId: device.deviceId,
      deviceName: device.name,
      ...config
    };

    const componentName = this.generateComponentName(device.deviceId);
    const DeviceComponent = generateDevicePageComponent(deviceConfig);

    this.registeredDevices.set(device.deviceId, {
      ...deviceConfig,
      componentName,
      registeredAt: new Date().toISOString()
    });

    this.deviceComponents.set(componentName, DeviceComponent);

    console.log(`Device registered: ${device.name} (${device.deviceId})`);
    console.log(`Component name: ${componentName}`);
    console.log('Device config:', deviceConfig);

    return {
      componentName,
      routeName: this.generateRouteName(device.deviceId),
      deviceConfig
    };
  }

  generateComponentName(deviceId) {
    const cleanId = deviceId
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Device$&');

    return `${cleanId}Page`;
  }

  generateRouteName(deviceId) {
    return `Device_${deviceId.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  getDeviceInfo(deviceId) {
    return this.registeredDevices.get(deviceId);
  }

  getDeviceComponent(componentName) {
    return this.deviceComponents.get(componentName);
  }

  getAllDevices() {
    return Array.from(this.registeredDevices.entries()).map(([deviceId, config]) => ({
      deviceId,
      ...config
    }));
  }

  unregisterDevice(deviceId) {
    const deviceInfo = this.registeredDevices.get(deviceId);
    if (deviceInfo) {
      this.registeredDevices.delete(deviceId);
      this.deviceComponents.delete(deviceInfo.componentName);
      console.log(`Device unregistered: ${deviceId}`);
      return true;
    }
    return false;
  }

  isDeviceRegistered(deviceId) {
    return this.registeredDevices.has(deviceId);
  }

  generateNavigationConfig() {
    const configs = [];

    for (const [deviceId, deviceInfo] of this.registeredDevices) {
      const component = this.deviceComponents.get(deviceInfo.componentName);
      if (component) {
        configs.push({
          name: this.generateRouteName(deviceId),
          component: component,
          options: {
            title: deviceInfo.deviceName,
            headerShown: false,
          }
        });
      }
    }

    return configs;
  }

  generateMenuItems() {
    const menuItems = [];

    for (const [deviceId, deviceInfo] of this.registeredDevices) {
      menuItems.push({
        id: deviceId,
        name: deviceInfo.deviceName,
        routeName: this.generateRouteName(deviceId),
        deviceType: deviceInfo.deviceType,
        category: deviceInfo.category,
        channelCount: deviceInfo.channelCount,
        regulatorCount: deviceInfo.regulatorCount,
        icon: this.getDeviceIcon(deviceInfo.category),
        registeredAt: deviceInfo.registeredAt
      });
    }

    return menuItems.sort((a, b) =>
      new Date(b.registeredAt) - new Date(a.registeredAt)
    );
  }

  getDeviceIcon(category) {
    switch (category) {
      case '3-channel':
        return 'plug';
      case '4-channel':
        return 'toggle-on';
      case '5-channel':
        return 'th-large';
      case '6-channel':
        return 'sliders-h';
      case '8-channel':
        return 'th';
      default:
        return 'microchip';
    }
  }
}

export const deviceRegistry = new DeviceRegistry();

export const registerNewDevice = (device) => {
  return deviceRegistry.registerDevice(device);
};

export const getDeviceNavigationConfig = () => {
  return deviceRegistry.generateNavigationConfig();
};

export const getDeviceMenuItems = () => {
  return deviceRegistry.generateMenuItems();
};

export const isDeviceRegistered = (deviceId) => {
  return deviceRegistry.isDeviceRegistered(deviceId);
};

export const unregisterDevice = (deviceId) => {
  return deviceRegistry.unregisterDevice(deviceId);
};
