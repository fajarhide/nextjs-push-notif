// Implementasi fungsi-fungsi notifikasi push
const SERVICE_WORKER_FILE_PATH = '/sw.js';

// Endpoint API untuk operasi notifikasi push
const API_ROUTES = {
  subscription: '/api/push/subscription', // Endpoint untuk menyimpan langganan
  send: '/api/push/send' // Endpoint untuk mengirim notifikasi
} as const;

// Tipe data untuk konfigurasi notifikasi push
interface PushNotificationOptions {
  title: string;      // Judul notifikasi
  message: string;    // Isi pesan notifikasi
  icon?: string;      // Ikon notifikasi
  badge?: string;     // Badge untuk notifikasi
  image?: string;     // Gambar dalam notifikasi
  url?: string;       // URL yang dibuka saat notifikasi diklik
  actions?: NotificationAction[]; // Tombol aksi dalam notifikasi
  data?: Record<string, any>;    // Data tambahan
  tag?: string;                  // Tag unik notifikasi
  requireInteraction?: boolean;  // Apakah butuh interaksi user
}

interface NotificationAction {
  action: string;  // Identifikasi aksi
  title: string;   // Teks tombol aksi
  icon?: string;   // Ikon tombol aksi
}

// Mengecek apakah browser mendukung notifikasi push
export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !('serviceWorker' in navigator) ||      // Cek dukungan Service Worker
    !('PushManager' in window) ||           // Cek dukungan Push Manager
    !('showNotification' in ServiceWorkerRegistration.prototype) // Cek kemampuan menampilkan notifikasi
  ) {
    unsupported = true;
  }
  return unsupported;
}

// Menangani status izin dan melakukan tindakan yang sesuai
export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): void {
  if (notificationUnsupported()) {
    console.error('Notifikasi push tidak didukung');
    return;
  }

  // Cek status izin saat ini
  const state: NotificationPermission = Notification.permission;
  switch (state) {
    case 'denied':      // Izin ditolak
      console.info('Izin notifikasi ditolak');
      onSubscribe(null);
      break;
    case 'granted':     // Izin diberikan
      registerAndSubscribe(onSubscribe);
      break;
    case 'default':     // Belum ada keputusan
      requestNotificationPermission(onSubscribe);
      break;
  }
}

// Meminta izin notifikasi dari pengguna
async function requestNotificationPermission(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerAndSubscribe(onSubscribe);
    } else {
      console.info('Izin notifikasi tidak diberikan');
      onSubscribe(null);
    }
  } catch (error) {
    console.error('Error saat meminta izin notifikasi:', error);
    onSubscribe(null);
  }
}

// Membuat atau mengambil langganan push
async function subscribe(onSubscribe: (subs: PushSubscription | null) => void): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Cek ketersediaan VAPID key
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error('VAPID public key belum diatur');
      }

      // Konversi VAPID key ke format yang sesuai
      const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

      // Buat langganan baru dengan VAPID key
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    await submitSubscription(subscription);
    onSubscribe(subscription);
  } catch (error) {
    console.error('Gagal membuat langganan:', error);
    onSubscribe(null);
  }
}

// Mengubah VAPID key dari base64 ke Uint8Array
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

// Mengirim detail langganan ke backend
async function submitSubscription(subscription: PushSubscription): Promise<void> {
  try {
    if (!subscription || !subscription.endpoint) {
      throw new Error('Data langganan tidak valid');
    }

    const subscriptionJSON = subscription.toJSON();
    const response = await fetch(API_ROUTES.subscription, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscriptionJSON })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server merespons dengan ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('Langganan berhasil dikirim:', result);
  } catch (error) {
    console.error('Error detail saat mengirim langganan:', error);
    throw error;
  }
}

// Mendaftarkan service worker dan membuat langganan
export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    console.log('Service Worker terdaftar dengan scope:', registration.scope);
    await subscribe(onSubscribe);
  } catch (error) {
    console.error('Gagal mendaftarkan service-worker:', error);
    onSubscribe(null);
  }
}

// Mengirim notifikasi push
export async function sendWebPush(
  title: string,
  message: string,
  options: Partial<Omit<PushNotificationOptions, 'title' | 'message'>> = {}
): Promise<void> {
  try {
    // Pengaturan default notifikasi
    const defaultOptions = {
      icon: '/icon-192x192.webp',        // Ikon aplikasi
      badge: '/icon-96x96.webp',         // Badge notifikasi
      tag: 'bijak-uangmu',               // Tag unik
      requireInteraction: false,          // Otomatis tutup
      image: '/bijakuangmu.png',         // Gambar notifikasi
      data: {
        url: window.location.origin,      // URL yang dibuka saat diklik
      }
    };

    // Gabungkan pengaturan default dengan kustom
    const pushBody = {
      title,
      body: message,
      ...defaultOptions,
      ...options,
      renotify: true,    // Selalu tampilkan notifikasi baru
      silent: false,      // Dengan suara
      actions: []         // Tanpa tombol aksi tambahan
    };

    const response = await fetch(API_ROUTES.send, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushBody)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server merespons dengan ${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('Notifikasi push berhasil dikirim:', result);
  } catch (error) {
    console.error('Gagal mengirim notifikasi push:', error);
    throw error;
  }
}