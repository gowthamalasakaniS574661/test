const { rankDrivers, haversineDistance, normalise } = require('../src/services/matchingService');

describe('matchingService', () => {
  describe('haversineDistance', () => {
    it('should return 0 for the same point', () => {
      const d = haversineDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(d).toBeCloseTo(0, 5);
    });

    it('should compute a known distance (SF to LA ~559 km)', () => {
      const d = haversineDistance(37.7749, -122.4194, 34.0522, -118.2437);
      expect(d).toBeGreaterThan(540);
      expect(d).toBeLessThan(580);
    });

    it('should compute a short distance correctly', () => {
      const d = haversineDistance(37.7749, -122.4194, 37.7849, -122.4094);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(5);
    });
  });

  describe('normalise', () => {
    it('should return 0 for the min value', () => {
      expect(normalise(0, 0, 100)).toBe(0);
    });

    it('should return 1 for the max value', () => {
      expect(normalise(100, 0, 100)).toBe(1);
    });

    it('should return 0.5 for the midpoint', () => {
      expect(normalise(50, 0, 100)).toBe(0.5);
    });

    it('should invert correctly', () => {
      expect(normalise(0, 0, 100, true)).toBe(1);
      expect(normalise(100, 0, 100, true)).toBe(0);
      expect(normalise(50, 0, 100, true)).toBe(0.5);
    });

    it('should return 1 when min equals max', () => {
      expect(normalise(5, 5, 5)).toBe(1);
    });
  });

  describe('rankDrivers', () => {
    const defaultWeights = {
      bidPrice: 0.35,
      driverRating: 0.25,
      distance: 0.20,
      trustScore: 0.20,
    };

    it('should return empty array for no bids', () => {
      expect(rankDrivers([], 37.0, -122.0, defaultWeights)).toEqual([]);
    });

    it('should return empty array for null bids', () => {
      expect(rankDrivers(null, 37.0, -122.0, defaultWeights)).toEqual([]);
    });

    it('should handle a single bid', () => {
      const bids = [
        { bidId: 'b1', amount: '25.00', driverRating: 4.5, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].scores.composite).toBe(1);
      expect(ranked[0].bidId).toBe('b1');
    });

    it('should rank a cheaper bid higher when other factors are equal', () => {
      const bids = [
        { bidId: 'expensive', amount: '50.00', driverRating: 4.0, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
        { bidId: 'cheap', amount: '20.00', driverRating: 4.0, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked[0].bidId).toBe('cheap');
      expect(ranked[1].bidId).toBe('expensive');
    });

    it('should rank a higher-rated driver higher when other factors are equal', () => {
      const bids = [
        { bidId: 'low-rating', amount: '30.00', driverRating: 2.0, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
        { bidId: 'high-rating', amount: '30.00', driverRating: 5.0, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked[0].bidId).toBe('high-rating');
    });

    it('should rank a closer driver higher when other factors are equal', () => {
      const bids = [
        { bidId: 'far', amount: '30.00', driverRating: 4.0, trustScore: 4.0, driverLat: 38.5, driverLng: -121.5 },
        { bidId: 'close', amount: '30.00', driverRating: 4.0, trustScore: 4.0, driverLat: 37.775, driverLng: -122.415 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked[0].bidId).toBe('close');
    });

    it('should rank a higher trust score driver higher when other factors are equal', () => {
      const bids = [
        { bidId: 'low-trust', amount: '30.00', driverRating: 4.0, trustScore: 2.0, driverLat: 37.78, driverLng: -122.42 },
        { bidId: 'high-trust', amount: '30.00', driverRating: 4.0, trustScore: 5.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked[0].bidId).toBe('high-trust');
    });

    it('should produce a composite ranking across all factors', () => {
      const bids = [
        {
          bidId: 'balanced',
          amount: '30.00',
          driverRating: 4.5,
          trustScore: 4.5,
          driverLat: 37.775,
          driverLng: -122.415,
        },
        {
          bidId: 'cheap-but-bad',
          amount: '15.00',
          driverRating: 2.0,
          trustScore: 1.5,
          driverLat: 38.5,
          driverLng: -121.0,
        },
        {
          bidId: 'premium-close',
          amount: '45.00',
          driverRating: 5.0,
          trustScore: 5.0,
          driverLat: 37.771,
          driverLng: -122.411,
        },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked).toHaveLength(3);
      expect(ranked[0].scores.composite).toBeGreaterThanOrEqual(ranked[1].scores.composite);
      expect(ranked[1].scores.composite).toBeGreaterThanOrEqual(ranked[2].scores.composite);
    });

    it('should handle bids without location data (null lat/lng)', () => {
      const bids = [
        { bidId: 'no-loc', amount: '25.00', driverRating: 4.5, trustScore: 4.0, driverLat: null, driverLng: null },
        { bidId: 'has-loc', amount: '25.00', driverRating: 4.5, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      expect(ranked).toHaveLength(2);
      ranked.forEach((b) => {
        expect(b.scores.composite).toBeGreaterThanOrEqual(0);
        expect(b.scores.composite).toBeLessThanOrEqual(1);
      });
    });

    it('should handle bids when pickup location is null', () => {
      const bids = [
        { bidId: 'b1', amount: '25.00', driverRating: 4.5, trustScore: 4.0, driverLat: 37.78, driverLng: -122.42 },
      ];
      const ranked = rankDrivers(bids, null, null, defaultWeights);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].distanceKm).toBeNull();
    });

    it('should respect custom weights', () => {
      const priceFocused = { bidPrice: 0.90, driverRating: 0.05, distance: 0.0, trustScore: 0.05 };

      const bids = [
        { bidId: 'cheap', amount: '10.00', driverRating: 1.0, trustScore: 1.0, driverLat: null, driverLng: null },
        { bidId: 'expensive', amount: '100.00', driverRating: 5.0, trustScore: 5.0, driverLat: null, driverLng: null },
      ];

      const ranked = rankDrivers(bids, null, null, priceFocused);
      expect(ranked[0].bidId).toBe('cheap');
    });

    it('should assign scores between 0 and 1 for all dimensions', () => {
      const bids = [
        { bidId: 'b1', amount: '20.00', driverRating: 3.0, trustScore: 3.0, driverLat: 37.78, driverLng: -122.42 },
        { bidId: 'b2', amount: '40.00', driverRating: 4.5, trustScore: 4.5, driverLat: 37.80, driverLng: -122.40 },
        { bidId: 'b3', amount: '60.00', driverRating: 2.0, trustScore: 2.0, driverLat: 38.00, driverLng: -122.20 },
      ];
      const ranked = rankDrivers(bids, 37.77, -122.41, defaultWeights);
      ranked.forEach((b) => {
        expect(b.scores.bidPrice).toBeGreaterThanOrEqual(0);
        expect(b.scores.bidPrice).toBeLessThanOrEqual(1);
        expect(b.scores.driverRating).toBeGreaterThanOrEqual(0);
        expect(b.scores.driverRating).toBeLessThanOrEqual(1);
        expect(b.scores.distance).toBeGreaterThanOrEqual(0);
        expect(b.scores.distance).toBeLessThanOrEqual(1);
        expect(b.scores.trustScore).toBeGreaterThanOrEqual(0);
        expect(b.scores.trustScore).toBeLessThanOrEqual(1);
        expect(b.scores.composite).toBeGreaterThanOrEqual(0);
        expect(b.scores.composite).toBeLessThanOrEqual(1);
      });
    });

    it('should handle string amounts correctly', () => {
      const bids = [
        { bidId: 'b1', amount: '25.50', driverRating: 4.0, trustScore: 3.5, driverLat: null, driverLng: null },
        { bidId: 'b2', amount: '30.75', driverRating: 3.5, trustScore: 4.0, driverLat: null, driverLng: null },
      ];
      const ranked = rankDrivers(bids, null, null, defaultWeights);
      expect(ranked).toHaveLength(2);
      expect(ranked[0].scores.composite).toBeDefined();
    });

    it('should handle zero driver rating and trust score', () => {
      const bids = [
        { bidId: 'b1', amount: '25.00', driverRating: 0, trustScore: 0, driverLat: null, driverLng: null },
        { bidId: 'b2', amount: '30.00', driverRating: 5.0, trustScore: 5.0, driverLat: null, driverLng: null },
      ];
      const ranked = rankDrivers(bids, null, null, defaultWeights);
      expect(ranked[0].bidId).toBe('b2');
    });
  });
});
