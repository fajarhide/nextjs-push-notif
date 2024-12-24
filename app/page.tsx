// Halaman utama yang menangani tampilan dan interaksi notifikasi push
'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import {
  checkPermissionStateAndAct,
  notificationUnsupported,
  registerAndSubscribe,
  sendWebPush,
} from './Push';

export default function Home() {
  // Mengelola state untuk fitur notifikasi
  const [unsupported, setUnsupported] = useState<boolean>(false); // Mengecek apakah browser mendukung notifikasi
  const [subscription, setSubscription] = useState<PushSubscription | null>(null); // Menyimpan data langganan notifikasi
  const [message, setMessage] = useState<string | null>(null); // Menyimpan pesan yang akan dikirim

  // Mengecek dukungan browser dan izin saat komponen dimuat
  useEffect(() => {
    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) return;

    checkPermissionStateAndAct(setSubscription);
  }, []);

  return (
    <main>
      <div className={styles.center}>
        {/* Tombol untuk meminta izin notifikasi */}
        <button
          disabled={unsupported}
          onClick={() => registerAndSubscribe(setSubscription)}
          className={subscription ? styles.activeButton : ''}>
          {unsupported
            ? 'Notifikasi Tidak Didukung'
            : subscription
              ? 'Notifikasi Diizinkan'
              : 'Izinkan Notifikasi'}
        </button>

        {/* Input pesan dan tombol kirim */}
        {subscription ? (
          <>
            <input
              placeholder={'Ketik pesan notifikasi...'}
              style={{ marginTop: '5rem' }}
              value={message ?? ''}
              onChange={e => setMessage(e.target.value)}
            />
            <button onClick={() => sendWebPush('Bijak Uangmu', message ?? '')}>
              Kirim Notifikasi
            </button>
          </>
        ) : null}

        {/* Menampilkan detail langganan */}
        <div className={styles.subscriptionLabel}>
          <span>Detail Langganan Notifikasi:</span>
        </div>
        <code className={styles.codeBox}>
          {subscription
            ? JSON.stringify(subscription?.toJSON(), undefined, 2)
            : 'Belum ada langganan'}
        </code>
      </div>
    </main>
  );
}
