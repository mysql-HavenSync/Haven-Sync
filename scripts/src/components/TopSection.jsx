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
  Dimensions,
  Animated,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import Video from 'react-native-video';

const { width, height } = Dimensions.get('window');

const weatherVideos = {
  sunny: require('../assets/videos/sunny.mp4'),
  rain: require('../assets/videos/rain.mp4'),
  storm: require('../assets/videos/cloudy.mp4'),
  cloudy: require('../assets/videos/cloudy.mp4'),
  wind: require('../assets/videos/cloudy.mp4'),
  night: require('../assets/videos/night.mp4'),
};

// Random cities to show by default
const randomCities = [
  'New York',
  'London',
  'Tokyo',
  'Paris',
  'Sydney',
  'Mumbai',
  'Dubai',
  'Singapore',
  'Toronto',
  'Berlin',
  'Barcelona',
  'Amsterdam',
  'Seoul',
  'Bangkok',
  'Istanbul'
];

// Function to determine weather video based on weather conditions only
const getWeatherKey = (weatherMain, weatherDescription) => {
  
  // Daytime weather mapping - more comprehensive and prioritized
  const weatherMapping = {
    // Clear weather - PRIORITY
    'Clear': 'sunny',
    'clear sky': 'sunny',
    
    // Rainy weather
    'Rain': 'rain',
    'Drizzle': 'rain',
    'shower rain': 'rain',
    'heavy intensity rain': 'rain',
    'moderate rain': 'rain',
    'light rain': 'rain',
    
    // Stormy weather
    'Thunderstorm': 'storm',
    'thunderstorm with rain': 'storm',
    'thunderstorm with heavy rain': 'storm',
    
    // Cloudy weather - LOWER PRIORITY
    'Clouds': 'cloudy',
    'few clouds': 'sunny', // Few clouds should still be sunny
    'scattered clouds': 'cloudy',
    'broken clouds': 'cloudy',
    'overcast clouds': 'cloudy',
    
    // Snow (using cloudy video)
    'Snow': 'cloudy',
    'light snow': 'cloudy',
    'heavy snow': 'cloudy',
    
    // Atmospheric conditions (using cloudy video)
    'Mist': 'cloudy',
    'Fog': 'cloudy',
    'Haze': 'sunny', // Haze can still be sunny
    'Dust': 'cloudy',
    'Sand': 'cloudy',
    'Smoke': 'cloudy',
    
    // Wind
    'Squall': 'wind',
    'Tornado': 'wind',
  };
  
  console.log('Weather Debug:', {
    weatherMain,
    weatherDescription,
    weatherMainLower: weatherMain?.toLowerCase(),
    weatherDescLower: weatherDescription?.toLowerCase()
  });
  
  // PRIORITY 1: Check for Clear/Sunny first
  if (weatherMain === 'Clear' || weatherDescription?.toLowerCase().includes('clear')) {
    console.log('SUNNY detected - Clear weather');
    return 'sunny';
  }
  
  // PRIORITY 2: First try to match by main weather condition
  if (weatherMapping[weatherMain]) {
    console.log(`Weather mapping found for main: ${weatherMain} -> ${weatherMapping[weatherMain]}`);
    return weatherMapping[weatherMain];
  }
  
  // PRIORITY 3: Then try to match by description (more specific)
  const descriptionKey = Object.keys(weatherMapping).find(key => 
    key.toLowerCase() === weatherDescription?.toLowerCase()
  );
  if (descriptionKey) {
    console.log(`Weather mapping found for description: ${weatherDescription} -> ${weatherMapping[descriptionKey]}`);
    return weatherMapping[descriptionKey];
  }
  
  // PRIORITY 4: Enhanced fallback logic based on keywords in description
  const description = weatherDescription?.toLowerCase() || '';
  
  if (description.includes('clear') || description.includes('sunny')) {
    console.log('SUNNY detected in description');
    return 'sunny';
  }
  if (description.includes('rain') || description.includes('drizzle')) {
    console.log('RAIN detected in description');
    return 'rain';
  }
  if (description.includes('thunder') || description.includes('storm')) {
    console.log('STORM detected in description');
    return 'storm';
  }
  if (description.includes('cloud') || description.includes('overcast')) {
    console.log('CLOUDY detected in description');
    return 'cloudy';
  }
  if (description.includes('snow') || description.includes('fog') || description.includes('mist')) {
    console.log('CLOUDY detected for snow/fog/mist');
    return 'cloudy';
  }
  
  // Final fallback - default to sunny instead of cloudy
  console.log('Using final fallback - defaulting to sunny');
  return 'sunny';
};

