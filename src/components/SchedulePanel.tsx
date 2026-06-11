import React, { useState } from "react";
import { Plus, Trash2, Calendar, ClipboardList, CheckSquare, Sparkles, RefreshCw, KeyRound, Clock3 } from "lucide-react";
import { Task } from "../types";

// Unified calendar event structure
export interface CalendarNodeEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // formatted human or ISO string
  end: string;
}

interface SchedulePanelProps {
  // Local Agenda State
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAnalyzeSchedule: (source: "local" | "google") => void;
  isAnalyzing: boolean;

  // Google Calendar Integration
  googleUser: any;
  googleAccessToken: string | null;
  calendarEvents: any[];
  isLoadingCalendar: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefreshCalendar: () => void;
  onAddCalendarEvent: (event: {
    summary: string;
    description: string;
    startTimeIso: string;
    endTimeIso: string;
    location?: string;
  }) => Promise<boolean>;
  onDeleteCalendarEvent: (eventId: string) => Promise<boolean>;
}

export default function SchedulePanel({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTask,
  onAnalyzeSchedule,
  isAnalyzing,
  googleUser,
  googleAccessToken,
  calendarEvents,
  isLoadingCalendar,
  onSignIn,
  onSignOut,
  onRefreshCalendar,
  onAddCalendarEvent,
  onDeleteCalendarEvent,
}: SchedulePanelProps) {
  // Tabs: "local" or "google"
  const [activeTab, setActiveTab] = useState<"local" | "google">("local");

  // Local Form state
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTime, setNewTime] = useState("");

  // Google Calendar Form state
  const [gSummary, setGSummary] = useState("");
  const [gDescription, setGDescription] = useState("");
  const [gDate, setGDate] = useState("");
  const [gStartTime, setGStartTime] = useState("");
  const [gEndTime, setGEndTime] = useState("");
  const [isSchedulingGoogle, setIsSchedulingGoogle] = useState(false);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      priority: newPriority,
      time: newTime || "All Day",
    });
    setNewTitle("");
    setNewTime("");
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gSummary.trim() || !gDate || !gStartTime || !gEndTime) {
      alert("Boss, please specify all calendar fields (Title, Date, Start, and End times).");
      return;
    }

    setIsSchedulingGoogle(true);
    try {
      // Assemble full ISO format with timezone offset
      // Since localized timezone differs, standard string parse 'YYYY-MM-DDTHH:mm:00' is perfect
      const startIso = `${gDate}T${gStartTime}:00`;
      const endIso = `${gDate}T${gEndTime}:00`;

      const success = await onAddCalendarEvent({
        summary: gSummary.trim(),
        description: gDescription.trim(),
        startTimeIso: startIso,
        endTimeIso: endIso,
      });

      if (success) {
        setGSummary("");
        setGDescription("");
        setGStartTime("");
        setGEndTime("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSchedulingGoogle(false);
    }
  };

  // Safe Google Event deletion handler
  const handleConfirmDeleteGoogleEvent = async (eventId: string, summary: string) => {
    const doubleCheck = window.confirm(
      `Are you sure you want to delete this event "${summary}" from your Google Calendar? This action cannot be undone.`
    );
    if (doubleCheck) {
      await onDeleteCalendarEvent(eventId);
    }
  };

  // Helper properties to parse google event timestamps
  const formatGoogleTime = (gEvent: any) => {
    const startObj = gEvent.start?.dateTime || gEvent.start?.date;
    if (!startObj) return "All Day";
    const dateObj = new Date(startObj);
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) + " hrs";
  };

  return (
    <div className="p-5 bg-slate-950/20 border border-cyan-500/10 rounded-2xl relative overflow-hidden backdrop-blur-xl flex flex-col h-full justify-between min-h-[460px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/10 mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            <span className="font-display font-medium text-slate-100 tracking-wide text-sm">Executive Agenda</span>
          </div>
          {activeTab === "local" ? (
            <span className="text-[10px] font-mono bg-cyan-950/40 text-cyan-400 py-0.5 px-2 rounded-full border border-cyan-500/20">
              {tasks.filter((t) => t.completed).length}/{tasks.length} SECURED
            </span>
          ) : (
            <span className="text-[10px] font-mono bg-teal-950/40 text-teal-400 py-0.5 px-2 rounded-full border border-teal-500/25 uppercase">
              {googleUser ? "Node Online" : "Node Locked"}
            </span>
          )}
        </div>

        {/* Tab Selectors */}
        <div className="grid grid-cols-2 gap-1.5 mb-4 select-none">
          <button
            onClick={() => setActiveTab("local")}
            className={`py-1.5 text-[10px] font-mono tracking-widest uppercase border rounded-xl transition-all ${
              activeTab === "local"
                ? "bg-cyan-950/30 text-cyan-400 border-cyan-500/30 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                : "bg-slate-900/10 text-slate-500 border-transparent hover:text-slate-350"
            }`}
          >
            Local Grid
          </button>
          <button
            onClick={() => setActiveTab("google")}
            className={`py-1.5 text-[10px] font-mono tracking-widest uppercase border rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "google"
                ? "bg-teal-950/30 text-teal-400 border-teal-500/30 font-bold shadow-[0_0_8px_rgba(20,184,166,0.1)]"
                : "bg-slate-900/10 text-slate-500 border-transparent hover:text-slate-350"
            }`}
          >
            Calendar Node
          </button>
        </div>

        {/* CONTENT CHANGER */}
        {activeTab === "local" ? (
          <div>
            {/* Local Agenda Form */}
            <form onSubmit={handleLocalSubmit} className="space-y-2 mb-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add new directive or scheduling block..."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/40"
                >
                  <option value="high" className="bg-slate-950 text-slate-300">High Priority</option>
                  <option value="medium" className="bg-slate-950 text-slate-300">Medium Priority</option>
                  <option value="low" className="bg-slate-950 text-slate-300">Low Priority</option>
                </select>

                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 0900 hrs, 2 PM"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              <button
                type="submit"
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold rounded-xl transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Inject Directive
              </button>
            </form>

            {/* Local Tasks List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto hud-scrollbar pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  Agenda is empty, boss. All clear for incoming targets.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      task.completed
                        ? "bg-slate-950/40 border-slate-900/60 opacity-60"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-cyan-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        <CheckSquare
                          className={`w-4 h-4 ${task.completed ? "text-cyan-500 fill-cyan-500/20" : "text-slate-600"}`}
                        />
                      </button>
                      <div className="overflow-hidden">
                        <p className={`text-xs font-medium text-slate-200 truncate ${task.completed ? "line-through text-slate-500" : ""}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[9px]">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {task.time}
                          </span>
                          <span
                            className={`font-semibold uppercase tracking-wider px-1 bg-slate-950/80 rounded ${
                              task.priority === "high"
                                ? "text-red-400 border border-red-950"
                                : task.priority === "medium"
                                ? "text-amber-400 border border-amber-950"
                                : "text-slate-400 border border-slate-950"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* GOOGLE CALENDAR TAB */
          <div className="space-y-3">
            {!googleUser ? (
              /* If offline, offer high-quality authentic login card */
              <div className="p-4 border border-teal-500/20 bg-teal-950/10 rounded-xl flex flex-col items-center text-center space-y-3.5 my-2">
                <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-500/35 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                  <KeyRound className="w-5 h-5 text-teal-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Calendar Node Locked</h4>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[200px]">
                    Google Workspace API requires secure credential authentication to read or sync calendar events.
                  </p>
                </div>
                <button
                  onClick={onSignIn}
                  className="w-full py-1.5 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 hover:border-teal-500 text-teal-300 font-mono text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all cursor-pointer"
                >
                  Authorize Uplink
                </button>
              </div>
            ) : (
              /* If signed in, show interactive events list and creation form */
              <div className="space-y-3">
                {/* Account info header */}
                <div className="flex items-center justify-between text-[9px] font-mono bg-teal-950/20 border border-teal-500/20 px-2.5 py-1.5 rounded-lg">
                  <span className="text-teal-400 truncate max-w-[130px]">{googleUser.email}</span>
                  <button
                    onClick={onSignOut}
                    className="text-slate-500 hover:text-red-400 font-bold uppercase transition-colors italic cursor-pointer shrink-0 ml-1"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Google Schedule Event Creation */}
                <form onSubmit={handleGoogleSubmit} className="space-y-1.5 p-2 rounded-xl border border-slate-800/80 bg-slate-900/10">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Schedule google event block
                  </span>
                  
                  <input
                    type="text"
                    value={gSummary}
                    onChange={(e) => setGSummary(e.target.value)}
                    placeholder="Event Title..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-teal-500/40"
                  />

                  <input
                    type="text"
                    value={gDescription}
                    onChange={(e) => setGDescription(e.target.value)}
                    placeholder="Description / Notes (Optional)..."
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500/40"
                  />

                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="date"
                      value={gDate}
                      onChange={(e) => setGDate(e.target.value)}
                      className="bg-slate-900/85 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-200 focus:outline-none focus:border-teal-500/40 col-span-1.5"
                    />
                    <input
                      type="time"
                      value={gStartTime}
                      onChange={(e) => setGStartTime(e.target.value)}
                      title="Start Time"
                      className="bg-slate-900/85 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-200 focus:outline-none focus:border-teal-500/40"
                    />
                    <input
                      type="time"
                      value={gEndTime}
                      onChange={(e) => setGEndTime(e.target.value)}
                      title="End Time"
                      className="bg-slate-900/85 border border-slate-800 rounded-lg p-1 text-[10px] text-slate-200 focus:outline-none focus:border-teal-500/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSchedulingGoogle}
                    className="w-full py-1 flex items-center justify-center gap-1 bg-teal-950/40 hover:bg-teal-900/40 border border-teal-500/30 text-teal-300 font-mono text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {isSchedulingGoogle ? "Injecting Node..." : "Inject Block"}
                  </button>
                </form>

                {/* Calendar entries list */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                      Incoming Events Stream
                    </span>
                    <button
                      onClick={onRefreshCalendar}
                      disabled={isLoadingCalendar}
                      className="text-slate-500 hover:text-teal-400 transition-colors"
                      title="Refresh Calendar Node"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCalendar ? "animate-spin text-teal-400" : ""}`} />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto hud-scrollbar pr-1">
                    {isLoadingCalendar && calendarEvents.length === 0 ? (
                      <div className="text-center py-4 text-xs font-mono text-teal-500/60">
                        Synchronizing active uplink streams...
                      </div>
                    ) : calendarEvents.length === 0 ? (
                      <div className="text-center py-4 text-xs font-mono text-slate-600">
                        No events found in secondary buffer.
                      </div>
                    ) : (
                      calendarEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-teal-950 bg-teal-950/5 hover:border-teal-500/20 transition-all group"
                        >
                          <div className="overflow-hidden pr-2">
                            <p className="text-xs font-semibold text-slate-200 truncate pr-1">
                              {evt.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-slate-400">
                              <span className="flex items-center gap-0.5 text-teal-500">
                                <Clock3 className="w-2.5 h-2.5 shrink-0" />
                                {formatGoogleTime(evt)}
                              </span>
                              {evt.start?.dateTime && (
                                <span className="opacity-70 text-[8px]">
                                  {new Date(evt.start.dateTime).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleConfirmDeleteGoogleEvent(evt.id, evt.summary)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete event from Google Calendar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced diagnostics sync bottom button */}
      {((activeTab === "local" && tasks.length > 0) || (activeTab === "google" && googleUser && calendarEvents.length > 0)) && (
        <button
          onClick={() => onAnalyzeSchedule(activeTab)}
          disabled={isAnalyzing}
          className="mt-4 w-full h-10 flex items-center justify-center gap-2 bg-slate-900 border border-cyan-400/30 hover:border-cyan-400/60 rounded-xl text-xs font-mono font-medium text-cyan-300 hover:text-cyan-200 hover:bg-slate-850 transition-all shadow-[0_0_15px_rgba(6,182,212,0.05)] disabled:opacity-50 cursor-pointer select-none"
        >
          <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-spin text-amber-400" : "text-cyan-400 animate-pulse"}`} />
          {isAnalyzing ? "Max is diagnosticating..." : "Execute Tactical Plan"}
        </button>
      )}
    </div>
  );
}
