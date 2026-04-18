/**
 * Error Handler Utility
 * Converts backend error codes to user-friendly messages
 */

export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
  status: number;
  details?: Record<string, any>;
}

/**
 * Error messages mapped to user-friendly descriptions
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // Authentication Errors
  'AUTH_INVALID_CREDENTIALS': {
    title: '❌ Login Failed',
    message: 'Invalid email/matric number or password. Please check and try again.'
  },
  'INVALID_CREDENTIALS': {
    title: '❌ Login Failed',
    message: 'Invalid email/matric number or password. Please check and try again.'
  },
  'AUTH_ACCOUNT_NOT_FOUND': {
    title: '❌ Account Not Found',
    message: 'No account found with this email or matric number. Please register first.'
  },
  'AUTH_ACCOUNT_LOCKED': {
    title: '🔒 Account Locked',
    message: 'Your account has been locked due to multiple failed login attempts. Please try again later.'
  },
  'AUTH_EMAIL_NOT_VERIFIED': {
    title: '⚠️ Email Not Verified',
    message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
  },
  'AUTH_INVALID_TOKEN': {
    title: '🔐 Session Expired',
    message: 'Your session has expired. Please log in again.'
  },
  'AUTH_TOKEN_EXPIRED': {
    title: '🔐 Session Expired',
    message: 'Your session has expired. Please log in again.'
  },

  // Registration Errors
  'REGISTER_EMAIL_EXISTS': {
    title: '📧 Email Already Registered',
    message: 'This email is already registered. Please use a different email or log in to your existing account.'
  },
  'REGISTER_MATRIC_EXISTS': {
    title: '🆔 Matric Number Already Registered',
    message: 'This matric number is already registered. Please contact support if you believe this is an error.'
  },
  'REGISTER_WEAK_PASSWORD': {
    title: '🔐 Password Too Weak',
    message: 'Your password must be at least 8 characters long and contain uppercase, lowercase, and numbers.'
  },
  'REGISTER_INVALID_EMAIL': {
    title: '📧 Invalid Email',
    message: 'Please enter a valid email address.'
  },
  'REGISTER_INVALID_MATRIC': {
    title: '🆔 Invalid Matric Format',
    message: 'Matric number format is invalid. Please check the format (e.g., CSC/2021/001).'
  },
  'REGISTER_MISSING_FIELDS': {
    title: '📝 Missing Information',
    message: 'Please fill in all required fields.'
  },
  'REGISTER_PASSWORD_MISMATCH': {
    title: '🔐 Passwords Do Not Match',
    message: 'The password and confirmation password do not match. Please check and try again.'
  },

  // Validation Errors
  'VALIDATION_ERROR': {
    title: '⚠️ Validation Error',
    message: 'Some fields have invalid values. Please check and try again.'
  },
  'VALIDATION_FIELD_REQUIRED': {
    title: '📝 Required Field',
    message: 'This field is required. Please fill it in.'
  },
  'VALIDATION_INVALID_FORMAT': {
    title: '⚠️ Invalid Format',
    message: 'The format of this field is invalid. Please check and try again.'
  },

  // Log Entry Errors
  'ENTRY_DESCRIPTION_TOO_SHORT': {
    title: '📝 Description Too Short',
    message: 'Activity description must be at least 50 characters long.'
  },
  'ENTRY_TOOLS_INVALID': {
    title: '🛠️ Tools & Equipment Required',
    message: 'Tools & equipment description must be at least 10 characters long.'
  },
  'ENTRY_SKILLS_INVALID': {
    title: '📚 Skills Acquired Required',
    message: 'Skills acquired description must be at least 10 characters long.'
  },
  'ENTRY_CHALLENGES_INVALID': {
    title: '⚠️ Challenges Required',
    message: 'Challenges faced description must be at least 10 characters long.'
  },
  'ENTRY_INVALID_DATE': {
    title: '📅 Invalid Date',
    message: 'The date you entered is invalid. Please select today\'s date or earlier.'
  },
  'ENTRY_INVALID_WEEK': {
    title: '📊 Invalid Week'  ,
    message: 'Please select a valid week between 1 and 24.'
  },
  'ENTRY_DUPLICATE': {
    title: '⚠️ Duplicate Entry',
    message: 'You already have a log entry for this date. Please edit the existing entry instead.'
  },
  'ENTRY_NOT_FOUND': {
    title: '❌ Entry Not Found',
    message: 'The log entry you\'re looking for doesn\'t exist or was deleted.'
  },

  // File Upload Errors
  'FILE_TOO_LARGE': {
    title: '📁 File Too Large',
    message: 'The file is too large. Maximum file size is 10MB.'
  },
  'FILE_INVALID_TYPE': {
    title: '📁 Invalid File Type',
    message: 'This file type is not allowed. Please upload PDF, images, or documents only.'
  },
  'FILE_UPLOAD_FAILED': {
    title: '📁 Upload Failed',
    message: 'Failed to upload the file. Please try again.'
  },
  'FILE_MAX_FILES_EXCEEDED': {
    title: '📁 Too Many Files',
    message: 'Maximum 5 files per entry. Please remove some files and try again.'
  },

  // Permission Errors
  'CONFLICT': {
    title: '⚠️ Resource Conflict',
    message: 'This resource already exists. Please check your information and try again.'
  },
  'NOT_FOUND': {
    title: '❌ Not Found',
    message: 'The resource you\'re looking for doesn\'t exist or was deleted.'
  },
  'FORBIDDEN': {
    title: '🚫 Access Denied',
    message: 'You don\'t have permission to perform this action.'
  },
  'UNAUTHORIZED': {
    title: '🔐 Not Authenticated',
    message: 'You need to log in to perform this action.'
  },

  // Server Errors
  'SERVER_ERROR': {
    title: '⚠️ Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  },
  'DATABASE_ERROR': {
    title: '⚠️ Database Error',
    message: 'A database error occurred. Please try again later.'
  },
  'RATE_LIMIT_EXCEEDED': {
    title: '⏱️ Too Many Requests',
    message: 'You\'re making too many requests. Please wait a moment and try again.'
  },
  'SERVICE_UNAVAILABLE': {
    title: '🔧 Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.'
  },

  // Network Errors
  'NETWORK_ERROR': {
    title: '🌐 Connection Error',
    message: 'Failed to connect to the server. Please check your internet connection and try again.'
  },
  'TIMEOUT': {
    title: '⏱️ Request Timeout',
    message: 'The request took too long. Please try again.'
  },
};

/**
 * Parse error status code to user-friendly message
 */
