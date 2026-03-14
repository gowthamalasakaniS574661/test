import * as Location from 'expo-location';
import { MAPS_CONFIG } from '../config/maps';

let trackingSubscription = null;
let trackingCallbacks = [];

export const LocationTrackingService = {
  async startTracking(onLocationUpdate) {
    if (trackingSubscription) {
      trackingCallbacks.push(onLocationUpdate);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission is required for live tracking');
    }

    trackingCallbacks = [onLocationUpdate];

    trackingSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: MAPS_CONFIG.trackingInterval,
        distanceInterval: MAPS_CONFIG.trackingDistanceFilter,
      },
      (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          timestamp: location.timestamp,
        };
        trackingCallbacks.forEach((cb) => cb(coords));
      }
    );
  },

  stopTracking() {
    if (trackingSubscription) {
      trackingSubscription.remove();
      trackingSubscription = null;
      trackingCallbacks = [];
    }
  },

  removeCallback(callback) {
    trackingCallbacks = trackingCallbacks.filter((cb) => cb !== callback);
    if (trackingCallbacks.length === 0) {
      this.stopTracking();
    }
  },

  isTracking() {
    return trackingSubscription !== null;
  },
};
