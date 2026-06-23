import { useEffect, useState, useCallback, type ReactNode } from "react";
import api from "../api/axios";
import { AuthContext, type User } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get("/user/profile");
      setIsAuthenticated(true);
      setUser(res.data);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const logout = async () => {
    try {
      await api.post("/user/logout");
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
