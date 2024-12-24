const SERVICE_WORKER_FILE_PATH = '/sw.js';

// API Routes
const API_ROUTES = {
  subscription: '/api/push/subscription',
  send: '/api/push/send'
} as const;

interface PushNotificationOptions {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('showNotification' in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): void {
  if (notificationUnsupported()) {
    console.error('Push notifications are not supported');
    return;
  }

  const state: NotificationPermission = Notification.permission;
  switch (state) {
    case 'denied':
      console.info('Notification permission denied');
      onSubscribe(null);
      break;
    case 'granted':
      registerAndSubscribe(onSubscribe);
      break;
    case 'default':
      requestNotificationPermission(onSubscribe);
      break;
  }
}

async function requestNotificationPermission(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerAndSubscribe(onSubscribe);
    } else {
      console.info('Notification permission was not granted');
      onSubscribe(null);
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    onSubscribe(null);
  }
}

async function subscribe(onSubscribe: (subs: PushSubscription | null) => void): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key is not set');
      }

      // Convert VAPID key
      const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      console.info('Created new subscription');
    } else {
      console.info('Using existing subscription');
    }

    await submitSubscription(subscription);
    onSubscribe(subscription);
  } catch (error) {
    console.error('Failed to subscribe:', error);
    onSubscribe(null);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function submitSubscription(subscription: PushSubscription): Promise<void> {
  try {
    if (!subscription || !subscription.endpoint) {
      throw new Error('Invalid subscription object');
    }

    const subscriptionJSON = subscription.toJSON();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscription: subscriptionJSON })
    };

    const response = await fetch(API_ROUTES.subscription, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server responded with ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('Subscription submitted successfully:', result);
  } catch (error) {
    console.error('Detailed subscription error:', error);
    throw error;
  }
}

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    console.log('Service Worker registered with scope:', registration.scope);
    await subscribe(onSubscribe);
  } catch (error) {
    console.error('Failed to register service-worker:', error);
    onSubscribe(null);
  }
}

export async function sendWebPush(
  title: string,
  message: string,
  options: Partial<Omit<PushNotificationOptions, 'title' | 'message'>> = {}
): Promise<void> {
  try {
    const defaultOptions = {
      icon: '/icon-192x192.webp',         // Custom app icon instead of Chrome icon
      badge: '/icon-96x96.webp',  // Badge icon
      tag: 'bijak-uangmu',           // Unique tag for notification
      requireInteraction: false,      // Auto close notification
      image: '/bijakuangmu.png', // Image to show in notification
      data: {
        url: window.location.origin,
      }
    };

    const pushBody = {
      title,
      body: message,
      ...defaultOptions,
      ...options,
      renotify: true,
      silent: false,
      actions: []
    };

    const response = await fetch(API_ROUTES.send, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushBody)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server responded with ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('Push notification sent successfully:', result);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}