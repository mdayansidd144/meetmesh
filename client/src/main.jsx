import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LockProvider } from "./context/LockContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <AuthProvider>
        <LockProvider>
          <App />
        </LockProvider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);