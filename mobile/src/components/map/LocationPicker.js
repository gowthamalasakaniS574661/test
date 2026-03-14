import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MAPS_CONFIG, MAP_STYLE } from '../../config/maps';
import { getCurrentLocation } from '../../utils/location';

export default function LocationPicker({ label, value, onLocationSelect, markerColor = '#4F46E5' }) {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(
    value?.latitude
      ? { ...value, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : MAPS_CONFIG.defaultRegion
  );
  const [selectedLocation, setSelectedLocation] = useState(
    value?.latitude ? value : null
  );
  const [address, setAddress] = useState(value?.address || '');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (value?.latitude && value?.longitude) {
      setSelectedLocation(value);
      setAddress(value.address || '');
    }
  }, [value]);

  const handleMapPress = (e) => {
    const coordinate = e.nativeEvent.coordinate;
    setSelectedLocation(coordinate);
    reverseGeocode(coordinate);
  };

  const reverseGeocode = async (coordinate) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${MAPS_CONFIG.apiKey}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addr = data.results[0].formatted_address;
        setAddress(addr);
        onLocationSelect({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: addr,
        });
      }
    } catch {
      onLocationSelect({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: address || 'Selected location',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_CONFIG.apiKey}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const formattedAddress = data.results[0].formatted_address;
        const coordinate = { latitude: lat, longitude: lng };
        setSelectedLocation(coordinate);
        setAddress(formattedAddress);
        setRegion({ ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        mapRef.current?.animateToRegion(
          { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          500
        );
        onLocationSelect({ ...coordinate, address: formattedAddress });
      }
    } catch {
      // Geocoding failed - keep current state
    } finally {
      setLoading(false);
    }
  };

  const goToCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const coordinate = { latitude: location.latitude, longitude: location.longitude };
      setSelectedLocation(coordinate);
      setRegion({ ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      mapRef.current?.animateToRegion(
        { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
      reverseGeocode(coordinate);
    } catch {
      // Location access failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.dot, { backgroundColor: markerColor }]} />
        <View style={styles.headerInfo}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.addressPreview} numberOfLines={1}>
            {address || 'Tap to select location'}
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.pickerBody}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search address..."
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              onSubmitEditing={handleAddressSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleAddressSearch}>
              <Text style={styles.searchBtnText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationBtn} onPress={goToCurrentLocation}>
              <Text style={styles.locationBtnText}>📍</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              customMapStyle={MAP_STYLE}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
              loadingEnabled
              loadingIndicatorColor="#4F46E5"
            >
              {selectedLocation && (
                <Marker coordinate={selectedLocation} draggable onDragEnd={handleMapPress}>
                  <View style={styles.markerContainer}>
                    <View style={[styles.marker, { backgroundColor: markerColor }]}>
                      <Text style={styles.markerText}>
                        {markerColor === '#4F46E5' ? 'P' : 'D'}
                      </Text>
                    </View>
                  </View>
                </Marker>
              )}
            </MapView>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#4F46E5" />
              </View>
            )}
          </View>

          <Text style={styles.hint}>Tap the map or search to select a location</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressPreview: {
    fontSize: 15,
    color: '#111827',
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pickerBody: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 18,
  },
  locationBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBtnText: {
    fontSize: 18,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
  markerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
