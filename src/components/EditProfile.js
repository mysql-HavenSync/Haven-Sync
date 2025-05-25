import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function EditProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput placeholder="Name" style={styles.input} />
      <TextInput placeholder="Email" style={styles.input} />
      {/* Add other fields as needed */}
      <Button title="Save Changes" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
});
