import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  username: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("auth_user").then((val) => {
      if (val) {
        setUsername(val);
        setIsLoggedIn(true);
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      return { success: false, error: "Please fill in all fields." };
    }
    if (password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters." };
    }
    await AsyncStorage.setItem("auth_user", email);
    setUsername(email);
    setIsLoggedIn(true);
    return { success: true };
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_user");
    setUsername("");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
