import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { theme } from './src/utils/theme';
import messaging from '@react-native-firebase/messaging';

const Stack = createNativeStackNavigator();

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
}

function AppNav() {
  console.log('AppNav: Rendering...');

  const { userToken, isLoading } = useContext(AuthContext);

  useEffect(() => {
    requestUserPermission();

    // Check if app was opened from a notification
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      }
    });

    // Handle background notifications
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage.notification);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    console.log('AppNav: Loading state, returning View');
    return <View style={{ flex: 1, backgroundColor: 'white' }} />;
  }

  return (
    <NavigationContainer
      onReady={() => console.log('NavigationContainer: Ready')}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userToken ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  console.log('App: Starting initialization...');
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNav />
      </AuthProvider>
    </PaperProvider>
  );
}
