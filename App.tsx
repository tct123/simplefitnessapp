// App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StatusBar, StyleSheet, Pressable, Text, AppState } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import { SQLiteProvider } from 'expo-sqlite';
import { Asset } from 'expo-asset';
import { createBottomTabNavigator } from "expo-router/js-tabs";
import { NavigationContainer, NavigationContainerRef } from "expo-router/react-navigation";
import { createNativeStackNavigator } from 'expo-router/build/react-navigation/native-stack';
import Ionicons from '@react-native-vector-icons/ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';
import * as Notifications from 'expo-notifications';

// Screens
import Home from './screens/Home';
import Workouts from './screens/Workouts';
import CreateWorkout from './screens/CreateWorkout';
import WorkoutDetails from './screens/WorkoutDetails';
import MyCalendar from './screens/MyCalendar';
import LogWorkout from './screens/LogWorkout';
import MyProgress from './screens/MyProgress';
import LogWeights from './screens/LogWeights';
import WeightLogDetail from './screens/WeightLogDetail';
import RecurringWorkoutOptions from './screens/RecurringWorkoutOptions';
import CreateRecurringWorkout from './screens/CreateRecurringWorkout';
import ManageRecurringWorkouts from './screens/ManageRecurringWorkouts';
import RecurringWorkoutDetails from './screens/RecurringWorkoutDetails';
import EditRecurringWorkout from './screens/EditRecurringWorkout';
import StartedWorkoutInterface from './screens/StartedWorkoutInterface';
import Settings from './screens/Settings';
import EditWorkout from './screens/EditWorkout';
import AllLogs from './screens/AllLogs';
import Difficulty from './screens/Difficulty';
import Template from './screens/Template';
import TemplateDetails from './screens/TemplateDetails';
import GraphsWorkoutDetails from './screens/GraphsWorkoutDetails';

// Context & Utils
import './utils/i18n';
import i18n from './utils/i18n';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useRecurringWorkouts } from './utils/recurringWorkoutUtils';
import { checkAndSyncPermissions } from './utils/notificationUtils';

// Types
export type WorkoutStackParamList = {
  WorkoutsList: undefined;
  CreateWorkout: undefined;
  WorkoutDetails: { workout_id: number };
  EditWorkout: { workout_id: number };
  TemplateList: undefined;
  DifficultyList: undefined;
  Difficulty: undefined;
  Template: { workout_difficulty: string };
  TemplateDetails: { workout_id: number };
};

export type WorkoutLogStackParamList = {
  MyCalendar: { refresh?: boolean };
  LogWorkout: { selectedDate?: string };
  RecurringWorkoutOptions: undefined;
  CreateRecurringWorkout: undefined;
  ManageRecurringWorkouts: undefined;
  RecurringWorkoutDetails: { recurring_workout_id: number };
  EditRecurringWorkout: { recurring_workout_id: number };
  StartedWorkoutInterface: { workout_log_id: number };
  LogWeights: { workout_log_id?: number };
};

export type WeightLogStackParamList = {
  MyProgress: undefined;
  LogWeights: { workout_log_id?: number };
  WeightLogDetail: { workoutName: string };
  AllLogs: undefined;
  GraphsWorkoutDetails: undefined;
};

export type StartWorkoutStackParamList = {
  StartWorkout: { fromNotification?: boolean } | undefined;
  StartedWorkoutInterface: { workout_log_id: number };
};

// Constants
const DB_NAME = 'SimpleDB.db';
const DB_FILE_PATH = `${documentDirectory}SQLite/${DB_NAME}`;

// Navigators
const Bottom = createBottomTabNavigator();
const WorkoutStackScreen = createNativeStackNavigator<WorkoutStackParamList>();
const WorkoutLogStackScreen = createNativeStackNavigator<WorkoutLogStackParamList>();
const WeightLogStackScreen = createNativeStackNavigator<WeightLogStackParamList>();

