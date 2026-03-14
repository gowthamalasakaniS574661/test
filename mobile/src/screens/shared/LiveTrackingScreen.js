import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteMap, RideInfoOverlay } from '../../components/map';
import useLiveTracking from '../../hooks/useLiveTracking';
import useRouteDirections from '../../hooks/useRouteDirections';
import { useAuth } from '../../contexts/AuthContext';
import { bookingsAPI } from '../../api/bookings';
import { trackingAPI } from '../../api/tracking';
import { calculateDistance, formatDistance, formatDuration } from '../../utils/location';

export default function LiveTrackingScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rideStatus, setRideStatus] = useState('waiting');

  const isDriver = booking?.ride?.driverId === user?.id;

  const origin = booking?.ride?.origin
    ? {
        latitude: booking.ride.origin.lat || booking.ride.origin.latitude,
        longitude: booking.ride.origin.lng || booking.ride.origin.longitude,
        address: booking.ride.origin.address,
      }
    : null;

  const destination = booking?.ride?.destination
    ? {
        latitude: booking.ride.destination.lat || booking.ride.destination.latitude,
        longitude: booking.ride.destination.lng || booking.ride.destination.longitude,
        address: booking.ride.destination.address,
      }
    : null;

  const { driverLocation, trackingStatus, error: trackingError } = useLiveTracking(
    bookingId,
    { isDriver, enabled: booking?.status === 'in_progress' || booking?.status === 'confirmed' }
  );

  const { routeCoordinates, distance: routeDistance, duration: routeDuration } =
    useRouteDirections(origin, destination);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  useEffect(() => {
    if (!driverLocation || !destination) return;

    const distToDestination = calculateDistance(driverLocation, destination);
    if (distToDestination < 0.2) {
      setRideStatus('arriving');
    } else if (booking?.status === 'in_progress') {
      setRideStatus('in_transit');
    }
  }, [driverLocation, destination, booking?.status]);

  const loadBooking = async () => {
    try {
      const response = await bookingsAPI.getBookingById(bookingId);
      setBooking(response.data.booking || response.data);
      const status = response.data.booking?.status || response.data.status;
      if (status === 'in_progress') {
        setRideStatus('in_transit');
      } else if (status === 'confirmed') {
        setRideStatus('waiting');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = useCallback(async () => {
    try {
      await trackingAPI.startRide(bookingId);
      setRideStatus('in_transit');
      setBooking((prev) => prev ? { ...prev, status: 'in_progress' } : prev);
      Alert.alert('Ride Started', 'Live tracking is now active.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start ride');
    }
  }, [bookingId]);

  const handleCompleteRide = useCallback(async () => {
    Alert.alert('Complete Ride', 'Are you sure you want to mark this ride as complete?', [
      { text: 'Cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await trackingAPI.completeRide(bookingId);
            setRideStatus('completed');
            Alert.alert('Ride Complete', 'The ride has been completed.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to complete ride');
          }
        },
      },
    ]);
  }, [bookingId, navigation]);

  const remainingDistance =
    driverLocation && destination
      ? calculateDistance(driverLocation, destination)
      : routeDistance;

  const estimatedArrival = remainingDistance && routeDuration && routeDistance
    ? formatDuration((remainingDistance / routeDistance) * routeDuration)
    : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <RouteMap
          origin={origin}
          destination={destination}
          routeCoordinates={routeCoordinates}
          driverLocation={driverLocation}
          style={styles.map}
          showsUserLocation={!isDriver}
        />

        {trackingStatus === 'tracking' && (
          <View style={styles.trackingBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.trackingText}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.infoPanel}>
        <RideInfoOverlay
          distance={remainingDistance}
          duration={
            remainingDistance && routeDuration && routeDistance
              ? (remainingDistance / routeDistance) * routeDuration
              : routeDuration
          }
          status={rideStatus}
          estimatedArrival={estimatedArrival}
        />

        <View style={styles.locationDetails}>
          {origin && (
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.originDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {origin.address || 'Pickup location'}
                </Text>
              </View>
            </View>
          )}
          {destination && (
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, styles.destDot]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Destination</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {destination.address || 'Destination'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {isDriver && rideStatus === 'waiting' && (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
            <Text style={styles.startButtonText}>Start Ride</Text>
          </TouchableOpacity>
        )}

        {isDriver && (rideStatus === 'in_transit' || rideStatus === 'arriving') && (
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteRide}>
            <Text style={styles.completeButtonText}>Complete Ride</Text>
          </TouchableOpacity>
        )}

        {trackingError && (
          <Text style={styles.errorText}>{trackingError}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: 0,
  },
  trackingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  trackingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoPanel: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  locationDetails: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  originDot: {
    backgroundColor: '#4F46E5',
  },
  destDot: {
    backgroundColor: '#EF4444',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
