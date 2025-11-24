import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

// Only set notification handler if not running in Expo Go
try {
    if (!isExpoGo) {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
    }
} catch (error) {
    console.debug('Notification handler setup skipped:', error);
}

export async function registerForPushNotificationsAsync() {
    try {
        // Skip if running in Expo Go
        if (isExpoGo) {
            console.log('Running in Expo Go - Push Notifications skipped');
            return null;
        }

        let token;

        if (Platform.OS === 'android') {
            try {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            } catch (error) {
                console.debug('Notification channel setup skipped:', error);
            }
        }

        if (Device.isDevice) {
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    return null;
                }

                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                
                // Extra safety check before calling getExpoPushTokenAsync
                if (!projectId && isExpoGo) {
                    return null;
                }

                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } catch (e) {
                console.debug('Push token error:', e);
                return null;
            }
        } else {
            // alert('Must use physical device for Push Notifications');
        }

        return token;
    } catch (error) {
        console.debug('Notification registration error:', error);
        return null;
    }
}
