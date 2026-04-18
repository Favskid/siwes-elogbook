import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { apiService, LogEntry } from "../services/api";
import StatusBadge from "../components/StatusBadge";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_FILTERS: { value: "draft" | "pending" | "approved" | "rejected" | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
];

export default function MyLogbook() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"draft" | "pending" | "approved" | "rejected" | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEntries();
  }, [page, filter]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.listLogEntries({
        page,
        limit: 10,
        status: filter !== "all" ? filter : undefined,
      });

      setEntries(response.data);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Failed to fetch entries:', err);
      setError(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-900">Please log in to view your logbook</p>
        </div>
      </div>
    );
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.activity_description.toLowerCase().includes(search.toLowerCase()) ||
      e.week_number.toString().includes(search) || e.date.includes(search);
    return matchSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Logbook</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{entries.length} total entries</p>
        </div>
        <Link
          href="/log/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading entries...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No entries found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-[1fr_80px_140px_140px_100px] gap-4 px-5 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div>Activity / Description</div>
              <div>Week</div>
              <div>Date</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-border">
              {filtered.map(entry => (
                <div
                  key={entry.id}
                  className="grid md:grid-cols-[1fr_80px_140px_140px_100px] gap-2 md:gap-4 px-5 py-4 hover:bg-muted/30 transition-colors items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground font-medium truncate max-w-xs">{entry.activity_description.slice(0, 60)}{entry.activity_description.length > 60 ? "..." : ""}</p>
                    {entry.files && entry.files.length > 0 && (
                      <span className="text-xs text-muted-foreground">{entry.files.length} attachment{entry.files.length > 1 ? "s" : ""}</span>
                    )}
                    {/* Mobile info */}
                    <div className="md:hidden flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Week {entry.week_number}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                      <StatusBadge status={entry.status as any} />
                    </div>
                  </div>
                  <div className="hidden md:block text-sm text-foreground font-medium">Week {entry.week_number}</div>
                  <div className="hidden md:block text-sm text-muted-foreground">{formatDate(entry.date)}</div>
                  <div className="hidden md:block"><StatusBadge status={entry.status as any} /></div>
                  <div className="flex items-center gap-2 md:justify-start">
                    <button
                      onClick={() => navigate(`/log/${entry.id}`)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View
                    </button>
                    {(entry.status === "draft" || entry.status === "rejected") && (
                      <button
                        onClick={() => navigate(`/log/${entry.id}/edit`)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
