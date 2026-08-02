import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

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
