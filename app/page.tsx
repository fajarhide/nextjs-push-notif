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
  const [unsupported, setUnsupported] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    const isUnsupported = notificationUnsupported();
    setUnsupported(isUnsupported);
    if (isUnsupported) {
      return;
    }
    checkPermissionStateAndAct(setSubscription);
  }, []);

  return (
    <main>
      <div className={styles.center}>
        <button
          disabled={unsupported}
          onClick={() => registerAndSubscribe(setSubscription)}
          className={subscription ? styles.activeButton : ''}>
          {unsupported
            ? 'Notification Unsupported'
            : subscription
              ? 'Notification allowed'
              : 'Allow notification'}
        </button>
        {subscription ? (
          <>
            <input
              placeholder={'Typing push message ...'}
              style={{ marginTop: '5rem' }}
              value={message ?? ''}
              onChange={e => setMessage(e.target.value)}
            />
            <button onClick={() => sendWebPush('Bijak Uangmu', message ?? '')}>Test Push</button>
          </>
        ) : null}
        <div className={styles.subscriptionLabel}>
          <span>Push subscription integration:</span>
        </div>
        <code className={styles.codeBox}>
          {subscription
            ? JSON.stringify(subscription?.toJSON(), undefined, 2)
            : 'There is no subscription'}
        </code>
      </div>
    </main>
  );
}
