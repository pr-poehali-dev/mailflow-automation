import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import AdminApp from './admin/AdminApp'
import LegalPage from './legal/LegalPage'
import UnsubscribePage from './legal/UnsubscribePage'
import CookieBanner from './components/CookieBanner'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// Роутинг по пути / query.
const path = window.location.pathname.toLowerCase();
const search = new URLSearchParams(window.location.search);

const isAdmin =
  path === "/admin" ||
  path === "/admin/" ||
  path.startsWith("/admin/") ||
  search.get("admin") === "1";

const isLegal = path.startsWith("/legal/") || path === "/legal";
const isUnsubscribe = path.startsWith("/unsubscribe");

const root = createRoot(document.getElementById("root")!);

if (isAdmin) {
  root.render(<AdminApp />);
} else if (isLegal) {
  root.render(
    <ThemeProvider>
      <LegalPage />
    </ThemeProvider>
  );
} else if (isUnsubscribe) {
  root.render(
    <ThemeProvider>
      <UnsubscribePage />
    </ThemeProvider>
  );
} else {
  root.render(
    <ThemeProvider>
      <AuthProvider>
        <App />
        <CookieBanner />
      </AuthProvider>
    </ThemeProvider>
  );
}
