import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { LockProvider } from "./context/LockContext.jsx";
import { setLanguage } from "./i18n";
import "./index.css";

// Load the saved language BEFORE first render so the app boots in the right locale
const savedLang = localStorage.getItem("appLanguage") || "en";
setLanguage(savedLang);

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LockProvider>
            <App />
          </LockProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}