import { apiService } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  CreateLogEntryRequest,
  User
} from './api';

// ============================================================================
// 👨‍🎓 STUDENT WORKFLOW EXAMPLES
// ============================================================================

/**
 * Student Workflow Step 1: Registration
 * 
 * Student registers in the system with their details
 */
export async function studentRegistration(data: RegisterRequest) {
  try {
    console.log('📝 Registering student...');
    const response = await apiService.register({
      ...data,
      role: 'student'
    });
    console.log('✅ Registration successful:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 2: Login & Authentication
 * 
 * Student logs in and receives tokens
 */
export async function studentLogin(emailOrMatric: string, password: string) {
  try {
    console.log('🔐 Logging in student...');
    const credentials: LoginRequest = {
      emailOrMatric,
      password,
      role: 'student'
    };
    
    const response = await apiService.login(credentials);
    console.log('✅ Login successful');
    console.log('🔑 Access Token stored in localStorage');
    console.log('📍 User:', response.user);
    
    return response;
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 3: View Dashboard
 * 
 * Student views their logbook statistics
 */
export async function studentViewDashboard() {
  try {
    console.log('📊 Fetching student dashboard...');
    const response = await apiService.getStudentDashboard();
    const dash = response.dashboard;
    
    console.log('✅ Dashboard loaded:');
    console.log(`   Total entries: ${dash.total_entries}`);
    console.log(`   Submitted: ${dash.submitted_entries}`);
    console.log(`   Pending approval: ${dash.pending_entries}`);
    console.log(`   Approved: ${dash.approved_entries}`);
    console.log(`   Rejected: ${dash.rejected_entries}`);
    console.log(`   Supervisor: ${dash.supervisor.name}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch dashboard:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 4: Create Log Entry (Draft)
 * 
 * Student creates a new log entry and saves it as draft
 */
export async function studentCreateLogEntry(entryData: {
  date: string;
  week_number: number;
  activity_description: string;
  tools_equipment: string;
  skills_acquired: string;
  challenges_faced: string;
  files?: File[];
}) {
  try {
    console.log('📝 Creating log entry...');
    
    // Validate text fields
    if (entryData.activity_description.length < 50) {
      throw new Error('Activity description must be at least 50 characters');
    }
    if (entryData.tools_equipment.length < 10) {
      throw new Error('Tools/equipment must be at least 10 characters');
    }
    if (entryData.skills_acquired.length < 10) {
      throw new Error('Skills acquired must be at least 10 characters');
    }
    if (entryData.challenges_faced.length < 10) {
      throw new Error('Challenges faced must be at least 10 characters');
    }

    const createData: CreateLogEntryRequest = {
      date: entryData.date,
      week_number: entryData.week_number,
      activity_description: entryData.activity_description,
      tools_equipment: entryData.tools_equipment,
      skills_acquired: entryData.skills_acquired,
      challenges_faced: entryData.challenges_faced,
      files: entryData.files
    };

    const response = await apiService.createLogEntry(createData);
    console.log('✅ Log entry created (status: draft)');
    console.log('   ID:', response.entry.id);
    console.log('   Files uploaded:', response.entry.files?.length || 0);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to create entry:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 5: Upload Files to Entry
 * 
 * Student uploads evidence files (PDF, images, docs)
 */
export async function studentUploadFilesToEntry(entryId: string, files: File[]) {
  try {
    console.log(`📁 Uploading ${files.length} files to entry...`);
    
    // Validate files before upload
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds 10MB limit`);
      }
    }

    const response = await apiService.uploadFiles(entryId, files);
    console.log('✅ Files uploaded successfully:');
    response.files.forEach((f, idx) => {
      console.log(`   ${idx + 1}. ${f.filename} (${(f.size / 1024).toFixed(2)} KB)`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 6: Submit Entry for Review
 * 
 * Student submits a draft entry to supervisor (changes status to pending)
 */
export async function studentSubmitEntry(entryId: string) {
  try {
    console.log(`📤 Submitting entry ${entryId} for review...`);
    
    const response = await apiService.submitLogEntry(entryId);
    console.log('✅ Entry submitted successfully');
    console.log(`   Status changed: draft → pending`);
    console.log(`   Submitted at: ${response.entry.submitted_at}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to submit entry:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 7: List All Log Entries
 * 
 * Student views all their log entries with filtering
 */
export async function studentListLogEntries(page = 1, status?: string) {
  try {
    console.log(`📋 Fetching log entries (page ${page}, status: ${status || 'all'})...`);
    
    const response = await apiService.listLogEntries({
      page,
      limit: 10,
      status
    });

    console.log(`✅ Loaded ${response.data.length} entries:`);
    response.data.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. [${entry.status}] Week ${entry.week_number} - ${entry.date}`);
    });
    console.log(`   Total: ${response.pagination.total} entries`);
    console.log(`   Pages: ${response.pagination.pages}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch entries:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 8: Check Notifications
 * 
 * Student checks for supervisor feedback and notifications
 */
export async function studentCheckNotifications() {
  try {
    console.log('🔔 Fetching notifications...');
    
    const response = await apiService.getNotifications({
      page: 1,
      limit: 10,
      is_read: false // Get unread only
    });

    console.log(`✅ ${response.data.length} unread notifications:`);
    response.data.forEach((notif, idx) => {
      console.log(`   ${idx + 1}. [${notif.type}] ${notif.title}`);
      console.log(`      ${notif.message}`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch notifications:', error.message);
    throw error;
  }
}

/**
 * Student Workflow Step 9: Edit Rejected Entry
 * 
 * Student receives feedback and resubmits rejected entry
 */
export async function studentEditAndResubmitEntry(
  entryId: string,
  updatedData: Partial<CreateLogEntryRequest>
) {
  try {
    console.log(`✏️ Updating entry ${entryId}...`);
    
    // Update entry
    await apiService.updateLogEntry(entryId, updatedData);
    console.log('✅ Entry updated');
    
    // Resubmit
    console.log('📤 Resubmitting entry...');
    const submitResponse = await apiService.submitLogEntry(entryId);
    console.log('✅ Entry resubmitted for review');
    
    return submitResponse;
  } catch (error: any) {
    console.error('❌ Failed to update entry:', error.message);
    throw error;
  }
}

// ============================================================================
// 👨‍⚖️ SUPERVISOR WORKFLOW EXAMPLES
// ============================================================================

/**
 * Supervisor Workflow Step 1: Login
 */
export async function supervisorLogin(emailOrMatric: string, password: string) {
  try {
    console.log('🔐 Logging in supervisor...');
    const credentials: LoginRequest = {
      emailOrMatric,
      password,
      role: 'supervisor'
    };
    
    const response = await apiService.login(credentials);
    console.log('✅ Login successful');
    console.log('📍 User:', response.user);
    
    return response;
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 2: View Dashboard
 * 
 * Supervisor views overview of assigned students and entries
 */
export async function supervisorViewDashboard() {
  try {
    console.log('📊 Fetching supervisor dashboard...');
    const response = await apiService.getSupervisorDashboard();
    const dash = response.dashboard;
    
    console.log('✅ Dashboard loaded:');
    console.log(`   Assigned students: ${dash.assigned_students}`);
    console.log(`   Total entries: ${dash.total_entries}`);
    console.log(`   Pending approvals: ${dash.pending_approvals}`);
    console.log(`   Approved: ${dash.approved_entries}`);
    console.log(`   Rejected: ${dash.rejected_entries}`);
    console.log(`   Average rating: ${dash.average_rating}/5`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch dashboard:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 3: Get Pending Entries
 * 
 * Supervisor retrieves pending entries awaiting approval
 */
export async function supervisorGetPendingEntries(page = 1) {
  try {
    console.log('⏳ Fetching pending entries...');
    
    const response = await apiService.getAssignedEntries({
      page,
      limit: 10,
      status: 'pending'
    });

    console.log(`✅ ${response.data.length} pending entries:`);
    response.data.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. Entry ${entry.id}`);
      console.log(`      Week ${entry.week_number} - ${entry.date}`);
      console.log(`      Submitted: ${entry.submitted_at}`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch entries:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 4: Review Entry with Files
 * 
 * Supervisor gets full entry details and downloads files for review
 */
export async function supervisorReviewEntry(entryId: string) {
  try {
    console.log(`📖 Reviewing entry ${entryId}...`);
    
    const response = await apiService.getLogEntry(entryId);
    const entry = response.entry;
    
    console.log('✅ Entry details:');
    console.log(`   Student: (from context)`);
    console.log(`   Date: ${entry.date} (Week ${entry.week_number})`);
    console.log(`   Activity: ${entry.activity_description.substring(0, 50)}...`);
    console.log(`   Tools: ${entry.tools_equipment}`);
    console.log(`   Skills: ${entry.skills_acquired}`);
    console.log(`   Challenges: ${entry.challenges_faced}`);
    console.log(`   Files: ${entry.files?.length || 0}`);
    
    if (entry.files && entry.files.length > 0) {
      console.log('   📁 Files to review:');
      entry.files.forEach((file) => {
        console.log(`      - ${file.filename} (${file.size} bytes)`);
      });
    }
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to review entry:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 5: Approve Entry
 * 
 * Supervisor approves an entry with feedback comment
 */
export async function supervisorApproveEntry(entryId: string, comment: string) {
  try {
    console.log(`✅ Approving entry ${entryId}...`);
    
    const response = await apiService.approveEntry(entryId, comment);
    console.log('✅ Entry approved');
    console.log(`   Comment: "${comment}"`);
    console.log(`   Approved at: ${response.entry.approved_at}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to approve entry:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 6: Reject Entry
 * 
 * Supervisor rejects an entry with feedback for improvement
 */
export async function supervisorRejectEntry(entryId: string, comment: string) {
  try {
    console.log(`❌ Rejecting entry ${entryId}...`);
    
    const response = await apiService.rejectEntry(entryId, comment);
    console.log('✅ Entry rejected');
    console.log(`   Feedback: "${comment}"`);
    console.log(`   Rejected at: ${response.entry.rejected_at}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to reject entry:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 7: View Assigned Students
 * 
 * Supervisor views list of assigned students
 */
export async function supervisorGetAssignedStudents(page = 1) {
  try {
    console.log('👨‍🎓 Fetching assigned students...');
    
    const response = await apiService.getAssignedStudents({
      page,
      limit: 10
    });

    console.log(`✅ ${response.data.length} assigned students:`);
    response.data.forEach((student, idx) => {
      console.log(`   ${idx + 1}. ${student.name} (${student.matric_number})`);
      console.log(`      Department: ${student.department}`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch students:', error.message);
    throw error;
  }
}

/**
 * Supervisor Workflow Step 8: Check Student Progress
 * 
 * Supervisor views detailed progress of a specific student
 */
export async function supervisorCheckStudentProgress(studentId: string) {
  try {
    console.log(`📊 Checking progress for student ${studentId}...`);
    
    const response = await apiService.getStudentProgress(studentId);
    const prog = response.progress;
    
    console.log('✅ Student progress:');
    console.log(`   Total entries: ${prog.total_entries}`);
    console.log(`   Submitted: ${prog.submitted_entries}`);
    console.log(`   Pending: ${prog.pending_entries}`);
    console.log(`   Approved: ${prog.approved_entries}`);
    console.log(`   Rejected: ${prog.rejected_entries}`);
    console.log(`   Approval rate: ${prog.approval_rate}%`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch progress:', error.message);
    throw error;
  }
}

// ============================================================================
// ⚙️ ADMIN WORKFLOW EXAMPLES
// ============================================================================

/**
 * Admin Workflow Step 1: Login
 */
export async function adminLogin(emailOrMatric: string, password: string) {
  try {
    console.log('🔐 Logging in admin...');
    const credentials: LoginRequest = {
      emailOrMatric,
      password,
      role: 'admin'
    };
    
    const response = await apiService.login(credentials);
    console.log('✅ Login successful');
    console.log('🔐 Admin access granted');
    
    return response;
  } catch (error: any) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 2: View Admin Dashboard
 * 
 * Admin views system-wide statistics
 */
export async function adminViewDashboard() {
  try {
    console.log('📊 Fetching admin dashboard...');
    const response = await apiService.getAdminDashboard();
    const dash = response.dashboard;
    
    console.log('✅ Dashboard loaded:');
    console.log(`   Total users: ${dash.total_users}`);
    console.log(`   Students: ${dash.total_students} | Supervisors: ${dash.total_supervisors}`);
    console.log(`   Total entries: ${dash.total_entries}`);
    console.log(`   Approved: ${dash.approved_entries} | Pending: ${dash.pending_entries} | Rejected: ${dash.rejected_entries}`);
    console.log(`   Active users today: ${dash.active_users_today}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch dashboard:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 3: List All Users
 * 
 * Admin views all users with role filtering
 */
export async function adminListUsers(role?: 'student' | 'supervisor' | 'admin', page = 1) {
  try {
    console.log(`👥 Fetching users (role: ${role || 'all'})...`);
    
    const response = await apiService.listUsers({
      page,
      limit: 20,
      role
    });

    console.log(`✅ ${response.data.length} users loaded:`);
    response.data.forEach((user, idx) => {
      console.log(`   ${idx + 1}. ${user.name} (${user.role})`);
      console.log(`      Email: ${user.email} | ${user.department || 'N/A'}`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 4: Create New User
 * 
 * Admin creates a new user account
 */
export async function adminCreateUser(userData: RegisterRequest) {
  try {
    console.log(`👤 Creating new ${userData.role}...`);
    
    const response = await apiService.createUser(userData);
    console.log('✅ User created successfully');
    console.log(`   ID: ${response.user.id}`);
    console.log(`   Name: ${response.user.name}`);
    console.log(`   Role: ${response.user.role}`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to create user:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 5: Update User
 * 
 * Admin updates user details
 */
export async function adminUpdateUser(userId: string, updates: Partial<User>) {
  try {
    console.log(`✏️ Updating user ${userId}...`);
    
    const response = await apiService.updateUser(userId, updates);
    console.log('✅ User updated successfully');
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to update user:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 6: Manage Departments
 * 
 * Admin views, creates, or updates departments
 */
export async function adminManageDepartments() {
  try {
    console.log('🏢 Fetching departments...');
    
    const response = await apiService.listDepartments({
      page: 1,
      limit: 50
    });

    console.log(`✅ ${response.data.length} departments:`);
    response.data.forEach((dept, idx) => {
      console.log(`   ${idx + 1}. ${dept.name} (${dept.code})`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch departments:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 7: Export Data as CSV
 * 
 * Admin exports all log entries as CSV file
 */
export async function adminExportData() {
  try {
    console.log('📥 Exporting data as CSV...');
    
    const blob = await apiService.exportEntriesAsCSV();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logbook_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log('✅ CSV exported successfully');
    
    return blob;
  } catch (error: any) {
    console.error('❌ Failed to export data:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 8: View All Log Entries
 * 
 * Admin can view and filter all system log entries
 */
export async function adminViewAllEntries(status?: string, page = 1) {
  try {
    console.log(`📋 Fetching all entries (status: ${status || 'all'})...`);
    
    const response = await apiService.getAllLogEntries({
      page,
      limit: 20,
      status
    });

    console.log(`✅ ${response.data.length} entries:`);
    response.data.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. [${entry.status}] Entry ${entry.id}`);
      console.log(`      Week ${entry.week_number} - ${entry.date}`);
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to fetch entries:', error.message);
    throw error;
  }
}

/**
 * Admin Workflow Step 9: Purge Old Data
 * 
 * Admin hard-deletes entries older than 2 years (DESTRUCTIVE)
 */
export async function adminPurgeOldData() {
  try {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete all entries older than 2 years. ' +
      'This action CANNOT be undone. Continue?'
    );
    
    if (!confirmed) {
      console.log('❌ Purge cancelled');
      return;
    }

    console.log('🗑️ Purging old entries...');
    
    const response = await apiService.purgeOldEntries();
    console.log('✅ Purge completed');
    console.log(`   Deleted ${response.deleted_count} entries`);
    
    return response;
  } catch (error: any) {
    console.error('❌ Failed to purge data:', error.message);
    throw error;
  }
}

// ============================================================================
// 🔑 ERROR HANDLING & TOKEN MANAGEMENT EXAMPLES
// ============================================================================

/**
 * Example: Handle API Errors
 * 
 * Demonstrates proper error handling patterns
 */
export async function handleApiErrorExample() {
  try {
    // This will likely fail with a 401 or validation error
    await apiService.listLogEntries({ page: 0, limit: 99999 });
  } catch (error: any) {
    console.error('API Error Details:');
    console.error(`   Status: ${error.status}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.status === 401) {
      console.error('   → Authentication failed. Please login again.');
    } else if (error.status === 403) {
      console.error('   → Permission denied. You don\'t have access to this resource.');
    } else if (error.status === 404) {
      console.error('   → Resource not found.');
    } else if (error.status === 429) {
      console.error('   → Rate limit exceeded. Please wait before making more requests.');
    } else if (error.status === 400) {
      console.error('   → Validation error:', error.errors);
    } else if (error.status === 500) {
      console.error('   → Server error. Please try again later.');
    }
  }
}

/**
 * Example: Token Management
 * 
 * Shows how tokens are automatically managed
 */
export function tokenManagementExample() {
  // Check authentication status
  const isAuth = apiService.isAuthenticated();
  console.log('🔐 Authenticated:', isAuth);

  // Get token status
  const status = apiService.getTokenStatus();
  console.log('🔑 Token Status:');
  console.log(`   Access Token: ${status.accessToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Refresh Token: ${status.refreshToken ? '✅ Present' : '❌ Missing'}`);

  // Tokens are automatically:
  // 1. Stored in localStorage after login
  // 2. Loaded from localStorage on initialization
  // 3. Included in all protected requests
  // 4. Refreshed automatically on 401 response
  // 5. Cleared on logout
}

/**
 * Example: File Upload with Validation
 * 
 * Demonstrates file upload with proper validation
 */
export async function fileUploadExample(entryId: string, files: FileList) {
  try {
    const fileArray = Array.from(files);
    
    // Validation
    if (fileArray.length === 0) {
      throw new Error('No files selected');
    }
    if (fileArray.length > 5) {
      throw new Error('Maximum 5 files allowed');
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`${file.name} has invalid file type`);
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`${file.name} exceeds 10MB limit`);
      }
    }

    console.log(`📁 Uploading ${fileArray.length} files...`);
    const response = await apiService.uploadFiles(entryId, fileArray);
    console.log('✅ Upload successful:', response.files);
    
    return response;
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    throw error;
  }
}

/**
 * Example: Pagination
 * 
 * Demonstrates proper pagination handling
 */
export async function paginationExample() {
  try {
    // Always know max pages before iterating
    let page = 1;
    const allEntries = [];

    console.log('📄 Fetching all entries with pagination...');
    
    while (true) {
      const response = await apiService.listLogEntries({
        page,
        limit: 10
      });

      allEntries.push(...response.data);
      console.log(`   Loaded page ${page} (${response.data.length} entries)`);

      // Check if we've reached the last page
      if (page >= response.pagination.pages) {
        break;
      }

      page++;

      // Be mindful of rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Total entries loaded: ${allEntries.length}`);
    return allEntries;
  } catch (error: any) {
    console.error('❌ Pagination error:', error.message);
    throw error;
  }
}
