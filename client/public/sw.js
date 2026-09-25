const CACHE_NAME = "localhire-shell-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "LocalHire",
    message: "You have a new notification.",
    link: "/"
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "LocalHire", {
      body: data.message || "You have a new notification.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { link: data.link || "/" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => "focus" in client);
      if (matchingClient) {
        matchingClient.navigate(link);
        return matchingClient.focus();
      }
      return self.clients.openWindow(link);
    })
  );
});
