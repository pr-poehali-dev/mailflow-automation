import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// Отдельный вход в кабинет администратора (ЦУП).
// Активируется по пути /admin или ?admin=1
const path = window.location.pathname.toLowerCase();
const isAdmin =
  path === "/admin" ||
  path === "/admin/" ||
  path.startsWith("/admin/") ||
  new URLSearchParams(window.location.search).get("admin") === "1";

createRoot(document.getElementById("root")!).render(
  isAdmin ? (
    <AdminApp />
  ) : (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  )
);
