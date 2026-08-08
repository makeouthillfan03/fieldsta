// Kill switch for the PWA service worker removed from this site (see
// CLAUDE.md's "PWA — deliberately removed" section). A visitor who
// registered the OLD service worker before that removal keeps it running
// indefinitely: browsers periodically re-fetch /sw.js in the background to
// check for updates, and before this file existed, that request fell
// through the SPA catch-all rewrite and got served index.html instead of
// valid JS -- a failed update check, which browsers respond to by just
// keeping the old worker running as-is, forever. Deploying an actual,
// valid /sw.js is the only way to reach those already-affected visitors:
// the browser fetches THIS file on its next background check, installs it
// (because its content differs from whatever's cached), and this is what
// runs once it does -- unregister immediately and wipe every cache this
// origin's service worker ever wrote, so the next load is a real network
// fetch instead of whatever got frozen into the old precache.
//
// Safe to leave in place indefinitely: a browser with no service worker at
// all (the normal case going forward) never requests this file to begin
// with, since nothing on the page registers it anymore.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
