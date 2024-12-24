// Menangani instalasi service worker
self.addEventListener('install', () => {
  console.info('service worker installed.');
});

// Fungsi untuk mencatat pengiriman notifikasi
const sendDeliveryReportAction = () => {
  console.log('Web push delivered.');
};

// Menangani event push yang diterima
self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  // Mengambil data dari payload push
  const payload = event.data.json();
  const { body, icon, image, badge, url, title } = payload;

  // Menyiapkan detail notifikasi
  const notificationTitle = title ?? 'Bijak Uangmu';
  const notificationOptions = {
    body, // Isi pesan
    icon: '/icon-192x192.webp', // Ikon notifikasi
    data: {
      url: window.location.origin, // URL yang akan dibuka saat diklik
    },
    tag: 'bijak-uangmu', // Tag untuk grup notifikasi
    requireInteraction: false, // Notifikasi bisa hilang otomatis
    silent: false, // Notifikasi dengan suara
  };

  // Menampilkan notifikasi
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions).then(() => {
      sendDeliveryReportAction();
    }),
  );
});

// Menangani klik pada notifikasi
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Tutup notifikasi
  // Buka URL jika ada
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
