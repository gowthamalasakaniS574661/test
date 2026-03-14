import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationTrackingService } from '../services/locationTracking';
import { trackingAPI } from '../api/tracking';

export default function useLiveTracking(bookingId, { isDriver = false, enabled = true } = {}) {
  const [driverLocation, setDriverLocation] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  const startDriverTracking = useCallback(async () => {
    if (!bookingId) return;
    setTrackingStatus('tracking');

    try {
      await LocationTrackingService.startTracking(async (coords) => {
        setDriverLocation(coords);
        try {
          await trackingAPI.updateDriverLocation(bookingId, coords);
        } catch {
          // Server update failed - continue tracking locally
        }
      });
    } catch (err) {
      setError(err.message);
      setTrackingStatus('error');
    }
  }, [bookingId]);

  const startPassengerPolling = useCallback(() => {
    if (!bookingId) return;
    setTrackingStatus('tracking');

    const poll = async () => {
      try {
        const response = await trackingAPI.getDriverLocation(bookingId);
        const { latitude, longitude, heading, speed } = response.data;
        if (latitude && longitude) {
          setDriverLocation({ latitude, longitude, heading, speed });
        }
      } catch {
        // Polling failed - will retry on next interval
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 5000);
  }, [bookingId]);

  useEffect(() => {
    if (!enabled || !bookingId) return;

    if (isDriver) {
      startDriverTracking();
    } else {
      startPassengerPolling();
    }

    return () => {
      LocationTrackingService.stopTracking();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setTrackingStatus('idle');
    };
  }, [enabled, bookingId, isDriver, startDriverTracking, startPassengerPolling]);

  const stopTracking = useCallback(() => {
    LocationTrackingService.stopTracking();
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setTrackingStatus('stopped');
  }, []);

  return {
    driverLocation,
    trackingStatus,
    error,
    stopTracking,
  };
}
