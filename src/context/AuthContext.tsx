import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiService, User as ApiUser, LoginRequest, RegisterRequest } from "../services/api";

export type Role = "student" | "supervisor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  matric_number?: string;
  department?: string;
  role: Role;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { emailOrMatric: string; password: string; role: Role }) => Promise<{ success: boolean; error?: string; code?: string }>;
  register: (data: { name: string; email: string; matric_number: string; department: string; password: string; role: Role; phone: string }) => Promise<{ success: boolean; error?: string; code?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from API on mount if token exists
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      loadCurrentUser();
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCurrentUser();
      const apiUser = response.user;
      
      // Map API user to local User type
      setUser({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        matric_number: apiUser.matric_number,
        department: apiUser.department,
        role: (apiUser.role === 'student' ? 'student' : apiUser.role === 'admin' ? 'admin' : 'supervisor') as Role,
        phone: apiUser.phone,
      });
    } catch (error) {
      console.error('Failed to load current user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { emailOrMatric: string; password: string; role: Role }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Map role to API role
      const apiRole = credentials.role;
      
      const response = await apiService.login({
        emailOrMatric: credentials.emailOrMatric,
        password: credentials.password,
        role: apiRole as any,
      });

      const apiUser = response.user;
      setUser({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        matric_number: apiUser.matric_number,
        department: apiUser.department,
        role: (apiUser.role === 'student' ? 'student' : apiUser.role === 'admin' ? 'admin' : 'supervisor') as Role,
        phone: apiUser.phone,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || (error.status === 401 ? 'Invalid credentials' : 'Login failed'),
        code: error.code
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; matric_number: string; department: string; password: string; role: Role; phone: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await apiService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as any,
        matric_number: data.matric_number,
        department: data.department,
        phone: data.phone,
      });

      // Don't auto-login after registration - require user to login
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed',
        code: error.code
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user even if logout fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
