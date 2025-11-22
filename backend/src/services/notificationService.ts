import { Expo } from 'expo-server-sdk';
import pool from '../config/database';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export const sendPushNotification = async (userIds: number[], title: string, body: string, data: any = {}) => {
    try {
        // 1. Get tokens for these users
        if (userIds.length === 0) return;

        const query = `
      SELECT token FROM user_push_tokens 
      WHERE user_id = ANY($1)
    `;

        const result = await pool.query(query, [userIds]);
        const tokens = result.rows.map(row => row.token);

        if (tokens.length === 0) {
            console.log('No tokens found for users:', userIds);
            return;
        }

        // 2. Create the messages that you want to send to clients
        let messages = [];
        for (let pushToken of tokens) {
            // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }

            // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
            messages.push({
                to: pushToken,
                sound: 'default',
                title: title,
                body: body,
                data: data,
            });
        }

        // 3. Send the chunks to the Expo push notification service
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('Notification tickets:', ticketChunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending notification chunk:', error);
            }
        }
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
};
