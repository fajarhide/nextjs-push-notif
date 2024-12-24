// Script untuk menghasilkan kunci VAPID
const webPush = require('web-push');
const fs = require('fs');

// Menghasilkan pasangan kunci publik dan privat
const vapidKeys = webPush.generateVAPIDKeys();

// Menyiapkan data untuk file .env.local
const envData = `
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
NEXT_PUBLIC_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

// Menyimpan kunci ke file .env.local
fs.writeFileSync('.env.local', envData, { flag: 'w' });
console.log('#### VAPID keys generated and saved to .env file ### \n');
