import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentModules from '../screens/student/StudentModules';
import StudentAttendance from '../screens/student/StudentAttendance';
import ScanScreen from '../screens/student/ScanScreen';
import TutorDashboard from '../screens/tutor/TutorDashboard';
import TutorModules from '../screens/tutor/TutorModules';
import TutorRecords from '../screens/tutor/TutorRecords';
import GenerateQrScreen from '../screens/tutor/GenerateQrScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const makeNavTheme = (isDark) => ({ ...DefaultTheme, dark: isDark, colors: { ...DefaultTheme.colors, background: colors.bgDark, card: colors.bgDark, text: colors.textPrimary, border: colors.bgDark, primary: colors.accentBlue } });

/* bg_bottom_nav.xml: 1dp accent-blue line on top of a bg_dark bar.
   nav_item_color.xml: checked = accent_blue, otherwise white */
function ScanQTabBar({ state, descriptors, navigation }) {
  useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.bgDark, borderTopWidth: 1, borderTopColor: colors.accentBlue, paddingBottom: insets.bottom, flexDirection: 'row' }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const color = focused ? colors.accentBlue : colors.textPrimary;
        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 10 }}
          >
            <Ionicons name={options.tabBarIconName} size={24} color={color} />
            <Text style={{ color, fontSize: 12, marginTop: 2 }}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabOpts = (icon) => ({ headerShown: false, tabBarIconName: icon });

function StudentTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <ScanQTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={StudentDashboard} options={tabOpts('home')} />
      <Tab.Screen name="My Modules" component={StudentModules} options={tabOpts('book')} />
      <Tab.Screen name="Attendance" component={StudentAttendance} options={tabOpts('bar-chart')} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={tabOpts('person')} />
    </Tab.Navigator>
  );
}

function TutorTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <ScanQTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={TutorDashboard} options={tabOpts('home')} />
      <Tab.Screen name="Modules" component={TutorModules} options={tabOpts('book')} />
      <Tab.Screen name="Students" component={TutorRecords} options={tabOpts('people')} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={tabOpts('person')} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { profile, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgDark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accentBlue} size="large" />
      </View>
    );
  }

  const role = profile?.role;
  return (
    <NavigationContainer theme={makeNavTheme(isDark)}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bgDark } }}>
        {role === 'student' ? (
          <>
            <Stack.Screen name="StudentTabs" component={StudentTabs} />
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        ) : role === 'tutor' ? (
          <>
            <Stack.Screen name="TutorTabs" component={TutorTabs} />
            <Stack.Screen name="GenerateQr" component={GenerateQrScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
