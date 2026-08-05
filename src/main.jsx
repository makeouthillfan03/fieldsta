import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

// Cleanup for visitors who loaded this site while vite-plugin-pwa was still
// active (the old "Find a Pro" marketplace manifest -- see git history).
// Removing the plugin from the build stops NEW service workers from being
// generated, but does nothing for one already registered in a returning
// visitor's browser -- that keeps running, keeps serving its stale
// precache, and keeps offering the install prompt until it's explicitly
// unregistered. Safe to delete this block a few weeks after the plugin
// removal shipped, once returning visitors have had a chance to pick it up.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister();
  });
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
}

// AuthProvider (and therefore Firebase) used to wrap every route here
// unconditionally -- meaning it loaded and ran (a live onAuthStateChanged
// listener) for every visitor of the live product, which has nothing to
// do with auth at all. It's now scoped inside App.jsx to just the two
// routes that actually need it (/login, /growth), lazy-loaded there.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
    <Analytics />
  </React.StrictMode>
);
