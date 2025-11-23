import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Only set notification handler if not running in Expo Go
try {
    if (!Constants.appOwnership || Constants.appOwnership !== 'expo') {
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
    // Silently ignore notification setup errors
    console.debug('Notification handler setup skipped:', error);
}

export async function registerForPushNotificationsAsync() {
    try {
        // Skip if running in Expo Go (notifications not supported)
        if (Constants.appOwnership === 'expo') {
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
                // Silently handle channel setup errors
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

                // Get the token using the projectId from app.json/eas.json if available
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            } catch (e) {
                // Silently handle token errors
                console.debug('Push token error:', e);
                return null;
            }
        }

        return token;
    } catch (error) {
        // Silently handle all notification errors
        console.debug('Notification registration error:', error);
        return null;
    }
}
