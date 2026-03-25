// حيّ — Service Worker
// نسخة الكاش تُحدَّث عند كل تعديل في الملف

const CACHE = 'hayy-v2';
const OFFLINE_URL = '/offline.html';

// الأصول الأساسية للـ App Shell
const SHELL = [
  '/',
  '/index.html',
  '/admin.html',
  '/offline.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap',
];

// ══ التثبيت: كاش الـ Shell ══
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// ══ التفعيل: حذف الكاشات القديمة ══
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ══ الـ Fetch: استراتيجيات مختلفة حسب نوع الطلب ══
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase و API calls → Network Only (لا كاش)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis.com/identitytoolkit') ||
    url.hostname.includes('securetoken')
  ) {
    return;
  }

  // صور Cloudinary → Cache First (مع Fallback للشبكة)
  if (url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // الخطوط من Google → Cache First
  if (url.hostname.includes('fonts.g')) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // طلبات POST → Network Only
  if (request.method !== 'GET') return;

  // باقي الأصول (HTML, JS) → Network First مع Fallback للكاش
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});

// ══ Push Notifications ══
self.addEventListener('push', event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'حيّ', body: event.data.text() }; }

  const title = data.notification?.title || data.title || 'حيّ';
  const options = {
    body: data.notification?.body || data.body || '',
    icon: 'https://res.cloudinary.com/dtwgl17iy/image/upload/w_192,h_192,c_fill,f_png/v1774160618/%D8%AD%D9%8E%D9%8A%D9%91_otbkdk.png',
    badge: 'https://res.cloudinary.com/dtwgl17iy/image/upload/w_72,h_72,c_fill,f_png/v1774160618/%D8%AD%D9%8E%D9%8A%D9%91_otbkdk.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'hayy-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ══ Notification Click ══
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
