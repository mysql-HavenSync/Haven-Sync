import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Video from 'react-native-video';

const weatherVideos = {
  sunny: require('../assets/videos/sunny.mp4'),
  rain: require('../assets/videos/rain.mp4'),
  storm: require('../assets/videos/cloudy.mp4'),
  cloudy: require('../assets/videos/cloudy.mp4'),
  wind: require('../assets/videos/cloudy.mp4'),
  night: require('../assets/videos/night.mp4'),
};

const getWeatherKey = (main) => {
  const mapping = {
    Clear: 'sunny',
    Rain: 'rain',
    Thunderstorm: 'storm',
    Drizzle: 'rain',
    Clouds: 'cloudy',
    Snow: 'cloudy',
    Wind: 'wind',
    Night: 'night',
  };
  return mapping[main] || 'cloudy';
};

export default function TopSection() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to provide weather updates.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherDataByCoords(latitude, longitude);
          },
          error => {
            console.error(error);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  const fetchWeatherDataByCoords = async (lat, lon) => {
    try {
      const API_KEY = '60d3edac42903c48e11867d5b0e797f8';
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(res.data);
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataByCity = async (city) => {
    try {
      const API_KEY = '60d3edac42903c48e11867d5b0e797f8';
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(res.data);
      setIsModalVisible(false);
    } catch (err) {
      console.error('City fetch error:', err);
    }
  };

  if (loading || !weatherData) {
    return (
      <View style={styles.weatherCardContainer}>
        <ActivityIndicator size="small" color="#333" />
        <Text>Fetching weather...</Text>
      </View>
    );
  }

  const weatherKey = getWeatherKey(weatherData.weather[0].main);
  const videoSource = weatherVideos[weatherKey];

  return (
    <View style={styles.weatherCardContainer}>
      <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.weatherCard}>
        <Video
          source={videoSource}
          style={StyleSheet.absoluteFill}
          muted
          repeat
          resizeMode="cover"
          rate={1.0}
          ignoreSilentSwitch="obey"
        />

        <View style={styles.weatherDetails}>
          <View>
            <Text style={styles.tempText}>{weatherData.main.temp}°C</Text>
            <Text style={styles.humidityText}>{weatherData.main.humidity}%</Text>
          </View>
          <View style={styles.conditionDetails}>
            <Text style={styles.conditionText}>{weatherData.weather[0].main}</Text>
            <Text style={styles.cityText}>{weatherData.name}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Enter City Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Thanjavur"
              value={manualLocation}
              onChangeText={setManualLocation}
            />
            <Button title="Submit" onPress={() => fetchWeatherDataByCity(manualLocation)} />
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  weatherCardContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherCard: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '90%',
    height: 150,
    justifyContent: 'center',
    backgroundColor: '#ddd',
    // Android Shadow
    elevation: 10,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 20,
    shadowRadius: 20,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tempText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  humidityText: {
    fontSize: 18,
    color: '#eee',
  },
  conditionDetails: {
    alignItems: 'flex-end',
  },
  conditionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cityText: {
    fontSize: 14,
    color: '#ccc',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginVertical: 30,
  },
});
