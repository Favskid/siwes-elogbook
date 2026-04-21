import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================================================
//  TYPES & INTERFACES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'supervisor' | 'admin';
  matric_number?: string;
  department?: string;
  phone?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  emailOrMatric: string;
  password: string;
  role: 'student' | 'supervisor' | 'admin';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'supervisor' | 'admin';
  matric_number: string;
  department: string;
  phone: string;
}

export interface LogEntry {
  id: string;
  date: string;
  week_number: number;
  activity_description: string;
  tools_equipment: string;
  skills_acquired: string;
  challenges_faced: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  supervisor_comment?: string;
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  files?: LogFile[];
  created_at: string;
  updated_at: string;
}

export interface LogFile {
  id: string;
  filename: string;
  size: number;
  uploaded_at: string;
}

export interface CreateLogEntryRequest {
  date: string;
  week_number: number;
  activity_description: string;
  tools_equipment: string;
  skills_acquired: string;
  challenges_faced: string;
  files?: File[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'feedback' | 'submission' | 'info';
  is_read: boolean;
  related_entry_id?: string;
  created_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  matric_number: string;
  department: string;
  phone: string;
  supervisor_id: string;
  supervisor_name: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDashboard {
  stats: {
    total: number;
    approved: number;
    pending: number;
    draft: number;
    rejected: number;
  };
  recentEntries: LogEntry[];
  unreadNotifications: {
    count: number;
    items: any[];
  };
}

export interface SupervisorDashboard {
  stats: {
    assigned_students: number;
    total_entries: number;
    pending_approvals: number;
    approved_entries: number;
    rejected_entries: number;
    average_rating: number;
  };
}

export interface AdminDashboard {
  users: {
    total: number;
    students: number;
  };
  logEntries: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  notifications: {
    total: number;
  };
  files: {
    total: number;
    totalSize: number;
  };
}

// ============================================================================
// 🔑 API SERVICE CLASS
// ============================================================================

class APIService {
  private axiosInstance: AxiosInstance;
  private apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  // Rate limit tracking
  private rateLimitTracking = {
    auth: { count: 0, resetTime: 0 },
    general: { count: 0, resetTime: 0 }
  };

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api') {
    this.apiBaseUrl = baseURL;
    
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor - add token to all requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh on 401
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip intercepting 401s if the request is an auth endpoint itself
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                               originalRequest?.url?.includes('/auth/register') || 
                               originalRequest?.url?.includes('/auth/logout') ||
                               originalRequest?.url?.includes('/auth/refresh-token');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            // Prevent multiple simultaneous refresh attempts
            if (!this.tokenRefreshPromise) {
              this.tokenRefreshPromise = this.refreshAccessToken();
            }

            await this.tokenRefreshPromise;
            this.tokenRefreshPromise = null;

            // Retry original request with new token
            if (this.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.tokenRefreshPromise = null;
            this.logout().catch(() => {}); // silently ignore logout errors during token refresh failure
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    this.loadTokensFromStorage();
  }

  /**
   * Load tokens from localStorage on initialization
   */
  private loadTokensFromStorage(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (token && token !== 'undefined' && token !== 'null') this.accessToken = token;
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') this.refreshToken = refreshToken;
    } catch (error) {
      console.warn('Could not load tokens from storage:', error);
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    } catch (error) {
      console.warn('Could not save tokens to storage:', error);
    }
  }

  /**
   * Check rate limits
   */
  private checkRateLimit(limitType: 'auth' | 'general'): void {
    const now = Date.now();
    const limit = limitType === 'auth' 
      ? { max: 5, window: 15 * 60 * 1000 }
      : { max: 100, window: 60 * 60 * 1000 };

    const tracking = this.rateLimitTracking[limitType];

    if (now > tracking.resetTime) {
      tracking.count = 0;
      tracking.resetTime = now + limit.window;
    }

    tracking.count++;

    if (tracking.count > limit.max) {
      throw new Error(
        `Rate limit exceeded for ${limitType} endpoints. ` +
        `Max ${limit.max} requests per ${limit.window / 1000 / 60} minutes.`
      );
    }
  }

  /**
   * Handle API errors with proper error messages
   */
  private handleError(error: any): never {
    if (error.response) {
      const status = error.response.status;
      const getData = error.response.data;

      let errorMessage = getData?.message;
      if (!errorMessage && getData?.error?.message) {
        errorMessage = getData.error.message;
      } else if (!errorMessage && typeof getData?.error === 'string') {
        errorMessage = getData.error;
      }

      throw {
        message: errorMessage || `HTTP Error ${status}`,
        status,
        code: getData?.code || getData?.error?.code,
        errors: getData?.errors || getData?.error?.details || getData?.details,
        originalError: error
      } as ApiErrorResponse;
    } else if (error.request) {
      throw {
        message: 'No response from server',
        status: 0,
        originalError: error
      } as ApiErrorResponse;
    } else {
      throw {
        message: error.message || 'Unknown error occurred',
        status: 0,
        originalError: error
      } as ApiErrorResponse;
    }
  }

  // ==================== 🔐 AUTH ENDPOINTS ====================

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<{ message: string; user: User }> {
    try {
      this.checkRateLimit('auth');
      const response = await this.axiosInstance.post('/auth/register', data);
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Login user and get tokens
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      this.checkRateLimit('auth');
      const response = await this.axiosInstance.post('/auth/login', data);
      const payload = response.data.data || response.data;
      const accessToken = payload.accessToken || payload.token;
      const refreshToken = payload.refreshToken;
      this.saveTokensToStorage(accessToken, refreshToken);
      return payload;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<{ user: User }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/auth/me');
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/auth/refresh-token`,
        { refreshToken: this.refreshToken }
      );

      const payload = response.data.data || response.data;
      const newAccessToken = payload.accessToken || payload.token;
      this.accessToken = newAccessToken;
      localStorage.setItem('accessToken', newAccessToken);

      return newAccessToken;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await this.axiosInstance.post('/auth/logout');
      this.clearTokens();
      return response.data;
    } catch (error) {
      // Still clear tokens even if logout fails
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Clear tokens from memory and storage
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      console.warn('Could not clear tokens from storage:', error);
    }
  }

  // ==================== 👨‍🎓 STUDENT ENDPOINTS ====================

  /**
   * Get student profile
   */
  async getStudentProfile(): Promise<{ profile: StudentProfile }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/students/profile');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update student profile
   */
  async updateStudentProfile(data: Partial<StudentProfile>): Promise<{ message: string; profile: StudentProfile }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put('/students/profile', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get student dashboard statistics
   */
  async getStudentDashboard(): Promise<{ success: boolean; message: string; data: StudentDashboard }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/students/dashboard');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== 📝 LOG ENTRY ENDPOINTS ====================

  /**
   * List log entries with pagination and filtering
   */
  async listLogEntries(
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<LogEntry>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/log-entries', { params });
      const payload = response.data.data || response.data;
      return {
        data: payload.entries || payload.data || (Array.isArray(payload) ? payload : []),
        pagination: payload.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new log entry (multipart for files)
   */
  async createLogEntry(data: CreateLogEntryRequest): Promise<{ message: string; entry: LogEntry }> {
    try {
      this.checkRateLimit('general');

      const formData = new FormData();
      formData.append('date', data.date);
      formData.append('week_number', data.week_number.toString());
      formData.append('activity_description', data.activity_description);
      formData.append('tools_equipment', data.tools_equipment);
      formData.append('skills_acquired', data.skills_acquired);
      formData.append('challenges_faced', data.challenges_faced);

      // Add files if present
      if (data.files && data.files.length > 0) {
        if (data.files.length > 5) {
          throw new Error('Maximum 5 files per request');
        }
        data.files.forEach((file) => {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} exceeds 10MB limit`);
          }
          formData.append('files', file);
        });
      }

      const response = await this.axiosInstance.post('/log-entries', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get a single log entry by ID
   */
  async getLogEntry(entryId: string): Promise<LogEntry> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get(`/log-entries/${entryId}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update log entry (draft or pending only)
   */
  async updateLogEntry(
    entryId: string,
    data: Partial<LogEntry>
  ): Promise<LogEntry> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/log-entries/${entryId}`, data);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Submit log entry (change status from draft to pending)
   */
  async submitLogEntry(entryId: string): Promise<LogEntry> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/log-entries/${entryId}/submit`);
      return response.data.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete log entry (draft or pending only)
   */
  async deleteLogEntry(entryId: string): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete(`/log-entries/${entryId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== 🔍 SUPERVISOR ENDPOINTS ====================

  /**
   * Get supervisor dashboard
   */
  async getSupervisorDashboard(): Promise<{ success: boolean; data: SupervisorDashboard }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/supervisors/dashboard');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get entries assigned to supervisor
   */
  async getAssignedEntries(
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<LogEntry>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/supervisors/entries', { params });
      const payload = response.data.data || response.data;
      return {
        data: payload.entries || payload.data || (Array.isArray(payload) ? payload : []),
        pagination: payload.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Approve a log entry with comment
   */
  async approveEntry(entryId: string, comment: string): Promise<{ message: string; entry: LogEntry }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/supervisors/entries/${entryId}/approve`, { comment });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Bulk approve log entries
   */
  async bulkApproveEntries(entryIds: string[], comment: string): Promise<{ message: string; count: number }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put('/supervisors/entries/bulk-approve', { entryIds, comment });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Reject a log entry with comment
   */
  async rejectEntry(entryId: string, comment: string): Promise<{ message: string; entry: LogEntry }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/supervisors/entries/${entryId}/reject`, { comment });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get students assigned to supervisor
   */
  async getAssignedStudents(
    params?: PaginationParams
  ): Promise<User[]> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/supervisors/students', { params });
      return response.data.data || [];
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get specific student's progress
   */
  async getStudentProgress(studentId: string): Promise<{
    student: User;
    stats: { total: number; approved: number; pending: number; rejected: number };
    recentEntries: LogEntry[];
  }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get(`/supervisors/students/${studentId}/progress`);
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== ⚙️ ADMIN ENDPOINTS ====================

  /**
   * Get admin dashboard
   */
  async getAdminDashboard(): Promise<{ success: boolean; data: AdminDashboard }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * List all users with pagination and filtering
   */
  async listUsers(
    params?: PaginationParams & { role?: string }
  ): Promise<PaginatedResponse<User>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/admin/users', { params });
      return {
        data: response.data.data.users,
        pagination: response.data.data.pagination
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: RegisterRequest): Promise<{ message: string; user: User }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.post('/admin/users', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update user details (admin only)
   */
  async updateUser(userId: string, data: Partial<User>): Promise<{ message: string; user: User }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/admin/users/${userId}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * List all departments
   */
  async listDepartments(params?: PaginationParams): Promise<PaginatedResponse<any>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/admin/departments', { params });
      return {
        data: response.data.data,
        pagination: response.data.pagination || { total: response.data.data.length, page: 1, limit: 100, pages: 1 }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new department
   */
  async createDepartment(data: { name: string; code: string }): Promise<{ message: string; department: any }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.post('/admin/departments', data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update department
   */
  async updateDepartment(departmentId: string, data: { name: string; code: string }): Promise<{ message: string; department: any }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/admin/departments/${departmentId}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(departmentId: string): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete(`/admin/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all log entries (admin only)
   */
  async getAllLogEntries(
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<LogEntry>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/admin/log-entries', { params });
      const payload = response.data.data || response.data;
      return {
        data: payload.entries || [],
        pagination: payload.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Export log entries as CSV
   */
  async exportEntriesAsCSV(): Promise<Blob> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/admin/reports/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Purge old entries (hard delete)
   */
  async purgeOldEntries(): Promise<{ message: string; deleted_count: number }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete('/admin/data/purge');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== 🔔 NOTIFICATION ENDPOINTS ====================

  /**
   * Get user notifications
   */
  async getNotifications(
    params?: PaginationParams & { is_read?: boolean }
  ): Promise<PaginatedResponse<Notification>> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get('/notifications', { params });
      return {
        data: response.data.data.notifications || [],
        pagination: response.data.data.pagination
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark single notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ message: string; notification: Notification }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== 📁 FILE ENDPOINTS ====================

  /**
   * Upload files to an entry
   */
  async uploadFiles(entryId: string, files: File[]): Promise<{ message: string; files: LogFile[] }> {
    try {
      this.checkRateLimit('general');

      if (files.length > 5) {
        throw new Error('Maximum 5 files per request');
      }

      const formData = new FormData();
      files.forEach((file) => {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 10MB limit`);
        }
        formData.append('files', file);
      });

      const response = await this.axiosInstance.post(`/files/upload/${entryId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get(`/files/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all files for an entry
   */
  async getEntryFiles(entryId: string): Promise<{ files: LogFile[] }> {
    try {
      this.checkRateLimit('general');
      const response = await this.axiosInstance.get(`/files/entry/${entryId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== 🔑 TOKEN MANAGEMENT ====================

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Get token expiration status
   */
  getTokenStatus(): { accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean } {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      isAuthenticated: this.isAuthenticated()
    };
  }

  /**
   * Set base URL for API
   */
  setBaseURL(url: string): void {
    this.apiBaseUrl = url;
    this.axiosInstance.defaults.baseURL = url;
  }
}

// Export singleton instance
export const apiService = new APIService();

/**
 * Create API service instance with custom configuration
 */
export function createAPIService(baseURL?: string): APIService {
  return new APIService(baseURL);
}

export default apiService;