// Database utilities
const resetDatabase = async (): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DB_FILE_PATH);
    if (fileInfo.exists) {
      console.log('Deleting existing database...');
      await FileSystem.deleteAsync(DB_FILE_PATH, { idempotent: true });
      console.log('Database deleted.');
    }

    await FileSystem.makeDirectoryAsync(`${documentDirectory}SQLite`, { intermediates: true });

    const dbAsset = require('./assets/SimpleDB.db');
    const dbUri = Asset.fromModule(dbAsset).uri;
    console.log('Downloading new database...');
    await FileSystem.downloadAsync(dbUri, DB_FILE_PATH);
    console.log('New database downloaded.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
};

const loadDatabase = async (): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DB_FILE_PATH);
    if (!fileInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${documentDirectory}SQLite`, { intermediates: true });
      const dbAsset = require('./assets/SimpleDB.db');
      const dbUri = Asset.fromModule(dbAsset).uri;
      console.log('Downloading database...');
      await FileSystem.downloadAsync(dbUri, DB_FILE_PATH);
    } else {
      console.log('Database already exists.');
    }
  } catch (error) {
    console.error('Error in loadDatabase:', error);
  }
};

// Stack Components
function WorkoutStack() {
  return (
    <SQLiteProvider databaseName={DB_NAME} useSuspense>
      <WorkoutStackScreen.Navigator screenOptions={{ headerShown: false }}>
        <WorkoutStackScreen.Screen name="WorkoutsList" component={Workouts} />
        <WorkoutStackScreen.Screen name="CreateWorkout" component={CreateWorkout} options={{ title: 'Create Workout' }} />
        <WorkoutStackScreen.Screen name="WorkoutDetails" component={WorkoutDetails} options={{ title: 'Workout Details' }} />
        <WorkoutStackScreen.Screen name="EditWorkout" component={EditWorkout} options={{ title: 'Edit Workout' }} />
        <WorkoutStackScreen.Screen name="Difficulty" component={Difficulty} options={{ title: 'Difficulty' }} />
        <WorkoutStackScreen.Screen name="Template" component={Template} options={{ title: 'Template' }} />
        <WorkoutStackScreen.Screen name="TemplateDetails" component={TemplateDetails} options={{ title: 'Template Details' }} />
      </WorkoutStackScreen.Navigator>
    </SQLiteProvider>
  );
}

function WorkoutLogStack() {
  return (
    <WorkoutLogStackScreen.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutLogStackScreen.Screen name="MyCalendar" component={MyCalendar} />
      <WorkoutLogStackScreen.Screen name="LogWorkout" component={LogWorkout} options={{ title: 'Log a Workout' }} />
      <WorkoutLogStackScreen.Screen name="RecurringWorkoutOptions" component={RecurringWorkoutOptions} options={{ title: 'Recurring Workout Options' }} />
      <WorkoutLogStackScreen.Screen name="CreateRecurringWorkout" component={CreateRecurringWorkout} options={{ title: 'Create Recurring Workout' }} />
      <WorkoutLogStackScreen.Screen name="ManageRecurringWorkouts" component={ManageRecurringWorkouts} options={{ title: 'Manage Recurring Workouts' }} />
      <WorkoutLogStackScreen.Screen name="RecurringWorkoutDetails" component={RecurringWorkoutDetails} options={{ title: 'Recurring Workout Details' }} />
      <WorkoutLogStackScreen.Screen name="EditRecurringWorkout" component={EditRecurringWorkout} options={{ title: 'Edit Recurring Workout' }} />
      <WorkoutLogStackScreen.Screen name="StartedWorkoutInterface" component={StartedWorkoutInterface} />
      <WorkoutLogStackScreen.Screen name="LogWeights" component={LogWeights} />
    </WorkoutLogStackScreen.Navigator>
  );
}

function WeightLogStack() {
  return (
    <WeightLogStackScreen.Navigator screenOptions={{ headerShown: false }}>
      <WeightLogStackScreen.Screen name="GraphsWorkoutDetails" component={GraphsWorkoutDetails} />
      <WeightLogStackScreen.Screen name="MyProgress" component={MyProgress} />
      <WeightLogStackScreen.Screen name="LogWeights" component={LogWeights} options={{ title: 'Log Weights' }} />
      <WeightLogStackScreen.Screen name="WeightLogDetail" component={WeightLogDetail} />
      <WeightLogStackScreen.Screen name="AllLogs" component={AllLogs} />
    </WeightLogStackScreen.Navigator>
  );
}

// Recurring Workout Manager Component
function RecurringWorkoutManager() {
  const { checkRecurringWorkouts } = useRecurringWorkouts();
  const initialCheckDone = useRef(false);

  useEffect(() => {
    const checkAndNotify = async () => {
      if (!initialCheckDone.current) {
        await checkRecurringWorkouts();
        console.log('Initial recurring workout check triggered');
        initialCheckDone.current = true;
      }
    };
    checkAndNotify();
  }, [checkRecurringWorkouts]);

  return null;
}

// Main App Content Component
const AppContent = () => {
  const { theme } = useTheme();
  const { notificationPermissionGranted, setNotificationPermissionGranted } = useSettings();

  useEffect(() => {
    if (notificationPermissionGranted) {
      checkAndSyncPermissions(setNotificationPermissionGranted);
    }
  }, [notificationPermissionGranted, setNotificationPermissionGranted]);

  return (
    <>
      <StatusBar barStyle={theme.type === 'light' ? 'dark-content' : 'light-content'} backgroundColor={theme.background} />
      <React.Suspense fallback={<View style={{ flex: 1 }}><ActivityIndicator size="large" /></View>}>
        <SQLiteProvider databaseName={DB_NAME} useSuspense>
          <RecurringWorkoutManager />
          <Bottom.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                backgroundColor: theme.background,
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                height: 60,
                paddingVertical: 10,
              },
            }}
          >
            <Bottom.Screen name="Home" component={Home} options={{ tabBarButton: (props) => <TabButton {...props} iconName="home" /> }} />
            <Bottom.Screen name="My Workouts" component={WorkoutStack} options={{ tabBarButton: (props) => <TabButton {...props} iconName="barbell" /> }} />
            <Bottom.Screen name="My Calendar" component={WorkoutLogStack} options={{ tabBarButton: (props) => <TabButton {...props} iconName="calendar" /> }} />
            <Bottom.Screen name="My Progress" component={WeightLogStack} options={{ tabBarButton: (props) => <TabButton {...props} iconName="trending-up" /> }} />
            <Bottom.Screen name="Settings" component={Settings} options={{ tabBarButton: (props) => <TabButton {...props} iconName="settings-sharp" /> }} />
          </Bottom.Navigator>
        </SQLiteProvider>
      </React.Suspense>
    </>
  );
};

// Main App Component
export default function App() {
  const [dbLoaded, setDbLoaded] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const setupNotifications = async () => {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  };

  useEffect(() => {
    const initializeApp = async () => {
      await setupNotifications();
      await loadDatabase();
      setDbLoaded(true);
    };
    initializeApp();
  }, []);

  if (!dbLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <SettingsProvider>
            <I18nextProvider i18n={i18n}>
              <AppContent />
            </I18nextProvider>
          </SettingsProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

// Custom TabButton Component
const TabButton = (props: any) => {
  const { accessibilityState, onPress } = props;
  const isSelected = accessibilityState?.selected;
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Ionicons name={props.iconName} size={24} color={theme.text} />
      <View
        style={{
          height: 2,
          width: '40%',
          backgroundColor: isSelected ? theme.text : 'transparent',
          marginTop: 5,
          borderRadius: 100,
        }}
      />
    </Pressable>
  );
};

// Styles
const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
});
