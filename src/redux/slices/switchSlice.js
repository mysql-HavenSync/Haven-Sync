import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  activeDevices: [],
  cardNames: [],
  nextDeviceId: 1,
  timers: {},
  mainToggleTimer: null,
};

const switchSlice = createSlice({
  name: 'switches',
  initialState,
  reducers: {
    addDevice: (state, action) => {
      const newDevice = {
        ...action.payload,
        id: state.nextDeviceId,
      };
      state.activeDevices.push(newDevice);
      state.cardNames.push({
        id: state.nextDeviceId,
        name: `Smart Switch ${state.nextDeviceId}`,
      });
      state.nextDeviceId += 1;
    },
    removeDevice: (state, action) => {
      const deviceId = action.payload;
      state.activeDevices = state.activeDevices.filter(
        device => device.id !== deviceId,
      );
      state.cardNames = state.cardNames.filter(card => card.id !== deviceId);
    },
    updateDevice: (state, action) => {
      const {id, switches, regulators} = action.payload;
      const device = state.activeDevices.find(device => device.id === id);
      if (device) {
        if (switches) device.switches = switches;
        if (regulators) device.regulators = regulators;
      }
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
  resetAllTimers,
  setMainToggleTimer,
  decrementMainToggleTimer,
  resetMainToggleTimer,
} = switchSlice.actions;
export default switchSlice.reducer;
