import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PassengerHomeScreen } from '../screens/passenger/HomeScreen';
import { PostRideRequestScreen } from '../screens/passenger/PostRideRequestScreen';
import { ViewBidsScreen } from '../screens/passenger/ViewBidsScreen';
import { SelectDriverScreen } from '../screens/passenger/SelectDriverScreen';
import { TrackRideScreen } from '../screens/passenger/TrackRideScreen';
import { Colors, FontSize } from '../theme/colors';
import { PassengerStackParamList, PassengerTabParamList } from '../types';

const Tab = createBottomTabNavigator<PassengerTabParamList>();
const Stack = createNativeStackNavigator<PassengerStackParamList>();

interface PassengerNavigatorProps {
  onLogout: () => void;
}

function PassengerTabs({ navigation }: { navigation: any }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'PostRequest') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'MyRides') iconName = focused ? 'car' : 'car-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
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
      <Tab.Screen name="Home" options={{ tabBarLabel: 'Home' }}>
        {() => (
          <PassengerHomeScreen
            onPostRequest={() => navigation.navigate('PostRequest' as never)}
            onViewBids={(id) => navigation.navigate('ViewBids' as never, { requestId: id } as never)}
            onTrackRide={(id) => navigation.navigate('TrackRide' as never, { rideId: id } as never)}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="PostRequest" options={{ tabBarLabel: 'Post' }}>
        {() => (
          <PostRideRequestScreen
            onBack={() => navigation.goBack()}
            onSubmit={() => navigation.goBack()}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="MyRides" options={{ tabBarLabel: 'My Rides' }}>
        {() => (
          <PassengerHomeScreen
            onPostRequest={() => navigation.navigate('PostRequest' as never)}
            onViewBids={(id) => navigation.navigate('ViewBids' as never, { requestId: id } as never)}
            onTrackRide={(id) => navigation.navigate('TrackRide' as never, { rideId: id } as never)}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Profile' }}>
        {() => (
          <PassengerHomeScreen
            onPostRequest={() => navigation.navigate('PostRequest' as never)}
            onViewBids={(id) => navigation.navigate('ViewBids' as never, { requestId: id } as never)}
            onTrackRide={(id) => navigation.navigate('TrackRide' as never, { rideId: id } as never)}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export const PassengerNavigator: React.FC<PassengerNavigatorProps> = ({ onLogout }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PassengerTabs">
        {(props) => <PassengerTabs navigation={props.navigation} />}
      </Stack.Screen>
      <Stack.Screen name="ViewBids">
        {(props) => (
          <ViewBidsScreen
            onBack={() => props.navigation.goBack()}
            onSelectBid={(bidId) =>
              props.navigation.navigate('SelectDriver', {
                requestId: (props.route.params as any)?.requestId ?? '',
                bidId,
              })
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SelectDriver">
        {(props) => (
          <SelectDriverScreen
            onBack={() => props.navigation.goBack()}
            onConfirm={() =>
              props.navigation.navigate('TrackRide', { rideId: 'ride-new' })
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="TrackRide">
        {(props) => (
          <TrackRideScreen
            onBack={() => props.navigation.goBack()}
            onComplete={() => props.navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
