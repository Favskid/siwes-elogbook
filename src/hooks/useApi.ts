/**
 * API Hooks - React hooks for using the API Service
 * Provides easy-to-use hooks for authentication, data fetching, and state management
 */

import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  LogEntry,
  Notification,
  StudentProfile,
  StudentDashboard,
  SupervisorDashboard,
  AdminDashboard,
  CreateLogEntryRequest,
  PaginatedResponse,
  ApiErrorResponse
} from '../services/api';

// ============================================================================
// 🔐 AUTHENTICATION HOOKS
// ============================================================================

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Authentication hook
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  // Load user from storage on mount
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      getCurrentUserData();
    }
  }, []);

  const getCurrentUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getCurrentUser();
      setUser(response.user);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.login(credentials);
      setUser(response.user);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.register(data);
      // Registration doesn't automatically log in, user needs to login after
      setUser(response.user);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.logout();
      setUser(null);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    getCurrentUser: getCurrentUserData,
    isAuthenticated: !!user
  };
}

// ============================================================================
// 📝 LOG ENTRY HOOKS
// ============================================================================

interface UseLogEntriesReturn {
  entries: LogEntry[];
  pagination: any;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  fetchEntries: (page?: number, limit?: number, status?: string) => Promise<void>;
  createEntry: (data: CreateLogEntryRequest) => Promise<LogEntry>;
  getEntry: (id: string) => Promise<LogEntry>;
  updateEntry: (id: string, data: Partial<CreateLogEntryRequest>) => Promise<LogEntry>;
  submitEntry: (id: string) => Promise<LogEntry>;
  deleteEntry: (id: string) => Promise<void>;
}

/**
 * Log entries hook for students
 */
export function useLogEntries(): UseLogEntriesReturn {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchEntries = useCallback(async (page = 1, limit = 10, status?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.listLogEntries({
        page,
        limit,
        status
      });
      setEntries(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (data: CreateLogEntryRequest): Promise<LogEntry> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.createLogEntry(data);
      setEntries([response.entry, ...entries]);
      return response.entry;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  const getEntry = useCallback(async (id: string): Promise<LogEntry> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getLogEntry(id);
      return response.entry;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEntry = useCallback(async (id: string, data: Partial<CreateLogEntryRequest>): Promise<LogEntry> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.updateLogEntry(id, data);
      setEntries(entries.map(e => e.id === id ? response.entry : e));
      return response.entry;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  const submitEntry = useCallback(async (id: string): Promise<LogEntry> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.submitLogEntry(id);
      setEntries(entries.map(e => e.id === id ? response.entry : e));
      return response.entry;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.deleteLogEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  return {
    entries,
    pagination,
    isLoading,
    error,
    fetchEntries,
    createEntry,
    getEntry,
    updateEntry,
    submitEntry,
    deleteEntry
  };
}

// ============================================================================
// 🔔 NOTIFICATIONS HOOK
// ============================================================================

interface UseNotificationsReturn {
  notifications: Notification[];
  pagination: any;
  unreadCount: number;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

/**
 * Notifications hook
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async (page = 1, limit = 10, unreadOnly = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getNotifications({
        page,
        limit,
        is_read: unreadOnly ? false : undefined
      });
      setNotifications(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.markNotificationAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications]);

  return {
    notifications,
    pagination,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

// ============================================================================
// 👨‍🎓 STUDENT PROFILE HOOKS
// ============================================================================

interface UseStudentProfileReturn {
  profile: StudentProfile | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
}

/**
 * Student profile hook
 */
export function useStudentProfile(): UseStudentProfileReturn {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getStudentProfile();
      setProfile(response.profile);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<StudentProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.updateStudentProfile(data);
      setProfile(response.profile);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile
  };
}

// ============================================================================
// 📊 DASHBOARD HOOKS
// ============================================================================

/**
 * Student dashboard hook
 */
export function useStudentDashboard() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getStudentDashboard();
      setDashboard(response.dashboard);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { dashboard, isLoading, error, fetchDashboard };
}

/**
 * Supervisor dashboard hook
 */
export function useSupervisorDashboard() {
  const [dashboard, setDashboard] = useState<SupervisorDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getSupervisorDashboard();
      setDashboard(response.dashboard);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { dashboard, isLoading, error, fetchDashboard };
}

/**
 * Admin dashboard hook
 */
export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAdminDashboard();
      setDashboard(response.dashboard);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { dashboard, isLoading, error, fetchDashboard };
}

// ============================================================================
// 🔄 DATA FETCHING HOOK (Generic)
// ============================================================================

interface UseFetchReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  refetch: () => Promise<void>;
}

/**
 * Generic data fetching hook
 */
export function useFetch<T>(fetchFn: () => Promise<{ [key: string]: T }>): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchFn();
      const key = Object.keys(response)[0];
      setData(response[key]);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

// ============================================================================
// 📁 FILE UPLOAD HOOK
// ============================================================================

interface UseFileUploadReturn {
  isUploading: boolean;
  progress: number;
  error: ApiErrorResponse | null;
  uploadFiles: (entryId: string, files: File[]) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

/**
 * File upload hook with progress tracking
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const uploadFiles = useCallback(async (entryId: string, files: File[]) => {
    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      // Validate files
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > 50 * 1024 * 1024) {
        throw new Error('Total file size exceeds 50MB limit');
      }

      // Upload with progress simulation
      setProgress(50);
      await apiService.uploadFiles(entryId, files);
      setProgress(100);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const downloadFile = useCallback(async (fileId: string) => {
    try {
      setIsUploading(true);
      setError(null);
      const blob = await apiService.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      setIsUploading(true);
      setError(null);
      await apiService.deleteFile(fileId);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    isUploading,
    progress,
    error,
    uploadFiles,
    downloadFile,
    deleteFile
  };
}
