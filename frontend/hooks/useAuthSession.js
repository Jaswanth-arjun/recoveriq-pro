"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gb_user_session";

export function useAuthSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load auth session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback((userData) => {
    const defaultUser = {
      name: userData?.name || "Jaswanth Arjun",
      email: userData?.email || "jaswanth.arjun@gmail.com",
      avatar: userData?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Jaswanth",
      id: userData?.id || "google_" + Date.now(),
      // true when the profile came from a REAL Google OAuth ID token that
      // the backend verified against Google's tokeninfo endpoint.
      googleVerified: !!userData?.googleVerified,
      loggedInAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    } catch (err) {
      console.error("Failed to save auth session:", err);
    }
    setUser(defaultUser);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error("Failed to remove auth session:", err);
    }
    setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    loading,
    loginWithGoogle,
    logout,
  };
}
