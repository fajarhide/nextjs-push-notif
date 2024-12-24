<h1 align="center">Push Notification Next.js</h1>

Implementasi push notification pada aplikasi Next.js menggunakan [web-push](https://github.com/web-push-libs/web-push) dan [VAPID](https://github.com/web-push-libs/vapid).

## Demo

| Notif Diterima Lock Screen | Notif Diterima Open Message |
|--------------|---------------------|
| ![Demo1](https://raw.githubusercontent.com/fajarhide/nextjs-push-notif/refs/heads/main/demo/demo1.webp) | ![Demo2](https://raw.githubusercontent.com/fajarhide/nextjs-push-notif/refs/heads/main/demo/demo2.webp) |

## Cara Memulai

Jalankan server development:

```bash
npm run dev
```

Dengan menjalankan perintah ini:
- Script `generateVapidKeys.js` akan dijalankan otomatis
- Kunci VAPID akan dibuat dan disimpan ke file `.env.local`

Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat hasilnya.
