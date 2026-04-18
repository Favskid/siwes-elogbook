import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { useError } from "../hooks/useError";
import ErrorAlert from "../components/ErrorAlert";
import { apiService, CreateLogEntryRequest } from "../services/api";

function today() {
  return new Date().toISOString().split("T")[0];
}

function currentWeek() {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const diff = new Date().getTime() - start.getTime();
  return Math.ceil(diff / (7 * 86400000));
}

export default function CreateLogEntry() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    date: today(),
    week_number: currentWeek(),
    activity_description: "",
    tools_equipment: "",
    skills_acquired: "",
    challenges_faced: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const { error, message, handleError, clearError } = useError();

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (isSaveDraft: boolean) => async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);

    try {
      // Validate form manually against absolutely minimal requirements only
      if (form.activity_description.trim().length < 5) {
        handleError({
          response: {
            status: 400,
            data: { error: "ENTRY_DESCRIPTION_TOO_SHORT", message: "Activity description is required" },
          },
        } as any);
        setSubmitting(false);
        return;
      }

      // Prepare request data
      const requestData: CreateLogEntryRequest = {
        date: form.date,
        week_number: Number(form.week_number),
        activity_description: form.activity_description,
        tools_equipment: form.tools_equipment,
        skills_acquired: form.skills_acquired,
        challenges_faced: form.challenges_faced,
      };

      // Create log entry via API
      const createdEntry = await apiService.createLogEntry(requestData);

      // If requested, submit for approval immediately
      if (!isSaveDraft && createdEntry?.id) {
        await apiService.submitLogEntry(createdEntry.id);
      }

      setSubmitting(false);
      navigate(`/logbook`);
    } catch (err: any) {
      handleError(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Create Log Entry</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Document your daily industrial training activities</p>
      </div>

      <form className="space-y-5">
        {/* Date + Week */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4 text-sm">Entry Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set("date", e.target.value)}
                max={today()}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Week Number</label>
              <select
                value={form.week_number}
                onChange={e => set("week_number", Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Activity description */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4 text-sm">Activity Description</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                What did you do today? <span className="text-destructive">*</span>
              </label>
              <textarea
                value={form.activity_description}
                onChange={e => set("activity_description", e.target.value)}
                placeholder="Describe your activities in detail. Include the tasks you performed, the processes involved, and any outcomes..."
                rows={6}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Tools & Equipment Used</label>
              <textarea
                value={form.tools_equipment}
                onChange={e => set("tools_equipment", e.target.value)}
                placeholder="List the tools, software, equipment, or machines you used (e.g., AutoCAD, MATLAB, oscilloscope, lathe machine)..."
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Skills Acquired</label>
              <textarea
                value={form.skills_acquired}
                onChange={e => set("skills_acquired", e.target.value)}
                placeholder="What new skills, knowledge or competencies did you gain from this activity?..."
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Challenges Faced</label>
              <textarea
                value={form.challenges_faced}
                onChange={e => set("challenges_faced", e.target.value)}
                placeholder="Describe any difficulties, obstacles, or challenges you encountered and how you addressed them..."
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {error && (
          <ErrorAlert
            message={message}
            onDismiss={clearError}
            variant="error"
          />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate("/logbook")}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex-1 flex gap-3">
            <button
              type="button"
              onClick={handleSubmit(true)}
              disabled={submitting || !form.activity_description}
              className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmit(false)}
              disabled={submitting || !form.activity_description}
              className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : "Submit for Approval"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
