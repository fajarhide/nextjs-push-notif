# Push Notification Next.js

Implementasi push notification pada aplikasi Next.js menggunakan web-push.

## Demo

![Demo Push Notification](https://raw.githubusercontent.com/yourusername/push-notification-nextjs/main/demo/preview.gif)

| Meminta Izin | Notifikasi Diterima |
|--------------|---------------------|
| ![Request Permission](https://raw.githubusercontent.com/yourusername/push-notification-nextjs/main/demo/request.png) | ![Notification Received](https://raw.githubusercontent.com/yourusername/push-notification-nextjs/main/demo/notification.png) |

## Cara Memulai

Jalankan server development:

```bash
npm run dev
```

Dengan menjalankan perintah ini:
- Script `generateVapidKeys.js` akan dijalankan otomatis
- Kunci VAPID akan dibuat dan disimpan ke file `.env.local`

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.

## Catatan Penting

Jika menggunakan Browser Brave, Anda perlu mengaktifkan push messaging di pengaturan. 
Untuk detail lebih lanjut, silakan lihat [postingan Stack Overflow ini](https://stackoverflow.com/a/69624651/11703800).