import { useNotificationStore } from '@/stores/notificationStore';

interface MessagePayload {
  userRole: string;
  userUuid: string;
  size: number;
  page: number;
}

interface NotificationResponse {
  message: string;
  userUuid: string;
  isSeen: boolean;
  statusUpdateDate: Date;
  roleName: string;
  notificationUuid: string;
}

export class NotificationService {
  private stompClient: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;
  private userUuid: string = '';
  private userRole: string = '';

  constructor(private url: string) {}

  /**
   * Connect to WebSocket server using STOMP
   */
  public connect(userUuid: string, userRole: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient && this.stompClient.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.userUuid = userUuid;
      this.userRole = userRole;

      try {
        console.log('🔌 Attempting to connect to WebSocket...');
        console.log('URL:', this.url);
        
        // Dynamic import of SockJS and STOMP
        this.loadStompLibraries().then(() => {
          console.log('📚 STOMP libraries loaded successfully');
          const SockJS = (window as any).SockJS;
          const Stomp = (window as any).Stomp;

          console.log('🔗 Creating SockJS connection...');
          const socket = new SockJS(this.url);
          this.stompClient = Stomp.over(socket);
          console.log('✅ STOMP client created');

          this.stompClient.connect(
            {},
            (frame: any) => {
              console.log('✅ STOMP Connected successfully!');
              console.log('Connection frame:', frame);
              console.log('User UUID:', this.userUuid);
              console.log('User Role:', this.userRole);
              console.log('WebSocket URL:', this.url);
              this.isConnecting = false;
              this.reconnectAttempts = 0;

              // Subscribe to notification topic
              this.subscribeToNotifications();
              resolve();
            },
            (error: any) => {
              console.error('❌ STOMP Connection Error:', error);
              console.error('Error details:', {
                message: error.message,
                headers: error.headers,
              });
              this.isConnecting = false;
              this.attemptReconnect();
              reject(error);
            }
          );
        }).catch(reject);
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Load STOMP libraries dynamically
   */
  private loadStompLibraries(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).SockJS && (window as any).Stomp) {
        resolve();
        return;
      }

      // Load SockJS
      const sockJsScript = document.createElement('script');
      sockJsScript.src = 'https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js';
      sockJsScript.onload = () => {
        // Load STOMP
        const stompScript = document.createElement('script');
        stompScript.src = 'https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js';
        stompScript.onload = () => resolve();
        stompScript.onerror = () => reject(new Error('Failed to load STOMP library'));
        document.head.appendChild(stompScript);
      };
      sockJsScript.onerror = () => reject(new Error('Failed to load SockJS library'));
      document.head.appendChild(sockJsScript);
    });
  }

  /**
   * Subscribe to notification topics
   */
  private subscribeToNotifications(): void {
    if (!this.stompClient) {
      console.error('❌ STOMP client not available for subscription');
      return;
    }

    console.log('📡 Subscribing to notification topics...');

    // Subscribe to general notifications
    const notifySubscription = this.stompClient.subscribe('/topic/notify', (message: any) => {
      console.log('📬 Received notification from /topic/notify');
      this.handleNotificationMessage(message);
    });
    console.log('✅ Subscribed to /topic/notify');

    // Subscribe to seen notifications
    const seenSubscription = this.stompClient.subscribe('/topic/seen', (message: any) => {
      console.log('✅ Received seen update from /topic/seen');
      console.log('Seen message:', message.body);
    });
    console.log('✅ Subscribed to /topic/seen');

    // Send initial notification request
    console.log('📤 Sending initial notification request...');
    this.requestNotifications();
  }

  /**
   * Request notifications from server
   */
  public requestNotifications(page: number = 1, size: number = 25): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('⚠️ STOMP client not connected');
      console.log('Connection status:', {
        stompClient: !!this.stompClient,
        connected: this.stompClient?.connected || false,
      });
      return;
    }

    const payload: MessagePayload = {
      userRole: this.userRole,
      userUuid: this.userUuid,
      size,
      page,
    };

    console.log('📤 Sending notification request to /app/notification');
    console.log('Payload:', payload);
    this.stompClient.send('/app/notification', {}, JSON.stringify(payload));
    console.log('✅ Notification request sent successfully');
  }

  /**
   * Mark notifications as seen
   */
  public markAsSeen(notificationUuids: string[]): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('⚠️ STOMP client not connected - Cannot mark as seen');
      return;
    }

    console.log('📤 Sending mark as seen request to /app/seen');
    console.log('Notification UUIDs:', notificationUuids);
    this.stompClient.send('/app/seen', {}, JSON.stringify(notificationUuids));
    console.log('✅ Mark as seen sent successfully');
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('⚠️ STOMP Disconnected');
      });
    }
  }

  /**
   * Handle incoming notification message
   */
  private handleNotificationMessage(message: any): void {
    try {
      const notifications: NotificationResponse[] = JSON.parse(message.body);
      const notificationStore = useNotificationStore();

      notifications.forEach((notif) => {
        notificationStore.addNotification({
          title: 'New Notification',
          message: notif.message,
          type: 'info',
          icon: 'ℹ️',
          action: {
            label: 'Mark as Read',
            callback: () => {
              this.markAsSeen([notif.notificationUuid]);
              notificationStore.markAsRead(notif.notificationUuid);
            },
          },
        });
      });

      console.log('📬 Notifications received:', notifications);
    } catch (error) {
      console.error('Error handling notification message:', error);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect(this.userUuid, this.userRole).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  /**
   * Check connection status
   */
  public isConnected(): boolean {
    return this.stompClient !== null && this.stompClient.connected;
  }
}

// Create singleton instance
let notificationService: NotificationService | null = null;

export function initNotificationService(wsUrl: string): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService(wsUrl);
  }
  return notificationService;
}

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    throw new Error('NotificationService not initialized. Call initNotificationService first.');
  }
  return notificationService;
}
