import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { UserRole, AuthStackParamList } from '../types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthenticated: (role: UserRole) => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthenticated }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen
            onLogin={() => props.navigation.navigate('RoleSelect')}
            onNavigateToSignUp={() => props.navigation.navigate('SignUp')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {(props) => (
          <SignUpScreen
            onSignUp={() => props.navigation.navigate('RoleSelect')}
            onNavigateToLogin={() => props.navigation.navigate('Login')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RoleSelect">
        {() => <RoleSelectScreen onSelectRole={onAuthenticated} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
