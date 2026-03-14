import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY =
  Constants.expoConfig?.ios?.config?.googleMapsApiKey ||
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
  'YOUR_GOOGLE_MAPS_API_KEY';

export const MAPS_CONFIG = {
  apiKey: GOOGLE_MAPS_API_KEY,
  defaultRegion: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  trackingInterval: 5000,
  trackingDistanceFilter: 10,
  routeStrokeWidth: 4,
  routeStrokeColor: '#4F46E5',
};

export const MAP_STYLE = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];
