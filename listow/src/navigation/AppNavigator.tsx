import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { AppTheme } from '../theme';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ListDetailsScreen from '../screens/ListDetailsScreen';
import ShareListScreen from '../screens/ShareListScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const theme = useTheme<AppTheme>();

  if (isAuthLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outline,
          },
          headerTintColor: theme.colors.onBackground,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerShown: false, // Custom header in HomeScreen looks better
              }}
            />
            <Stack.Screen
              name="ListDetails"
              component={ListDetailsScreen}
              options={{
                title: 'Detalhes da Lista',
              }}
            />
            <Stack.Screen
              name="ShareList"
              component={ShareListScreen}
              options={{
                title: 'Compartilhar',
              }}
            />
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                headerShown: false, // Modern register screens usually don't have a standard header
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
