# Notification System Integration Guide

## Backend Overview

The backend uses **STOMP** (Streaming Text Oriented Messaging Protocol) over **SockJS** for real-time WebSocket communication.

### Backend Architecture

**WebSocket Endpoint:** `/socket`

**STOMP Destinations:**
- **Send to:** `/app/notification` - Request notifications
- **Send to:** `/app/seen` - Mark notifications as seen
- **Subscribe to:** `/topic/notify` - Receive notifications
- **Subscribe to:** `/topic/seen` - Receive seen updates

### Backend Message Formats

#### 1. Request Notifications
**Destination:** `/app/notification`
**Payload:**
```json
{
  "userRole": "claim",
  "userUuid": "user-uuid-123",
  "size": 25,
  "page": 1
}
```

#### 2. Mark as Seen
**Destination:** `/app/seen`
**Payload:**
```json
["notification-uuid-1", "notification-uuid-2"]
```

#### 3. Receive Notifications
**Topic:** `/topic/notify`
**Response:**
```json
[
  {
    "message": "Your claim has been approved",
    "userUuid": "user-uuid-123",
    "isSeen": false,
    "statusUpdateDate": "2025-11-22T10:30:00Z",
    "roleName": "claim",
    "notificationUuid": "notif-uuid-123"
  }
]
```

## Frontend Integration

### 1. Environment Setup

Add to `.env.development`:
```env
VITE_WS_URL=ws://192.168.100.85:8888/socket
```

### 2. Subscribe to Notifications

In your component (e.g., `HomeView.vue` or `App.vue`):

```typescript
<script setup>
import { useNotifications } from '@/composables/useNotifications';
import { useAuthStore } from '@/stores/auth';
import { onMounted, onUnmounted } from 'vue';

const { subscribe, unsubscribe, requestNotifications } = useNotifications();
const authStore = useAuthStore();

onMounted(async () => {
  const userUuid = authStore.auth?.user?.id;
  const userRole = authStore.auth?.user?.roleName || 'claim';
  
  if (userUuid) {
    // Connect to WebSocket
    await subscribe(userUuid, userRole);
    
    // Request initial notifications
    requestNotifications(1, 25);
  }
});

onUnmounted(() => {
  unsubscribe();
});
</script>
```

### 3. Display Notifications

The notification bell is already integrated in `NavBar.vue`. It will:
- Show unread count badge
- Display all notifications in a dropdown panel
- Allow marking as read
- Support clearing notifications

### 4. Handle Notification Actions

When a notification arrives, you can add custom actions:

```typescript
const { success, error } = useNotifications();

// With action
success('Claim Approved', 'Your claim #123 has been approved', {
  label: 'View Claim',
  callback: () => {
    router.push('/claims/123');
  }
});
```

## File Structure

```
src/
├── stores/
│   └── notificationStore.ts          # Pinia store for notifications
├── service/
│   └── NotificationService.ts        # STOMP WebSocket service
├── composables/
│   └── useNotifications.ts           # Easy-to-use composable
├── components/
│   └── notifications/
│       ├── NotificationBell.vue      # Bell icon with badge
│       ├── NotificationPanel.vue     # Dropdown panel
│       ├── NotificationItem.vue      # Individual notification
│       ├── README.md                 # Component documentation
│       └── INTEGRATION_GUIDE.md      # This file
└── main.ts                           # Initialized with NotificationService
```

## API Methods

### useNotifications() Composable

```typescript
const {
  // Notification methods
  success,           // Add success notification
  error,             // Add error notification
  warning,           // Add warning notification
  info,              // Add info notification
  
  // State management
  markAsRead,        // Mark single notification as read
  markAllAsRead,     // Mark all as read
  remove,            // Remove notification
  clearAll,          // Clear all notifications
  clearRead,         // Clear read notifications
  
  // WebSocket methods
  subscribe,         // Connect to WebSocket (userUuid, userRole)
  unsubscribe,       // Disconnect from WebSocket
  requestNotifications, // Request notifications (page, size)
  markAsSeen,        // Mark as seen on backend (uuids[])
  
  // Store access
  store              // Direct access to Pinia store
} = useNotifications();
```

### NotificationService Methods

```typescript
const service = getNotificationService();

// Connection
await service.connect(userUuid, userRole);
service.disconnect();
service.isConnected();

// Communication
service.requestNotifications(page, size);
service.markAsSeen(notificationUuids);
```

## Usage Examples

### Example 1: Basic Setup in App.vue

```vue
<script setup>
import { useNotifications } from '@/composables/useNotifications';
import { useAuthStore } from '@/stores/auth';
import { onMounted, onUnmounted } from 'vue';

const { subscribe, unsubscribe } = useNotifications();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    const user = authStore.auth?.user;
    await subscribe(user.id, user.roleName);
  }
});

onUnmounted(() => {
  unsubscribe();
});
</script>

<template>
  <div>
    <!-- Your app content -->
  </div>
</template>
```

### Example 2: Handle Claim Submission

```typescript
import { useNotifications } from '@/composables/useNotifications';

const { success, error, markAsSeen } = useNotifications();

async function submitClaim(claimData) {
  try {
    const response = await claimApi.submitClaim(claimData);
    
    success(
      'Claim Submitted',
      `Your claim #${response.id} has been submitted successfully`,
      {
        label: 'View Claim',
        callback: () => router.push(`/claims/${response.id}`)
      }
    );
  } catch (err) {
    error('Submission Failed', err.message);
  }
}
```

### Example 3: Request More Notifications

```typescript
const { requestNotifications } = useNotifications();

// Load next page
function loadMoreNotifications() {
  requestNotifications(2, 25);  // Page 2, 25 items per page
}
```

## Notification Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| **success** | Green | ✅ | Operation completed successfully |
| **error** | Red | ❌ | Operation failed |
| **warning** | Yellow | ⚠️ | Warning or attention needed |
| **info** | Blue | ℹ️ | General information |

## Troubleshooting

### Connection Issues

1. **Check WebSocket URL**
   - Verify `VITE_WS_URL` in `.env.development`
   - Should be: `ws://192.168.100.85:8888/socket`

2. **Check Backend CORS**
   - Backend should allow your frontend origin
   - Check `WebSocketConfig.java` allowed origins

3. **Check Browser Console**
   - Look for connection errors
   - Check STOMP library loading

### Notifications Not Appearing

1. **Verify subscription**
   ```typescript
   const service = getNotificationService();
   console.log('Connected:', service.isConnected());
   ```

2. **Check user credentials**
   - Ensure `userUuid` and `userRole` are correct

3. **Check backend logs**
   - Verify notifications are being sent

### Libraries Not Loading

If SockJS or STOMP libraries fail to load:

1. Check CDN availability
2. Add to `index.html` as fallback:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>
   ```

## Performance Considerations

- **Message Queue:** Automatically queues messages when disconnected
- **Auto-Reconnect:** Retries up to 5 times with 3-second delays
- **Lazy Loading:** STOMP libraries loaded on demand
- **Pagination:** Request only needed notifications per page

## Security

- Uses STOMP protocol for secure messaging
- Supports JWT authentication via headers
- Messages are validated on backend
- User-specific notification filtering

## Future Enhancements

- [ ] Desktop notifications (Notification API)
- [ ] Sound notifications
- [ ] Notification persistence
- [ ] Notification categories/filtering
- [ ] Notification preferences
- [ ] Batch operations

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check network tab for WebSocket connection
4. Review backend logs for message processing
