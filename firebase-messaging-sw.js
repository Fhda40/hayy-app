// حيّ — Firebase Messaging Service Worker
// يجب أن يكون في جذر الموقع لاستقبال الإشعارات في الخلفية

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAPkinYnCQr8dJPxuYLRFI5ZrC56hR-reg',
  authDomain: 'fbrg87.firebaseapp.com',
  projectId: 'fbrg87',
  storageBucket: 'fbrg87.firebasestorage.app',
  messagingSenderId: '811335912659',
  appId: '1:811335912659:web:a923cc11d16315dfd4d826',
});

const messaging = firebase.messaging();

// إشعارات الخلفية (التطبيق مغلق أو في الخلفية)
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  const notifTitle = title || 'حيّ 🏡';
  const notifOptions = {
    body: body || '',
    icon: icon || 'https://res.cloudinary.com/dtwgl17iy/image/upload/w_192,h_192,c_fill,f_png/v1774160618/%D8%AD%D9%8E%D9%8A%D9%91_otbkdk.png',
    badge: 'https://res.cloudinary.com/dtwgl17iy/image/upload/w_72,h_72,c_fill,f_png/v1774160618/%D8%AD%D9%8E%D9%8A%D9%91_otbkdk.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    tag: data.tag || 'hayy-notif',
    renotify: true,
    data,
  };

  // أنواع الإشعارات
  if (data.type === 'new_offer') {
    notifOptions.actions = [
      { action: 'view', title: 'عرض الخصم' },
      { action: 'dismiss', title: 'تجاهل' },
    ];
  } else if (data.type === 'coupon_used') {
    notifOptions.actions = [
      { action: 'stats', title: 'الإحصائيات' },
    ];
  }

  return self.registration.showNotification(notifTitle, notifOptions);
});

// معالجة الضغط على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};

  let targetUrl = '/';
  if (event.action === 'view' || data.type === 'new_offer') targetUrl = '/?screen=stores';
  if (event.action === 'stats' || data.type === 'coupon_used') targetUrl = '/merchant.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.postMessage({ type: 'notification_click', data });
        return;
      }
      return clients.openWindow(targetUrl);
    })
  );
});
