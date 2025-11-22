import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Only set notification handler if not running in Expo Go
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

export async function registerForPushNotificationsAsync() {
    // Skip if running in Expo Go (notifications not supported)
    if (Constants.appOwnership === 'expo') {
        console.log('Push notifications not available in Expo Go. Use a development build instead.');
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
            console.error('Error setting notification channel:', error);
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
                console.log('Failed to get push token for push notification!');
                return null;
            }

            // Get the token using the projectId from app.json/eas.json if available
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push Token:', token);
        } catch (e) {
            console.error('Error getting push token:', e);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
