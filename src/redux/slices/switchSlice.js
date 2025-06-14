import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  activeDevices: [],
  cardNames: [],
  nextDeviceId: 1,
  timers: {},
  mainToggleTimer: null,
  deviceGroups: [], // Initialize this to prevent errors
};

const switchSlice = createSlice({
  name: 'switches',
  initialState,
  reducers: {
    addDevice: (state, action) => {
      const devicePayload = action.payload;
      const deviceId = devicePayload.id || `device_${state.nextDeviceId}`;
      const channelMatch = devicePayload.deviceId?.match(/hexa(\d+)chn/);
      const channelCount = channelMatch ? parseInt(channelMatch[1]) : 3;

      const switches = Array.from({ length: channelCount }, (_, index) => ({
        id: `${deviceId}_switch_${index + 1}`,
        name: `Switch ${index + 1}`,
        status: false,
        speed: 0, // Initialize speed property
        deviceId: deviceId,
        deviceName: devicePayload.name || `Smart Switch ${deviceId}`,
        sensor: { status: false, type: 'motion' },
      }));

      const newDevice = {
        ...devicePayload,
        id: deviceId,
        channelCount: channelCount,
        switches: switches,
        isOn: devicePayload.isOn || false,
        isConnected: devicePayload.isConnected !== undefined ? devicePayload.isConnected : true,
        type: devicePayload.type || 'device',
        status: devicePayload.status || 'online',
        regulators: devicePayload.regulators || [],
      };

      state.activeDevices.push(newDevice);
      state.cardNames.push({
        id: deviceId,
        name: devicePayload.name || `Smart Switch ${deviceId}`,
      });

      if (!devicePayload.id) {
        state.nextDeviceId += 1;
      }
    },
    
    removeDevice: (state, action) => {
      const deviceId = action.payload;
      state.activeDevices = state.activeDevices.filter(
        device => device.id !== deviceId,
      );
      state.cardNames = state.cardNames.filter(card => card.id !== deviceId);
      
      // Clean up timers for removed device
      if (state.timers[deviceId]) {
        delete state.timers[deviceId];
      }
    },
    
    updateDevice: (state, action) => {
      const {id, switches, regulators, isConnected, status} = action.payload;
      const device = state.activeDevices.find(device => device.id === id);
      if (device) {
        if (switches !== undefined) device.switches = switches;
        if (regulators !== undefined) device.regulators = regulators;
        if (isConnected !== undefined) device.isConnected = isConnected;
        if (status !== undefined) device.status = status;
        if (action.payload.masterTimer !== undefined) {
  device.masterTimer = action.payload.masterTimer;
}

      }
    },
    
toggleSwitch: (state, action) => {
  const { deviceId, switchId, switchIndex } = action.payload;

  // Find the device index in the array
  const deviceIndex = state.activeDevices.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) return;

  const device = state.activeDevices[deviceIndex];

  // Map over switches to create a new switches array
  const newSwitches = device.switches.map((sw, idx) => {
    const shouldToggle =
      (switchId && sw.id === switchId) ||
      (switchIndex !== undefined && idx === switchIndex);

    if (shouldToggle) {
      return {
        ...sw,
        status: !sw.status,
        isOn: sw.isOn !== undefined ? !sw.isOn : undefined,
        state: sw.state !== undefined ? !sw.state : undefined,
      };
    }
    return sw;
  });

  // Replace the device with a new object in the array (immutably)
  state.activeDevices = [
    ...state.activeDevices.slice(0, deviceIndex),
    {
      ...device,
      switches: newSwitches,
    },
    ...state.activeDevices.slice(deviceIndex + 1)
  ];
},


toggleSensor: (state, action) => {
  const { deviceId, switchId, switchIndex, sensorType } = action.payload;
  const deviceIndex = state.activeDevices.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) return;

  const device = state.activeDevices[deviceIndex];

  // Map over switches to create a new switches array
  const newSwitches = device.switches.map((sw, idx) => {
    let shouldUpdate = false;
    if (switchId && sw.id === switchId) shouldUpdate = true;
    if (switchIndex !== undefined && idx === switchIndex) shouldUpdate = true;

    if (shouldUpdate) {
      // Ensure the switch is an object
      let updatedSwitch = { ...sw };

      // Convert boolean switch to object if needed
      if (typeof sw === 'boolean') {
        updatedSwitch = {
          id: `${deviceId}_switch_${idx + 1}`,
          name: `Switch ${idx + 1}`,
          status: sw,
          deviceId: deviceId,
          deviceName: device.name || `Smart Switch ${deviceId}`,
          sensor: { status: false, type: sensorType || 'motion' }
        };
      }

      // Initialize sensor if it doesn't exist
      if (!updatedSwitch.sensor) {
        updatedSwitch.sensor = { status: false, type: sensorType || 'motion' };
      }

      // Toggle sensor status
      updatedSwitch.sensor = {
        ...updatedSwitch.sensor,
        status: !updatedSwitch.sensor.status,
        type: sensorType || updatedSwitch.sensor.type
      };

      return updatedSwitch;
    }
    return sw;
  });
  
  // Replace the device with a new object in the array (immutably)
  state.activeDevices = [
    ...state.activeDevices.slice(0, deviceIndex),
    {
      ...device,
      switches: newSwitches,
    },
    ...state.activeDevices.slice(deviceIndex + 1)
  ];
},

    // NEW: Update regulator value
    updateRegulator: (state, action) => {
      const { deviceId, regulatorIndex, value } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      
      if (device && device.regulators && device.regulators[regulatorIndex] !== undefined) {
        if (typeof device.regulators[regulatorIndex] === 'object') {
          device.regulators[regulatorIndex].value = value;
        } else {
          device.regulators[regulatorIndex] = value;
        }
      }
    },

    // NEW: Update individual switch name
    updateSwitchName: (state, action) => {
      const { deviceId, switchId, name } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      
      if (device && device.switches) {
        const switchToUpdate = device.switches.find(s => s.id === switchId);
        if (switchToUpdate) {
          switchToUpdate.name = name;
        }
      }
    },

    // NEW: Get all switches for a device (helper for dashboard filtering)
    getDeviceSwitches: (state, action) => {
      const { deviceId } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      return device ? device.switches : [];
    },
    
    updateCardName: (state, action) => {
      const {id, name} = action.payload;
      const card = state.cardNames.find(card => card.id === id);
      if (card) {
        card.name = name;
      }
    },
    
    setTimer: (state, action) => {
      const {deviceId, switchIndex, timeLeft} = action.payload;
      if (!state.timers[deviceId]) state.timers[deviceId] = {};
      state.timers[deviceId][switchIndex] = timeLeft;
    },
    
    decrementTimer: (state, action) => {
      const {deviceId, switchIndex} = action.payload;
      if (state.timers[deviceId] && state.timers[deviceId][switchIndex] > 0) {
        state.timers[deviceId][switchIndex] -= 1;
      }
    },
    
    resetTimer: (state, action) => {
      const {deviceId, switchIndex} = action.payload;
      if (
        state.timers[deviceId] &&
        state.timers[deviceId][switchIndex] !== undefined
      ) {
        delete state.timers[deviceId][switchIndex];
      }
    },
    
    setMainToggleTimer: (state, action) => {
      state.mainToggleTimer = action.payload;
    },
    
    decrementMainToggleTimer: state => {
      if (state.mainToggleTimer > 0) {
        state.mainToggleTimer -= 1;
      }
    },
    
    resetMainToggleTimer: state => {
      state.mainToggleTimer = null;
    },
    
    updateDeviceName: (state, action) => {
      const { id, name } = action.payload;
      const device = state.activeDevices.find(d => d.id === id);
      if (device) {
        device.name = name;
        // Also update switch device names
        if (device.switches && Array.isArray(device.switches)) {
          device.switches.forEach(sw => {
            if (typeof sw === 'object' && sw.deviceName !== undefined) {
              sw.deviceName = name;
            }
          });
        }
      }
      
      // Also update card name
      const card = state.cardNames.find(c => c.id === id);
      if (card) card.name = name;
    },
    
    createGroup: (state, action) => {
      if (!state.deviceGroups) state.deviceGroups = [];
      state.deviceGroups.push(action.payload);
    },
    
    updateGroupName: (state, action) => {
      const { id, name } = action.payload;
      if (!state.deviceGroups) state.deviceGroups = [];
      const group = state.deviceGroups.find(g => g.id === id);
      if (group) group.name = name;
    },
    
    addDeviceToGroup: (state, action) => {
      const { groupId, deviceId } = action.payload;
      if (!state.deviceGroups) state.deviceGroups = [];
      const group = state.deviceGroups.find(g => g.id === groupId);
      if (group && !group.deviceIds.includes(deviceId)) {
        group.deviceIds.push(deviceId);
      }
    },
    
    toggleSecondaryStatus: (state, action) => {
      const { deviceId, switchIndex } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      if (device && device.switches[switchIndex]) {
        device.switches[switchIndex].secondaryStatus = !device.switches[switchIndex].secondaryStatus;
      }
    },

    updateSwitchSpeed: (state, action) => {
      const { deviceId, switchIndex, speed } = action.payload;

      const device = state.activeDevices.find((d) => d.id === deviceId);
      if (device && device.switches[switchIndex]) {
        device.switches[switchIndex] = {
          ...device.switches[switchIndex],
          speed, // Update the speed property
        };
      }
    },
  },
});

export const {
  addDevice,
  removeDevice,
  updateDevice,
  updateCardName,
  setTimer,
  decrementTimer,
  resetTimer,
  setMainToggleTimer,
  decrementMainToggleTimer,
  resetMainToggleTimer,
  updateDeviceName,
  createGroup,
  updateGroupName,
  addDeviceToGroup,
  // NEW EXPORTS
  toggleSwitch,
  toggleSensor,  // Added this export
  updateRegulator,
  updateSwitchName,
  getDeviceSwitches,
  toggleSecondaryStatus,
  updateSwitchSpeed, // Export the new reducer
} = switchSlice.actions;

export default switchSlice.reducer;