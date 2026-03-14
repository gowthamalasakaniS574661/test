import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MAPS_CONFIG, MAP_STYLE } from '../../config/maps';
import { getRegionForCoordinates } from '../../utils/location';

export default function RouteMap({
  origin,
  destination,
  routeCoordinates,
  driverLocation,
  style,
  showsUserLocation = false,
  interactive = true,
  children,
}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const points = [];
    if (origin?.latitude) points.push(origin);
    if (destination?.latitude) points.push(destination);
    if (driverLocation?.latitude) points.push(driverLocation);

    if (points.length >= 2) {
      const region = getRegionForCoordinates(points);
      if (region) {
        mapRef.current.animateToRegion(region, 500);
      }
    }
  }, [mapReady, origin, destination, driverLocation]);

  const initialRegion =
    origin?.latitude && destination?.latitude
      ? getRegionForCoordinates([origin, destination])
      : origin?.latitude
        ? { ...origin, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        : MAPS_CONFIG.defaultRegion;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={MAP_STYLE}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsUserLocation}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={false}
        onMapReady={() => setMapReady(true)}
        loadingEnabled
        loadingIndicatorColor="#4F46E5"
      >
        {origin?.latitude && (
          <Marker
            coordinate={origin}
            title="Pickup"
            description={origin.address || 'Pickup location'}
            pinColor="#4F46E5"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.originMarker]}>
                <Text style={styles.markerText}>P</Text>
              </View>
              <View style={[styles.markerTail, styles.originTail]} />
            </View>
          </Marker>
        )}

        {destination?.latitude && (
          <Marker
            coordinate={destination}
            title="Destination"
            description={destination.address || 'Destination'}
            pinColor="#EF4444"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.destMarker]}>
                <Text style={styles.markerText}>D</Text>
              </View>
              <View style={[styles.markerTail, styles.destTail]} />
            </View>
          </Marker>
        )}

        {driverLocation?.latitude && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            description="Current driver location"
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverIcon}>🚗</Text>
            </View>
          </Marker>
        )}

        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={MAPS_CONFIG.routeStrokeWidth}
            strokeColor={MAPS_CONFIG.routeStrokeColor}
            lineDashPattern={[0]}
          />
        )}

        {children}
      </MapView>

      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  originMarker: {
    backgroundColor: '#4F46E5',
  },
  destMarker: {
    backgroundColor: '#EF4444',
  },
  markerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  markerTail: {
    width: 3,
    height: 8,
    marginTop: -1,
  },
  originTail: {
    backgroundColor: '#4F46E5',
  },
  destTail: {
    backgroundColor: '#EF4444',
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  driverIcon: {
    fontSize: 20,
  },
});
