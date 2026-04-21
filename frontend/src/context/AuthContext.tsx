import React, { createContext, useContext, useState, useCallback } from "react";
import type { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => void;
  register: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email: string, _password: string, role: UserRole) => {
    const u = {
      id: "usr-001",
      name: email.split("@")[0],
      email,
      role,
    };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }, []);

  const register = useCallback((name: string, email: string, _password: string, role: UserRole) => {
    const u = { id: "usr-001", name, email, role };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