export function parseApiError(error: any): ApiError {
  // If it's already formatted as ApiError, return it
  if (error.code && error.userMessage) {
    return error as ApiError;
  }

  let code = 'SERVER_ERROR';
  let status = error.status || error.response?.status || error.originalError?.response?.status || 500;
  let message = error.message || 'An unknown error occurred';
  
  // The API service might throw an ApiErrorResponse wrapping the original Axios error
  // The raw backend response is always located at `error.originalError?.response?.data`
  const rawAxiosData = error.originalError?.response?.data || error.response?.data;
  
  // Get backend response data
  const responseData = rawAxiosData || error || {};

  let details = error.details || error.errors || responseData?.details || error.originalError?.response?.data?.error?.details;

  // Try to find the most specific error string dynamically.
  let specificErrorString = '';
  if (typeof responseData === 'string') {
     specificErrorString = responseData;
  } else if (responseData.error && typeof responseData.error === 'string') {
     specificErrorString = responseData.error;
  } else if (responseData.error?.message) {
     // Check if nested error.message exists (e.g. { error: { message: "..." } })
     specificErrorString = responseData.error.message;
  } else if (responseData.message && typeof responseData.message === 'string' && responseData.message !== 'Validation error' && !responseData.message.startsWith('HTTP Error')) {
     specificErrorString = responseData.message;
  } else if (details) {
    if (Array.isArray(details) && details.length > 0) {
      specificErrorString = details[0].msg || details[0].message || typeof details[0] === 'string' ? details[0] : JSON.stringify(details[0]);
    } else if (typeof details === 'object') {
       const firstKey = Object.keys(details)[0];
       if (firstKey) {
          const firstVal = details[firstKey];
          specificErrorString = Array.isArray(firstVal) ? firstVal[0] : (typeof firstVal === 'string' ? firstVal : JSON.stringify(firstVal));
       }
    }
  }

  // Use the specificErrorString if found, otherwise fallback
  const backendMessage = specificErrorString || (responseData.message && !responseData.message.startsWith('HTTP Error') ? responseData.message : '') || responseData.error?.message || message;
  const backendError = typeof responseData.error === 'string' ? responseData.error : (responseData.error?.message || '');

  // Determine error code from status and response data
  if (error.code && ERROR_MESSAGES[error.code]) {
    code = error.code;
  } else if (responseData.code) {
    code = responseData.code;
  } else if (responseData.error?.code) {
    code = responseData.error.code;
  } else if (status === 400) {
    // Handle 400 errors - check for specific validation messages
    if (backendMessage.toLowerCase().includes('password')) {
      code = 'REGISTER_WEAK_PASSWORD';
    } else if (backendMessage.toLowerCase().includes('email') || backendError.toLowerCase().includes('email')) {
      code = 'REGISTER_INVALID_EMAIL';
    } else if (backendMessage.toLowerCase().includes('matric')) {
      code = 'REGISTER_INVALID_MATRIC';
    } else {
      code = 'VALIDATION_ERROR';
    }
  } else if (status === 401) {
    code = 'UNAUTHORIZED';
  } else if (status === 403) {
    code = 'FORBIDDEN';
  } else if (status === 404) {
    code = 'NOT_FOUND';
  } else if (status === 409) {
    // Handle 409 conflict errors - email or matric already registered
    if (backendMessage.toLowerCase().includes('email') || backendError.toLowerCase().includes('email')) {
      code = 'REGISTER_EMAIL_EXISTS';
    } else if (backendMessage.toLowerCase().includes('matric')) {
      code = 'REGISTER_MATRIC_EXISTS';
    } else {
      code = 'CONFLICT';
    }
  } else if (status === 422) {
    code = 'VALIDATION_ERROR';
  } else if (status === 429) {
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (status === 503) {
    code = 'SERVICE_UNAVAILABLE';
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    code = 'NETWORK_ERROR';
    status = 0;
  } else if (error.code === 'ECONNABORTED' || message.includes('timeout')) {
    code = 'TIMEOUT';
    status = 0;
  }

  let errorInfo = ERROR_MESSAGES[code] ? { ...ERROR_MESSAGES[code] } : {
    title: '❌ Error',
    message: message
  };

  // Override generic validation messages with specific backend messages if available
  // This ensures the frontend displays exactly what the backend complained about
  if (
    backendMessage && 
    backendMessage !== 'An unknown error occurred' &&
    !backendMessage.includes('Request failed with status code') &&
    backendMessage !== 'Network Error'
  ) {
    if (status === 400 || status === 422 || status === 409 || code === 'VALIDATION_ERROR' || code.startsWith('REGISTER_') || code.startsWith('AUTH_')) {
      errorInfo.message = backendMessage;
    }
  }

  return {
    code,
    message: backendMessage,
    userMessage: `${errorInfo.title}\n\n${errorInfo.message}`,
    status,
    details
  };
}

/**
 * Get field-specific error message
 */
export function getFieldError(errors: Record<string, string[] | string> | undefined, field: string): string | null {
  if (!errors) return null;

  const fieldErrors = errors[field];
  if (Array.isArray(fieldErrors)) {
    return fieldErrors[0] || null;
  }
  return fieldErrors || null;
}

/**
 * Format display message for user
 */
export function getDisplayMessage(error: ApiError): string {
  return error.userMessage || ERROR_MESSAGES[error.code]?.message || 'An error occurred. Please try again.';
}

/**
 * Get just the title for notifications
 */
export function getErrorTitle(error: ApiError): string {
  return ERROR_MESSAGES[error.code]?.title || '❌ Error';
}

/**
 * Check if error is critical (should redirect/logout)
 */
export function isCriticalError(error: ApiError): boolean {
  const criticalCodes = ['UNAUTHORIZED', 'AUTH_INVALID_TOKEN', 'AUTH_TOKEN_EXPIRED'];
  return criticalCodes.includes(error.code);
}
