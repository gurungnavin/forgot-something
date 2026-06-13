import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Set the handler for how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Setup Android channel
export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// --- AsyncStorage helpers for per-task notification IDs ---

const getNotifKey = (taskId: string) => `notifids:${taskId}`;

export const saveNotificationIdsForTask = async (taskId: string, ids: string[]): Promise<void> => {
  await AsyncStorage.setItem(getNotifKey(taskId), JSON.stringify(ids));
}

export const getNotificationIdsForTask = async (taskId: string): Promise<string[]> => {
  const s = await AsyncStorage.getItem(getNotifKey(taskId));
  return s ? JSON.parse(s) : [];
}

export const removeNotificationIdsForTask = async (taskId: string): Promise<void> => {
  await AsyncStorage.removeItem(getNotifKey(taskId));
}

// --- Main scheduling/cancel funcs ---

export async function scheduleReminder(
  title: string,
  body: string,
  date: Date,
  taskId: string,
  intervalMinutes: number = 1,
  repeatCount: number = 6
): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < repeatCount; i++) {
    const triggerDate = new Date(date.getTime() + i * intervalMinutes * 60 * 1000);
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
    ids.push(id);
  }
  await saveNotificationIdsForTask(taskId, ids);
  return ids;
}

export const cancelReminder = async (taskId: string): Promise<void> => {
  const ids = await getNotificationIdsForTask(taskId);
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  await removeNotificationIdsForTask(taskId);
}