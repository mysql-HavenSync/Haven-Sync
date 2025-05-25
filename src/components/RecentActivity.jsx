import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlug, faPowerOff } from '@fortawesome/free-solid-svg-icons';

const mockActivity = [
  { id: '1', device: 'Living Room Light', action: 'Turned On', time: '9:32 AM' },
  { id: '2', device: 'Fan', action: 'Turned Off', time: '8:15 AM' },
  { id: '3', device: 'Heater', action: 'Turned On', time: 'Yesterday' },
];

export default function RecentActivity() {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <FontAwesomeIcon icon={item.action === 'Turned On' ? faPlug : faPowerOff} size={20} color="#4a4a4a" />
      <View style={styles.textContainer}>
        <Text style={styles.device}>{item.device}</Text>
        <Text style={styles.action}>{item.action} at {item.time}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      <FlatList
        data={mockActivity}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
  },
  device: {
    fontSize: 16,
    fontWeight: '500',
  },
  action: {
    fontSize: 14,
    color: '#666',
  },
});
