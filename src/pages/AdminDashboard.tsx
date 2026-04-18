import { useEffect, useState } from "react";
import { apiService, LogEntry, AdminDashboard as AdminDashboardData } from "../services/api";

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [recentEntries, setRecentEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats
      const dashResponse = await apiService.getAdminDashboard();
      setDashboard(dashResponse.dashboard);

      // Fetch recent entries
      const entriesResponse = await apiService.getAllLogEntries({ page: 1, limit: 6 });
      setRecentEntries(entriesResponse.data || []);
    } catch (err: any) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
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
      <div className="max-w-6xl mx-auto space-y-6">
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

  if (!dashboard) {
    return null;
  }

  const stats = dashboard;
  const approvalRate = stats.total_entries > 0 ? Math.round((stats.approved_entries / stats.total_entries) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">SIWES E-Logbook System Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: stats.total_students.toString(), sub: "Registered in system", color: "bg-blue-100 text-blue-700" },
          { label: "Log Entries", value: stats.total_entries.toString(), sub: `${approvalRate}% approved`, color: "bg-green-100 text-green-700" },
          { label: "Pending Review", value: stats.pending_entries.toString(), sub: "Awaiting approval", color: "bg-yellow-100 text-yellow-700" },
          { label: "Supervisors", value: stats.total_supervisors.toString(), sub: "Active supervisors", color: "bg-purple-100 text-purple-700" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-xl p-5">
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm font-medium text-foreground mt-1">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Entry Status Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "Approved", value: stats.approved_entries, total: stats.total_entries, color: "bg-green-500" },
              { label: "Pending", value: stats.pending_entries, total: stats.total_entries, color: "bg-yellow-500" },
              { label: "Rejected", value: stats.rejected_entries, total: stats.total_entries, color: "bg-red-500" },
              { label: "Drafts", value: stats.total_entries - stats.approved_entries - stats.pending_entries - stats.rejected_entries, total: stats.total_entries, color: "bg-gray-400" },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{s.label}</span>
                  <span className="text-muted-foreground">{s.value} ({stats.total_entries > 0 ? Math.round((s.value / s.total) * 100) : 0}%)</span>
                </div>
                <MiniBar value={s.value} max={Math.max(s.total, 1)} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Users overview */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">System Overview</h2>
          <div className="space-y-3">
            {[
              { label: "Total Users", value: stats.total_users, icon: "👥" },
              { label: "Active Today", value: stats.active_users_today, icon: "🟢" },
              { label: "Supervisors", value: stats.total_supervisors, icon: "👨‍🏫" },
              { label: "Students", value: stats.total_students, icon: "👨‍🎓" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {recentEntries.length > 0 ? (
            recentEntries.map(e => {
              // Get initials for avatar
              const initials = "SE";

              return (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Student Entry</p>
                    <p className="text-xs text-muted-foreground">Week {e.week_number} — {(e.activity_description || "No description").slice(0, 50)}...</p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(e.status)}`}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-muted-foreground text-sm">No entries yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
