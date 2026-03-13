import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { PostRideScreen } from '../screens/driver/PostRideScreen';
import { ViewRideRequestsScreen } from '../screens/driver/ViewRideRequestsScreen';
import { PlaceBidScreen } from '../screens/driver/PlaceBidScreen';
import { EarningsScreen } from '../screens/driver/EarningsScreen';
import { Colors, FontSize } from '../theme/colors';
import { DriverStackParamList, DriverTabParamList } from '../types';

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

interface DriverNavigatorProps {
  onLogout: () => void;
}

function DriverTabs({ navigation }: { navigation: any }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'speedometer';
          if (route.name === 'Dashboard') iconName = focused ? 'speedometer' : 'speedometer-outline';
          else if (route.name === 'PostRide') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Requests') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Earnings') iconName = focused ? 'wallet' : 'wallet-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          paddingBottom: 4,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Dashboard' }}>
        {() => (
          <DashboardScreen
            onViewRequests={() => navigation.navigate('Requests' as never)}
            onPostRide={() => navigation.navigate('PostRide' as never)}
            onViewEarnings={() => navigation.navigate('Earnings' as never)}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="PostRide" options={{ tabBarLabel: 'Post Ride' }}>
        {() => (
          <PostRideScreen
            onBack={() => navigation.goBack()}
            onSubmit={() => navigation.goBack()}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Requests" options={{ tabBarLabel: 'Requests' }}>
        {() => (
          <ViewRideRequestsScreen
            onBack={() => navigation.goBack()}
            onPlaceBid={(id) => navigation.navigate('PlaceBid' as never, { requestId: id } as never)}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Earnings" options={{ tabBarLabel: 'Earnings' }}>
        {() => (
          <EarningsScreen onBack={() => navigation.goBack()} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export const DriverNavigator: React.FC<DriverNavigatorProps> = ({ onLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverTabs">
        {(props) => <DriverTabs navigation={props.navigation} />}
      </Stack.Screen>
      <Stack.Screen name="PlaceBid">
        {(props) => (
          <PlaceBidScreen
            onBack={() => props.navigation.goBack()}
            onSubmit={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