export default function TopSection() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [modalAnimation] = useState(new Animated.Value(0));
  const [showLocationOptions, setShowLocationOptions] = useState(false);

  useEffect(() => {
    // Load random city weather on app start
    loadRandomCityWeather();
  }, []);

  useEffect(() => {
    if (isModalVisible) {
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isModalVisible]);

  // Load random city weather on startup
  const loadRandomCityWeather = async () => {
    try {
      const randomCity = randomCities[Math.floor(Math.random() * randomCities.length)];
      console.log('Loading random city:', randomCity);
      await fetchWeatherDataByCity(randomCity, false); // false = don't close modal
    } catch (error) {
      console.error('Error loading random city weather:', error);
      setLoading(false);
    }
  };

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
        setLoading(true);
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherDataByCoords(latitude, longitude);
          },
          error => {
            console.error(error);
            setLoading(false);
            // If location fails, keep the current random city weather
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
        );
      }
      setShowLocationOptions(false);
    } catch (err) {
      console.warn(err);
      setShowLocationOptions(false);
    }
  };

  const fetchWeatherDataByCoords = async (lat, lon) => {
    try {
      const API_KEY = '60d3edac42903c48e11867d5b0e797f8';
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(res.data);
      
      // Debug log to help troubleshoot
      console.log('Weather Data:', {
        main: res.data.weather[0].main,
        description: res.data.weather[0].description,
        selectedVideo: getWeatherKey(
          res.data.weather[0].main,
          res.data.weather[0].description
        )
      });
      
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherDataByCity = async (city, shouldCloseModal = true) => {
    if (!city.trim()) return;
    
    try {
      setLoading(true);
      const API_KEY = '60d3edac42903c48e11867d5b0e797f8';
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
      );
      setWeatherData(res.data);
      
      if (shouldCloseModal) {
        setIsModalVisible(false);
        setShowLocationOptions(false);
      }
      setManualLocation('');
      
      // Debug log for manual city search
      console.log('Manual City Weather Data:', {
        main: res.data.weather[0].main,
        description: res.data.weather[0].description,
        selectedVideo: getWeatherKey(
          res.data.weather[0].main,
          res.data.weather[0].description
        )
      });
      
    } catch (err) {
      console.error('City fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeatherCardPress = () => {
    setShowLocationOptions(true);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setShowLocationOptions(false);
    setManualLocation('');
  };

  const handleUseCurrentLocation = () => {
    requestLocationPermission();
  };

  const handleManualLocation = () => {
    setShowLocationOptions(false);
    // Keep modal open for manual input
  };

  if (loading || !weatherData) {
    return (
      <View style={styles.weatherCardContainer}>
        <View style={styles.weatherCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading weather...</Text>
        </View>
      </View>
    );
  }

  // Use the simplified function with only weather parameters
  const weatherKey = getWeatherKey(
    weatherData.weather[0].main,
    weatherData.weather[0].description
  );
  
  const videoSource = weatherVideos[weatherKey];

  return (
    <View style={styles.weatherCardContainer}>
      <TouchableOpacity onPress={handleWeatherCardPress} style={styles.weatherCard}>
        <Video
          source={videoSource}
          style={StyleSheet.absoluteFill}
          muted
          repeat
          resizeMode="cover"
          rate={1.0}
          ignoreSilentSwitch="obey"
          paused={false}
        />

        <View style={styles.weatherDetails}>
          <View>
            <Text style={styles.tempText}>{Math.round(weatherData.main.temp)}°C</Text>
            <Text style={styles.humidityText}>{weatherData.main.humidity}%</Text>
          </View>
          <View style={styles.conditionDetails}>
            <Text style={styles.conditionText}>{weatherData.weather[0].main}</Text>
            <Text style={styles.cityText}>{weatherData.name}</Text>
          </View>
        </View>
        
        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Text style={styles.tapText}>Tap to change location</Text>
        </View>
      </TouchableOpacity>

      <Modal 
        visible={isModalVisible} 
        transparent 
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={closeModal}
          />
          
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            {showLocationOptions ? (
              // Location options screen
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>📍 Choose Location</Text>
                  <Text style={styles.modalSubtitle}>How would you like to set your location?</Text>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>📍 Use Current Location</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.manualButton]} 
                    onPress={handleManualLocation}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.manualButtonText}>🌍 Enter City Manually</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={closeModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // Manual location input screen
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <Text style={styles.modalTitle}>📍 Enter Location</Text>
                  <Text style={styles.modalSubtitle}>Search for any city worldwide</Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>🌍</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., New York, London, Tokyo"
                      placeholderTextColor="#999"
                      value={manualLocation}
                      onChangeText={setManualLocation}
                      autoFocus
                      returnKeyType="search"
                      onSubmitEditing={() => fetchWeatherDataByCity(manualLocation)}
                    />
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.submitButton]} 
                    onPress={() => fetchWeatherDataByCity(manualLocation)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.submitButtonText}>🔍 Search Weather</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={closeModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
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
    position: 'relative',
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
  tapIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tapText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: width * 0.9,
    maxWidth: 400,
    padding: 0,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    // Shadow for Android
    elevation: 25,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    padding: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    // Shadow for iOS
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#34C759',
    // Shadow for iOS
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});