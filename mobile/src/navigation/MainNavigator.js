import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import SearchRidesScreen from '../screens/passenger/SearchRidesScreen';
import RideDetailScreen from '../screens/passenger/RideDetailScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import SelectDriverScreen from '../screens/passenger/SelectDriverScreen';
import PostRideScreen from '../screens/driver/PostRideScreen';
import MyRidesScreen from '../screens/driver/MyRidesScreen';
import DriverDashboardScreen from '../screens/driver/DriverDashboardScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import HomeScreen from '../screens/shared/HomeScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import LiveTrackingScreen from '../screens/shared/LiveTrackingScreen';
import TrustScoreScreen from '../screens/shared/TrustScoreScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ReportUserScreen from '../screens/shared/ReportUserScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import PaymentHistoryScreen from '../screens/payment/PaymentHistoryScreen';
import StripeConnectScreen from '../screens/payment/StripeConnectScreen';
import DocumentUploadScreen from '../screens/safety/DocumentUploadScreen';
import SOSScreen from '../screens/safety/SOSScreen';
import ShareRideScreen from '../screens/safety/ShareRideScreen';
import TripHistoryScreen from '../screens/safety/TripHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const icons = { Home: '🏠', Search: '🔍', Bookings: '📋', 'My Rides': '🚗', Payments: '💳', Profile: '👤' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>;
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'RideShare', headerStyle: { backgroundColor: '#4F46E5' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SearchRides" component={SearchRidesScreen} options={{ title: 'Find Rides' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="SelectDriver" component={SelectDriverScreen} options={{ title: 'Select Driver' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'Emergency SOS', headerStyle: { backgroundColor: '#FEE2E2' } }} />
      <Stack.Screen name="ShareRide" component={ShareRideScreen} options={{ title: 'Share Ride' }} />
      <Stack.Screen name="ReportUser" component={ReportUserScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyBookingsList" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="SelectDriver" component={SelectDriverScreen} options={{ title: 'Select Driver' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'Emergency SOS', headerStyle: { backgroundColor: '#FEE2E2' } }} />
      <Stack.Screen name="ShareRide" component={ShareRideScreen} options={{ title: 'Share Ride' }} />
      <Stack.Screen name="ReportUser" component={ReportUserScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="MyRidesList" component={MyRidesScreen} options={{ title: 'My Rides' }} />
      <Stack.Screen name="PostRide" component={PostRideScreen} options={{ title: 'Post a Ride' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Earnings' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'Emergency SOS', headerStyle: { backgroundColor: '#FEE2E2' } }} />
      <Stack.Screen name="ShareRide" component={ShareRideScreen} options={{ title: 'Share Ride' }} />
      <Stack.Screen name="ReportUser" component={ReportUserScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="PaymentDetail" component={PaymentScreen} options={{ title: 'Payment Details' }} />
      <Stack.Screen name="StripeConnect" component={StripeConnectScreen} options={{ title: 'Payouts Setup' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="TrustScore" component={TrustScoreScreen} options={{ title: 'Trust Score' }} />
      <Stack.Screen name="Documents" component={DocumentUploadScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="TripHistory" component={TripHistoryScreen} options={{ title: 'Trip History' }} />
      <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'Emergency SOS', headerStyle: { backgroundColor: '#FEE2E2' } }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver' || user?.role === 'both';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      {isDriver && <Tab.Screen name="My Rides" component={DriverStack} />}
      <Tab.Screen name="Payments" component={PaymentsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
