export type UserRole = 'passenger' | 'driver';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  rating: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  pickup: Location;
  dropoff: Location;
  dateTime: string;
  seats: number;
  notes?: string;
  status: 'open' | 'bidding' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  bids: Bid[];
}

export interface Bid {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  price: number;
  estimatedTime: string;
  vehicleInfo: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface PostedRide {
  id: string;
  driverId: string;
  driverName: string;
  origin: Location;
  destination: Location;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleInfo: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Earning {
  id: string;
  rideId: string;
  route: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending';
}

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  RoleSelect: undefined;
};

export type PassengerTabParamList = {
  Home: undefined;
  PostRequest: undefined;
  MyRides: undefined;
  Profile: undefined;
};

export type PassengerStackParamList = {
  PassengerTabs: undefined;
  ViewBids: { requestId: string };
  SelectDriver: { requestId: string; bidId: string };
  TrackRide: { rideId: string };
};

export type DriverTabParamList = {
  Dashboard: undefined;
  PostRide: undefined;
  Requests: undefined;
  Earnings: undefined;
};

export type DriverStackParamList = {
  DriverTabs: undefined;
  PlaceBid: { requestId: string };
  RideDetail: { rideId: string };
};
