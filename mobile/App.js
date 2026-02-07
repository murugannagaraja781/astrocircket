import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Icons done
import { MaterialCommunityIcons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import MatchDetailScreen from './src/screens/MatchDetailScreen';
import FantasyScreen from './src/screens/FantasyScreen';
import ExpertListScreen from './src/screens/ExpertListScreen';
import KPSubTimelineScreen from './src/screens/KPSubTimelineScreen';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { theme } from './src/utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack for Home Flow (Match List -> Detail)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MatchList" component={HomeScreen} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      <Stack.Screen name="KPDetail" component={KPSubTimelineScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'cricket';
          else if (route.name === 'Fantasy') iconName = 'trophy-outline';
          else if (route.name === 'Experts') iconName = 'account-group';
          else if (route.name === 'KP Astrology') iconName = 'chart-timeline-variant';
          else if (route.name === 'Matches') iconName = 'calendar-clock';
          else iconName = 'circle';

          return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="KP Astrology" component={KPSubTimelineScreen} />
      <Tab.Screen name="Fantasy" component={FantasyScreen} />
      <Tab.Screen name="Experts" component={ExpertListScreen} />
    </Tab.Navigator>
  );
}

function AppNav() {
  const { userToken } = useContext(AuthContext);

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PaperProvider theme={theme}>
          <AppNav />
          <StatusBar style="light" backgroundColor="#000" />
        </PaperProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
