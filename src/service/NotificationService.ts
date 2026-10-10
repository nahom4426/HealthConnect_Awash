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
        
        // Dynamic import of SockJS and STOMP
        this.loadStompLibraries().then(() => {
          const SockJS = (window as any).SockJS;
          const Stomp = (window as any).Stomp;

          const socket = new SockJS(this.url);
          this.stompClient = Stomp.over(socket);

          this.stompClient.connect(
            {},
            (frame: any) => {
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


    // Subscribe to general notifications
    const notifySubscription = this.stompClient.subscribe('/topic/notify', (message: any) => {
      this.handleNotificationMessage(message);
    });

    // Subscribe to seen notifications
    const seenSubscription = this.stompClient.subscribe('/topic/seen', (message: any) => {
    });

    // Send initial notification request
    this.requestNotifications();
  }

  /**
   * Request notifications from server
   */
  public requestNotifications(page: number = 1, size: number = 25): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('⚠️ STOMP client not connected');
      return;
    }

    const payload: MessagePayload = {
      userRole: this.userRole,
      userUuid: this.userUuid,
      size,
      page,
    };

    this.stompClient.send('/app/notification', {}, JSON.stringify(payload));
  }

  /**
   * Mark notifications as seen
   */
  public markAsSeen(notificationUuids: string[]): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('⚠️ STOMP client not connected - Cannot mark as seen');
      return;
    }

    this.stompClient.send('/app/seen', {}, JSON.stringify(notificationUuids));
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
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
