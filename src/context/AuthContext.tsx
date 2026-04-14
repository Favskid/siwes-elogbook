import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "student" | "industry_supervisor" | "school_supervisor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  matricNumber?: string;
  department?: string;
  role: Role;
  company?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { emailOrMatric: string; password: string; role: Role }) => { success: boolean; error?: string };
  register: (data: { name: string; email: string; matricNumber: string; department: string; password: string; role: Role; company?: string }) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const MOCK_USERS: User[] = [
  { id: "s1", name: "Onye Kachi", email: "Kachi@student.caritas.edu.ng", matricNumber: "CSC/2021/001", department: "Computer Science", role: "student" },
  { id: "s2", name: "Emeka Chukwuemeka", email: "emeka@student.caritas.edu.ng", matricNumber: "CSC/2021/002", department: "Computer Science", role: "student" },
  { id: "s3", name: "Ngozi Ifeanyi", email: "ngozi@student.caritas.edu.ng", matricNumber: "EEE/2021/003", department: "Electrical Engineering", role: "student" },
  { id: "is1", name: "Mr. Babatunde Adeyemi", email: "supervisor@techcorp.com", department: "Engineering", role: "industry_supervisor", company: "TechCorp Nigeria Ltd" },
  { id: "ss1", name: "Dr. Patience Eze", email: "patience@caritas.edu.ng", department: "Computer Science", role: "school_supervisor" },
  { id: "a1", name: "Prof. Emmanuel Okafor", email: "admin@caritas.edu.ng", department: "Administration", role: "admin" },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("siwes_user");
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("siwes_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("siwes_user");
    }
  }, [user]);

  const login = (credentials: { emailOrMatric: string; password: string; role: Role }) => {
    const found = MOCK_USERS.find(u =>
      (u.email === credentials.emailOrMatric || u.matricNumber === credentials.emailOrMatric) &&
      u.role === credentials.role
    );
    if (found) {
      setUser(found);
      return { success: true };
    }
    // Demo: allow any login with matching role if not found (creates mock user)
    const roleUser = MOCK_USERS.find(u => u.role === credentials.role);
    if (roleUser && credentials.password === "password123") {
      setUser(roleUser);
      return { success: true };
    }
    return { success: false, error: "Invalid credentials. Try password: password123" };
  };

  const register = (data: { name: string; email: string; matricNumber: string; department: string; password: string; role: Role; company?: string }) => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: data.name,
      email: data.email,
      matricNumber: data.matricNumber,
      department: data.department,
      role: data.role,
      company: data.company,
    };
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
