import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { PassengerNavigator } from './PassengerNavigator';
import { DriverNavigator } from './DriverNavigator';
import { UserRole } from '../types';

type AppState = 'auth' | 'passenger' | 'driver';

export const AppNavigator: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('auth');

  const handleAuthenticated = (role: UserRole) => {
    setAppState(role);
  };

  const handleLogout = () => {
    setAppState('auth');
  };

  return (
    <NavigationContainer>
      {appState === 'auth' && <AuthNavigator onAuthenticated={handleAuthenticated} />}
      {appState === 'passenger' && <PassengerNavigator onLogout={handleLogout} />}
      {appState === 'driver' && <DriverNavigator onLogout={handleLogout} />}
    </NavigationContainer>
  );
};
