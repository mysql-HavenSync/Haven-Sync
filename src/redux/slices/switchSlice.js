import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for device control
export const controlDevice = createAsyncThunk(
  'switches/controlDevice',
  async ({ deviceId, command }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`https://havensync.hexahavenintegrations.com/api/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { deviceId, command, result: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching device status
export const fetchDeviceStatus = createAsyncThunk(
  'switches/fetchDeviceStatus',
  async (deviceId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`https://havensync.hexahavenintegrations.com/api/devices/${deviceId}/status`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { deviceId, status: data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching all user devices
export const fetchUserDevices = createAsyncThunk(
  'switches/fetchUserDevices',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`https://havensync.hexahavenintegrations.com/api/devices`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.devices || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  activeDevices: [], // Changed from 'devices' to 'activeDevices'
  cardNames: [], // Added from version 2
  nextDeviceId: 1, // Added from version 2
  timers: {}, // Added from version 2
  mainToggleTimer: null, // Added from version 2
  deviceGroups: [], // Added from version 2
  loading: false,
  error: null,
  selectedDeviceId: null,
  wsConnected: false,
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

      // Check if device already exists
      const existingDevice = state.activeDevices.find(device => device.id === deviceId);
      if (!existingDevice) {
        state.activeDevices.push(newDevice);
        state.cardNames.push({
          id: deviceId,
          name: devicePayload.name || `Smart Switch ${deviceId}`,
        });

        if (!devicePayload.id) {
          state.nextDeviceId += 1;
        }
      }
    },
    
    removeDevice: (state, action) => {
      const deviceId = action.payload;
      state.activeDevices = state.activeDevices.filter(device => device.id !== deviceId);
      state.cardNames = state.cardNames.filter(card => card.id !== deviceId);
      
      // Clean up timers for removed device
      if (state.timers[deviceId]) {
        delete state.timers[deviceId];
      }
    },
    
    updateDevice: (state, action) => {
      const { id, switches, regulators, isConnected, status, masterTimer } = action.payload;
      const device = state.activeDevices.find(device => device.id === id);
      if (device) {
        if (switches !== undefined) device.switches = switches;
        if (regulators !== undefined) device.regulators = regulators;
        if (isConnected !== undefined) device.isConnected = isConnected;
        if (status !== undefined) device.status = status;
        if (masterTimer !== undefined) device.masterTimer = masterTimer;
      }
    },
    
    updateDeviceStatus: (state, action) => {
      const { deviceId, status, signalStrength, isConnected, lastSeen } = action.payload;
      const deviceIndex = state.activeDevices.findIndex(device => device.id === deviceId);
      if (deviceIndex !== -1) {
        state.activeDevices[deviceIndex] = {
          ...state.activeDevices[deviceIndex],
          status: status || state.activeDevices[deviceIndex].status,
          signalStrength: signalStrength || state.activeDevices[deviceIndex].signalStrength,
          isConnected: isConnected !== undefined ? isConnected : state.activeDevices[deviceIndex].isConnected,
          lastSeen: lastSeen || state.activeDevices[deviceIndex].lastSeen,
        };
      }
    },
    
    updateDeviceState: (state, action) => {
      const { deviceId, switches, regulators } = action.payload;
      const deviceIndex = state.activeDevices.findIndex(device => device.id === deviceId);
      if (deviceIndex !== -1) {
        state.activeDevices[deviceIndex] = {
          ...state.activeDevices[deviceIndex],
          switches: switches || state.activeDevices[deviceIndex].switches,
          regulators: regulators || state.activeDevices[deviceIndex].regulators,
          lastUpdated: new Date().toISOString(),
        };
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
          lastUpdated: new Date().toISOString(),
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
    
    updateRegulator: (state, action) => {
      const { deviceId, regulatorIndex, value } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      
      if (device && device.regulators && device.regulators[regulatorIndex] !== undefined) {
        if (typeof device.regulators[regulatorIndex] === 'object') {
          device.regulators[regulatorIndex].value = value;
        } else {
          device.regulators[regulatorIndex] = value;
        }
        device.lastUpdated = new Date().toISOString();
      }
    },

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

    getDeviceSwitches: (state, action) => {
      const { deviceId } = action.payload;
      const device = state.activeDevices.find(d => d.id === deviceId);
      return device ? device.switches : [];
    },
    
    updateCardName: (state, action) => {
      const { id, name } = action.payload;
      const card = state.cardNames.find(card => card.id === id);
      if (card) {
        card.name = name;
      }
    },
    
    setTimer: (state, action) => {
      const { deviceId, switchIndex, timeLeft } = action.payload;
      if (!state.timers[deviceId]) state.timers[deviceId] = {};
      state.timers[deviceId][switchIndex] = timeLeft;
    },
    
    decrementTimer: (state, action) => {
      const { deviceId, switchIndex } = action.payload;
      if (state.timers[deviceId] && state.timers[deviceId][switchIndex] > 0) {
        state.timers[deviceId][switchIndex] -= 1;
      }
    },
    
    resetTimer: (state, action) => {
      const { deviceId, switchIndex } = action.payload;
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
    
    setSelectedDevice: (state, action) => {
      state.selectedDeviceId = action.payload;
    },
    
    setWebSocketConnected: (state, action) => {
      state.wsConnected = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Control Device
      .addCase(controlDevice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(controlDevice.fulfilled, (state, action) => {
        state.loading = false;
        const { deviceId, command } = action.payload;
        
        // Update local state optimistically
        const deviceIndex = state.activeDevices.findIndex(device => device.id === deviceId);
        if (deviceIndex !== -1) {
          if (command.type === 'switch') {
            state.activeDevices[deviceIndex].switches[command.index].status = command.state;
          } else if (command.type === 'regulator') {
            state.activeDevices[deviceIndex].regulators[command.index] = command.value;
          }
          state.activeDevices[deviceIndex].lastUpdated = new Date().toISOString();
        }
      })
      .addCase(controlDevice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Device Status
      .addCase(fetchDeviceStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDeviceStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { deviceId, status } = action.payload;
        const deviceIndex = state.activeDevices.findIndex(device => device.id === deviceId);
        if (deviceIndex !== -1) {
          state.activeDevices[deviceIndex] = { ...state.activeDevices[deviceIndex], ...status };
        }
      })
      .addCase(fetchDeviceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch User Devices
      .addCase(fetchUserDevices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserDevices.fulfilled, (state, action) => {
        state.loading = false;
        // Merge with existing devices, keeping local state
        const serverDevices = action.payload;
        const mergedDevices = [...state.activeDevices];
        
        serverDevices.forEach(serverDevice => {
          const existingIndex = mergedDevices.findIndex(device => device.id === serverDevice.id);
          if (existingIndex !== -1) {
            // Update existing device with server data, but keep local state
            mergedDevices[existingIndex] = {
              ...mergedDevices[existingIndex],
              ...serverDevice,
              switches: mergedDevices[existingIndex].switches || serverDevice.switches,
              regulators: mergedDevices[existingIndex].regulators || serverDevice.regulators,
            };
          } else {
            // Add new device from server
            mergedDevices.push(serverDevice);
          }
        });
        
        state.activeDevices = mergedDevices;
      })
      .addCase(fetchUserDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addDevice,
  removeDevice,
  updateDevice,
  updateDeviceStatus,
  updateDeviceState,
  toggleSwitch,
  toggleSensor,
  updateRegulator,
  updateSwitchName,
  getDeviceSwitches,
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
  toggleSecondaryStatus,
  updateSwitchSpeed,
  setSelectedDevice,
  setWebSocketConnected,
  clearError,
} = switchSlice.actions;

export default switchSlice.reducer;