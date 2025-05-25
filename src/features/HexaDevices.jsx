// src/features/HexaDevices.jsx

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { updateDevice } from '../redux/slices/switchSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HexaDevices() {
  const devices = useSelector((state) => state.switches.activeDevices);
  const darkMode = useSelector((state) => state.profile.darkMode);
  const dispatch = useDispatch();

  const togglePower = (device) => {
    dispatch(
      updateDevice({
        id: device.id,
        switches: device.switches.map((s, i) => (i === 0 ? !s : s)),
      })
    );
  };

  return (
    <ScrollView
      style={[styles.container, darkMode && styles.darkBg]}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <Text style={[styles.title, darkMode && styles.textDark]}>My Devices</Text>

      {devices.length === 0 ? (
        <Text style={styles.noDevices}>No devices available</Text>
      ) : (
        <View style={styles.grid}>
          {devices.map((device) => {
            const isOn = device.switches[0];
            return (
              <TouchableOpacity
                key={device.id}
                style={[styles.card, isOn && styles.cardActive]}
                activeOpacity={0.8}
                onPress={() => togglePower(device)}
              >
                <MaterialCommunityIcons
                  name={device.icon || 'power-socket'}
                  size={30}
                  color={isOn ? '#fff' : '#333'}
                />
                <Text style={[styles.name, isOn && styles.textWhite]}>
                  {device.name}
                </Text>
                <Text style={[styles.status, isOn && styles.textWhite]}>
                  {device.isConnected ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  value={isOn}
                  disabled
                  trackColor={{ false: '#999', true: '#fff' }}
                  thumbColor={isOn ? '#4caf50' : '#ccc'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
  },
  darkBg: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 16,
    color: '#333',
  },
  textDark: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '47%',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    alignItems: 'center',
  },
  cardActive: {
    backgroundColor: '#84c9e8',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  status: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  textWhite: {
    color: '#fff',
  },
  noDevices: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#888',
  },
});
