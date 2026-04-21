import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "../context/AuthContext";
import { apiService, StudentDashboard as StudentDashboardData, LogEntry } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white/60">SIWES Progress</span>
        <span className="font-semibold text-white">{pct}% Complete</span>
      </div>
      <div className="h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-sidebar-primary rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/50 mt-1">
        <span>{value} weeks logged</span>
        <span>{max} weeks total</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [recentEntries, setRecentEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats
      const dashResponse = await apiService.getStudentDashboard();
      setDashboard(dashResponse.data);

      // We can use the recent entries from the dashboard response
      if (dashResponse.data.recentEntries) {
        setRecentEntries(dashResponse.data.recentEntries);
      } else {
        // Fallback to separate fetch if needed
        const entriesResponse = await apiService.listLogEntries({ page: 1, limit: 5 });
        setRecentEntries(entriesResponse.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      // Refresh dashboard to get updated notifications
      fetchDashboard();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Please log in to view your dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="font-semibold text-red-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  // Extract stats from dashboard
  const totalEntries = dashboard.stats.total || 0;
  const approved = dashboard.stats.approved || 0;
  const pending = dashboard.stats.pending || 0;
  const rejected = dashboard.stats.rejected || 0;
  const draft = dashboard.stats.draft || 0;
  const submitted = totalEntries - draft;
  
  // Calculate weeks logged (assuming 2 entries per week on average)
  const weeksLogged = Math.round(submitted / 2) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome banner */}
      <div className="bg-sidebar rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Welcome back, {user?.name.split(" ")[0]}!</h1>
            <p className="text-white/60 text-sm mt-1">{user?.department} • {user?.matric_number}</p>
          </div>
          <Link
            href="/log/new"
            className="inline-flex items-center gap-2 bg-sidebar-primary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-sidebar-primary/80 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Log Entry
          </Link>
        </div>
        <div className="mt-6">
          <ProgressBar value={weeksLogged} max={24} />
        </div>
      </div>

      {/* Unread Notifications */}
      {dashboard.unreadNotifications?.items && dashboard.unreadNotifications.items.length > 0 && (
        <div className="space-y-3">
          {dashboard.unreadNotifications.items.map((notif: any) => (
            <div key={notif.id} className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center mt-0.5">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">{notif.title}</h3>
                <p className="text-sm text-foreground/80 mt-1">{notif.message}</p>
                <div className="text-[10px] text-muted-foreground mt-2 uppercase font-semibold">
                  {new Date(notif.created_at).toLocaleString()}
                </div>
              </div>
              <button 
                onClick={() => handleMarkAsRead(notif.id)}
                className="text-xs bg-background text-primary px-3 py-1.5 rounded-lg border border-primary/20 font-semibold hover:bg-primary hover:text-white transition-colors flex-shrink-0 whitespace-nowrap"
              >
                Mark as read
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Entries"
          value={totalEntries}
          color="bg-blue-100 text-blue-700"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Approved"
          value={approved}
          color="bg-green-100 text-green-700"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
        />
        <StatCard
          label="Pending"
          value={pending}
          color="bg-yellow-100 text-yellow-700"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Rejected"
          value={rejected}
          color="bg-red-100 text-red-700"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
        />
      </div>

      {/* Supervisor info from user object fallback */}
      {user?.supervisor_name && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-3">Your Supervisor</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{user.supervisor_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
            </div>
            <div>
              <div className="font-medium text-foreground">{user.supervisor_name}</div>
              <div className="text-sm text-muted-foreground">Assigned Supervisor</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Log Entries</h2>
          <Link href="/logbook" className="text-sm text-primary hover:underline font-medium">View all</Link>
        </div>
        {recentEntries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No log entries yet.</p>
            <Link href="/log/new" className="mt-2 inline-block text-sm text-primary hover:underline">Create your first entry</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentEntries.map(entry => (
              <Link
                key={entry.id}
                href={`/log/${entry.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">Week {entry.week_number}</span>
                    <StatusBadge status={entry.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.activity_description?.slice(0, 80) || "No description"}...</p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 text-right">
                  <div>{formatDate(entry.date)}</div>
                  {entry.files && entry.files.length > 0 && (
                    <div className="mt-1 text-muted-foreground/70">{entry.files.length} file{entry.files.length > 1 ? "s" : ""}</div>
                  )}
                </div>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick tips */}
      {draft > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">You have {draft} draft{draft > 1 ? "s" : ""} pending submission</p>
            <p className="text-xs text-yellow-700 mt-0.5">Don't forget to submit your drafts for supervisor review.</p>
            <Link href="/logbook" className="text-xs text-yellow-800 font-semibold hover:underline mt-1 inline-block">View drafts</Link>
          </div>
        </div>
      )}
      {rejected > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">{rejected} entr{rejected > 1 ? "ies" : "y"} rejected — please revise and resubmit</p>
            <p className="text-xs text-red-700 mt-0.5">Check the supervisor's feedback and update your entries.</p>
            <Link href="/logbook" className="text-xs text-red-800 font-semibold hover:underline mt-1 inline-block">Review now</Link>
          </div>
        </div>
      )}
    </div>
  );
}
