import { useEffect, useState, useCallback, type ReactNode } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      await api.get("/user/profile");
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const logout = async () => {
    try {
      await api.post("/user/logout");
    } finally {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };

    initAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
