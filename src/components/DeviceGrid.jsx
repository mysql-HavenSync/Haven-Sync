import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DeviceSection = ({ devices = [], onAddDevice }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Device</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddDevice}>
          <Icon name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addText}>Add Device</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {devices.length === 0 ? (
          <Text style={styles.noDeviceText}>No devices found.</Text>
        ) : (
          devices.map(device => (
            <View key={device.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Switch value={device.isOn} />
              </View>
              <Text style={styles.deviceLocation}>{device.location}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3ba7cc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  addText: {
    color: '#fff',
    marginLeft: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceLocation: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  noDeviceText: {
    fontSize: 16,
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
  },
});

export default DeviceSection;
