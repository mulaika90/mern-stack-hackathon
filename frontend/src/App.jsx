import { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen.jsx";
import ClinicShell from "./components/ClinicShell.jsx";
import { api } from "./lib/api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("serein-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    try {
      localStorage.setItem("serein-theme", nextTheme);
    } catch {
      // Theme still changes for this session if storage is unavailable.
    }
  }

  useEffect(() => {
    api("/api/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <main className="app-loading">
        <span className="loading-mark">+</span>
        <span>Preparing your care space...</span>
      </main>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} theme={theme} onThemeChange={changeTheme} />;
  }

  return (
    <ClinicShell
      user={user}
      onUserUpdate={setUser}
      theme={theme}
      onThemeChange={changeTheme}
      onSignOut={async () => {
        await api("/api/auth/logout", { method: "POST" });
        setUser(null);
      }}
    />
  );
}
