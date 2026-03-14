import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import SearchRidesScreen from '../screens/passenger/SearchRidesScreen';
import RideDetailScreen from '../screens/passenger/RideDetailScreen';
import MyBookingsScreen from '../screens/passenger/MyBookingsScreen';
import PostRideScreen from '../screens/driver/PostRideScreen';
import MyRidesScreen from '../screens/driver/MyRidesScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import LiveTrackingScreen from '../screens/shared/LiveTrackingScreen';
import TrustScoreScreen from '../screens/shared/TrustScoreScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import PaymentHistoryScreen from '../screens/payment/PaymentHistoryScreen';
import StripeConnectScreen from '../screens/payment/StripeConnectScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ label, focused }) {
  const icons = { Search: '🔍', Bookings: '📋', 'My Rides': '🚗', Payments: '💳', Profile: '👤' };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>;
}

function SearchStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SearchRides" component={SearchRidesScreen} options={{ title: 'Find Rides' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
    </Stack.Navigator>
  );
}

function BookingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyBookingsList" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
    </Stack.Navigator>
  );
}

function DriverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyRidesList" component={MyRidesScreen} options={{ title: 'My Rides' }} />
      <Stack.Screen name="PostRide" component={PostRideScreen} options={{ title: 'Post a Ride' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: 'Ride Details' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Tracking', headerTransparent: true, headerTintColor: '#111827' }} />
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
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Bookings" component={BookingsStack} />
      {isDriver && <Tab.Screen name="My Rides" component={DriverStack} />}
      <Tab.Screen name="Payments" component={PaymentsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
