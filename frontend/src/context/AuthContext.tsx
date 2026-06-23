import { createContext, useContext } from "react";

export interface User {
  _id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
};
