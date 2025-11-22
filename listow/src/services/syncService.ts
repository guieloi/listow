import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = 'offline_action_queue';

interface OfflineAction {
    id: string;
    type: 'CREATE_LIST' | 'CREATE_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM' | 'TOGGLE_ITEM';
    payload: any;
    timestamp: number;
}

class SyncService {
    private isSyncing = false;
    private api: any = null;

    constructor() {
        // Listen for connection changes
        NetInfo.addEventListener(state => {
            if (state.isConnected && !this.isSyncing && this.api) {
                this.sync();
            }
        });
    }

    setApi(api: any) {
        this.api = api;
    }

    async saveAction(type: OfflineAction['type'], payload: any) {
        try {
            const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
            const queue: OfflineAction[] = queueJson ? JSON.parse(queueJson) : [];

            const action: OfflineAction = {
                id: Date.now().toString(),
                type,
                payload,
                timestamp: Date.now(),
            };

            queue.push(action);
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            console.log('Action queued for sync:', action);
        } catch (error) {
            console.error('Error queuing action:', error);
        }
    }

    async sync() {
        if (this.isSyncing || !this.api) return;
        this.isSyncing = true;

        try {
            const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
            if (!queueJson) {
                this.isSyncing = false;
                return;
            }

            let queue: OfflineAction[] = JSON.parse(queueJson);
            if (queue.length === 0) {
                this.isSyncing = false;
                return;
            }

            console.log(`Syncing ${queue.length} actions...`);

            const remainingQueue: OfflineAction[] = [];

            for (const action of queue) {
                try {
                    await this.processAction(action);
                } catch (error) {
                    console.error(`Failed to process action ${action.id}:`, error);
                    // Keep in queue if it's a network error
                    remainingQueue.push(action);
                }
            }

            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));

            if (remainingQueue.length === 0) {
                console.log('Sync complete!');
            } else {
                console.log(`Sync partial. ${remainingQueue.length} actions remaining.`);
            }

        } catch (error) {
            console.error('Error during sync:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    private async processAction(action: OfflineAction) {
        switch (action.type) {
            case 'CREATE_LIST':
                await this.api.createList(action.payload);
                break;
            case 'CREATE_ITEM':
                await this.api.createItem(action.payload.listId, action.payload.data);
                break;
            case 'UPDATE_ITEM':
                await this.api.updateItem(action.payload.id, action.payload.data);
                break;
            case 'DELETE_ITEM':
                await this.api.deleteItem(action.payload.id);
                break;
            case 'TOGGLE_ITEM':
                await this.api.toggleItem(action.payload.id);
                break;
        }
    }
}

export default new SyncService();
