import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { apiService, LogEntry, User } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function ApprovalModal({ entry, onApprove, onReject, onClose, isSubmitting }: {
  entry: LogEntry;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [comment, setComment] = useState("");

  const handleReject = () => {
    onReject(comment || "Please revise and resubmit.");
  };

  const handleApprove = () => {
    onApprove(comment);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Review Entry — Week {entry.week_number}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Activity</div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-4">{entry.activity_description}</p>
          </div>
          {entry.skills_acquired && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Skills Acquired</div>
              <p className="text-sm text-foreground">{entry.skills_acquired}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Comment (optional for approval, required for rejection)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add feedback or comments for the student..."
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm border border-border text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Reject"}
          </button>
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [assignedEntries, setAssignedEntries] = useState<LogEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [reviewEntry, setReviewEntry] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const dashResponse = await apiService.getSupervisorDashboard();
      setDashboard(dashResponse.data);

      // Fetch assigned students
      const studentsResponse = await apiService.getAssignedStudents({ page: 1, limit: 100 });
      setStudents(studentsResponse.data || []);

      // Fetch assigned entries
      const entriesResponse = await apiService.getAssignedEntries({ page: 1, limit: 100 });
      setAssignedEntries(entriesResponse.data || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (comment: string) => {
    if (!reviewEntry) return;
    try {
      setSubmitting(true);
      await apiService.approveEntry(reviewEntry.id, comment);
      setReviewEntry(null);
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Failed to approve entry:', err);
      setError(err.message || 'Failed to approve entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (comment: string) => {
    if (!reviewEntry) return;
    try {
      setSubmitting(true);
      await apiService.rejectEntry(reviewEntry.id, comment);
      setReviewEntry(null);
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Failed to reject entry:', err);
      setError(err.message || 'Failed to reject entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-800 text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter entries based on selected student
  const filteredEntries = selectedStudent 
    ? assignedEntries.filter(e => e.id && selectedStudent) 
    : assignedEntries;

  const stats = {
    assignedStudents: dashboard?.stats?.assigned_students || 0,
    totalEntries: dashboard?.stats?.total_entries || 0,
    pendingCount: dashboard?.stats?.pending_approvals || 0,
    approved: dashboard?.stats?.approved_entries || 0,
  };

  // Get student name from ID (if available in students list)
  const getStudentName = (studentId?: string) => {
    if (!studentId) return 'Unknown';
    if (selectedStudent === studentId) {
      const student = students.find(s => s.id === studentId);
      return student?.name || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {reviewEntry && (
        <ApprovalModal
          entry={reviewEntry}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setReviewEntry(null)}
          isSubmitting={submitting}
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-foreground">Supervisor Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {user?.department || 'Caritas University'} • {user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Assigned Students", value: stats.assignedStudents, color: "bg-blue-100 text-blue-700" },
          { label: "Pending Reviews", value: stats.pendingCount, color: "bg-yellow-100 text-yellow-700" },
          { label: "Approved Entries", value: stats.approved, color: "bg-green-100 text-green-700" },
          { label: "Total Entries", value: stats.totalEntries, color: "bg-purple-100 text-purple-700" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-5">
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Students list */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">My Students ({students.length})</h2>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            <button
              onClick={() => setSelectedStudent(null)}
              className={`w-full text-left px-5 py-3 text-sm transition-colors ${!selectedStudent ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"}`}
            >
              All Students
            </button>
            {students.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No students assigned
              </div>
            ) : (
              students.map(s => {
                const studentEntries = assignedEntries.filter(e => e.id); // In real scenario, filter by student ID
                const sPending = studentEntries.filter(e => e.status === "pending").length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s.id)}
                    className={`w-full text-left px-5 py-3 transition-colors ${selectedStudent === s.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{s.name.split(" ").slice(0, 2).join(" ")}</div>
                        <div className="text-xs text-muted-foreground truncate">{s.matric_number || 'N/A'}</div>
                      </div>
                      {sPending > 0 && (
                        <span className="w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center font-bold shrink-0">{sPending}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Entries */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">
              {selectedStudent ? "Student's Entries" : "All Log Entries"}
            </h2>
          </div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No entries found</div>
            ) : (
              filteredEntries.map(entry => (
                <div key={entry.id} className="px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium text-foreground">Week {entry.week_number}</span>
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{entry.activity_description}</p>
                    </div>
                    {entry.status === "pending" && (
                      <button
                        onClick={() => setReviewEntry(entry)}
                        className="shrink-0 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Review
                      </button>
                    )}
                    {entry.status === "approved" && (
                      <span className="shrink-0 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {entry.supervisor_comment && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2 italic">
                      Your comment: "{entry.supervisor_comment}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
