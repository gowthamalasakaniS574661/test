import { useState, useEffect } from 'react';
import { MAPS_CONFIG } from '../config/maps';

export default function useRouteDirections(origin, destination) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!origin?.latitude || !destination?.latitude) {
      setRouteCoordinates([]);
      setDistance(null);
      setDuration(null);
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      setLoading(true);
      setError(null);

      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${destination.latitude},${destination.longitude}` +
          `&key=${MAPS_CONFIG.apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (cancelled) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const points = decodePolyline(route.overview_polyline.points);
          setRouteCoordinates(points);

          const leg = route.legs[0];
          setDistance(leg.distance.value / 1000);
          setDuration(leg.duration.value / 60);
        } else {
          setRouteCoordinates([origin, destination]);
          setError('No route found');
        }
      } catch (err) {
        if (!cancelled) {
          setRouteCoordinates([origin, destination]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRoute();
    return () => { cancelled = true; };
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  return { routeCoordinates, distance, duration, loading, error };
}

function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}
