self.addEventListener('install', () => {
  console.info('service worker installed.');
});

const sendDeliveryReportAction = () => {
  console.log('Web push delivered.');
};

self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();
  const { body, icon, image, badge, url, title } = payload;
  const notificationTitle = title ?? 'Bijak Uangmu';
  const notificationOptions = {
    body,
    icon: '/icon-192x192.webp', // Custom app icon Anda
    data: {
      url: window.location.origin,
    },
    tag: 'bijak-uangmu',
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions).then(() => {
      sendDeliveryReportAction();
    }),
  );
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
