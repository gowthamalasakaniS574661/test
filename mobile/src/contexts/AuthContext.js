import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, token: action.token, user: action.user, isLoading: false, isAuthenticated: !!action.token };
    case 'LOGIN':
      return { ...state, token: action.token, user: action.user, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { ...state, token: null, user: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.user };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          const response = await authAPI.getProfile();
          dispatch({ type: 'RESTORE_TOKEN', token, user: response.data.user });
        } else {
          dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
        }
      } catch {
        await SecureStore.deleteItemAsync('authToken');
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };
    restoreToken();
  }, []);

  const authActions = {
    login: async (email, password) => {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      await SecureStore.setItemAsync('authToken', token);
      dispatch({ type: 'LOGIN', token, user });
      return user;
    },
    register: async (data) => {
      const response = await authAPI.register(data);
      const { token, user } = response.data;
      await SecureStore.setItemAsync('authToken', token);
      dispatch({ type: 'LOGIN', token, user });
      return user;
    },
    logout: async () => {
      await SecureStore.deleteItemAsync('authToken');
      dispatch({ type: 'LOGOUT' });
    },
    updateUser: (user) => {
      dispatch({ type: 'UPDATE_USER', user });
    },
  };

  return (
    <AuthContext.Provider value={{ ...state, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
