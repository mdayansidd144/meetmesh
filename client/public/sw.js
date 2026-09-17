self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "MeetMesh", body: event.data.text() };
  }
  const title = data.title || "MeetMesh";
  const options = {
    body: data.body || "",
    icon: data.icon || "/favicon.svg",
    badge: data.icon || "/favicon.svg",
    tag: data.tag || "meetmesh",
    data: data.data || {},
    vibrate: [120, 60, 120],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            return;
          }
        }
        return self.clients.openWindow(url);
      })
  );
});