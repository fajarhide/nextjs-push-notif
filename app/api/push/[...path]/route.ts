// Konfigurasi dan implementasi API untuk notifikasi push
import webpush from 'web-push';

// Mengatur detail VAPID untuk autentikasi server push
webpush.setVapidDetails(
  'mailto:mail@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY || '',
);

// Menyimpan data langganan dalam memori
let subscription: webpush.PushSubscription;

// Menambah properti url ke tipe Request
interface RequestWithUrl extends Request {
  url: string;
}

// Handler utama untuk request POST
export async function POST(request: RequestWithUrl): Promise<Response> {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case '/api/push/subscription':  // Endpoint untuk menyimpan langganan
      return setSubscription(request);
    case '/api/push/send':         // Endpoint untuk mengirim notifikasi
      return sendPush(request);
    default:
      return notFoundApi();
  }
}

// Tipe data untuk request penyimpanan langganan
interface SetSubscriptionRequestBody {
  subscription: webpush.PushSubscription;
}

// Fungsi untuk menyimpan data langganan
async function setSubscription(request: Request): Promise<Response> {
  const body: SetSubscriptionRequestBody = await request.json();
  subscription = body.subscription;
  return new Response(JSON.stringify({ message: 'Subscription set.' }), {});
}

// Tipe data untuk request pengiriman notifikasi
interface SendPushRequestBody {
  title: string;    // Judul notifikasi
  message: string;  // Isi pesan notifikasi
}

// Fungsi untuk mengirim notifikasi push
async function sendPush(request: Request): Promise<Response> {
  console.log(subscription, 'subs');
  const body: SendPushRequestBody = await request.json();
  const pushPayload = JSON.stringify(body);
  await webpush.sendNotification(subscription, pushPayload);
  return new Response(JSON.stringify({ message: 'Push sent.' }), {});
}

// Fungsi untuk menangani endpoint yang tidak ditemukan
async function notFoundApi() {
  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404,
  });
}