import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle2, Circle, Clock,
  Loader2, ListTodo, Plus, Flag, AlignLeft, X
} from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id?: string;
  projects?: { name: string };
}

interface Project {
  id: string;
  name: string;
}

// ─── Priority config ─────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: "low",    label: "Low",    color: "text-green-500",  bg: "bg-green-500/10" },
  { value: "medium", label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { value: "high",   label: "High",   color: "text-red-500",    bg: "bg-red-500/10" },
];

// ─── New Task Modal ───────────────────────────────────────────────────────────
interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
  projects: Project[];
  userId: string;
}

function NewTaskModal({ open, onClose, onCreated, projects, userId }: NewTaskModalProps) {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate]   = useState("");
  const [projectId, setProject] = useState("");
  const [saving, setSaving]     = useState(false);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setTitle(""); setDesc(""); setPriority("medium");
      setDueDate(""); setProject(projects[0]?.id ?? "");
    }
  }, [open, projects]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Task title is required"); return; }
    if (!projectId) { toast.error("Please select a project"); return; }

    setSaving(true);
    
    // Fetch the "To Do" list for this project
    const { data: listData, error: listError } = await supabase
      .from("project_lists")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", "To Do")
      .single();

    if (listError) {
      toast.error("Could not find To Do list for this project");
      setSaving(false);
      return;
    }
    const payload: Record<string, unknown> = {
      title:       title.trim(),
      description: description.trim() || null,
      status:      "todo",
      priority,
      assignee_id: userId,
      project_id:  projectId,
      list_id:     listData.id,
      due_date:    dueDate   || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select("*, projects:project_id(name)")
      .single();

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Task created!");
    onCreated(data as Task);
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="w-full max-w-md bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Plus className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-base font-semibold text-white">New Task</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Task Title <span className="text-amber-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix login page bug"
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional details about this task…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none"
            />
          </div>

          {/* Priority + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all border",
                      priority === p.value
                        ? `${p.bg} ${p.color} border-current`
                        : "bg-neutral-900 text-neutral-500 border-neutral-700 hover:border-neutral-500"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              />
            </div>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
              >
                <option value="" disabled>— Select a project —</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm font-semibold hover:bg-neutral-800 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function MemberDashboard() {
  const [loading, setLoading]     = useState(true);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [userId, setUserId]       = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch tasks assigned to user
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*, projects:project_id(name)")
          .eq("assignee_id", user.id)
          .order("created_at", { ascending: false });
        setTasks(taskData || []);

        // Fetch available projects
        const { data: projData } = await supabase
          .from("projects")
          .select("id, name")
          .order("name");
        setProjects(projData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
      toast.success(newStatus === "done" ? "Task completed! 🎉" : "Task reopened");
    }
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const priorityConfig = (p: string) =>
    PRIORITIES.find((x) => x.value === p) ?? PRIORITIES[1];

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );

  const openCount     = tasks.filter((t) => t.status !== "done").length;
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const focusScore    = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 84;

  return (
    <>
      {/* New Task Modal */}
      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleTaskCreated}
        projects={projects}
        userId={userId}
      />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">
              My Workspace
            </h1>
            <p className="text-sm text-neutral-500">Focus on your assigned tasks for today.</p>
          </div>
          <div className="flex w-full md:w-auto">
            <button
              onClick={() => setModalOpen(true)}
              className="flex w-full items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-500/20 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center">
            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Open Tasks</p>
            <p className="text-xl md:text-2xl font-bold">{openCount}</p>
          </div>
          <div className="bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center">
            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Completed</p>
            <p className="text-xl md:text-2xl font-bold text-green-500">{completedCount}</p>
          </div>
          <div className="col-span-2 md:col-span-1 bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center">
            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Focus Score</p>
            <p className="text-xl md:text-2xl font-bold text-amber-500">{focusScore}%</p>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white dark:bg-[#161618] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-inherit flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
              <ListTodo className="w-4 h-4 text-amber-500" /> Active Tasks
            </h3>
            {tasks.length > 0 && (
              <span className="text-xs text-neutral-400 font-medium">{tasks.length} total</span>
            )}
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {tasks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <ListTodo className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-neutral-500 text-sm font-medium">No tasks assigned yet.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="text-amber-500 text-xs font-bold hover:underline"
                >
                  + Create your first task
                </button>
              </div>
            ) : (
              tasks.map((t) => {
                const pc = priorityConfig(t.priority);
                return (
                  <div
                    key={t.id}
                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors flex items-center gap-3 md:gap-4 group active:bg-neutral-100 dark:active:bg-neutral-800"
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleTask(t.id, t.status)}
                      className="shrink-0 transition-transform active:scale-90 p-1 md:p-0"
                    >
                      {t.status === "done" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-700 group-hover:text-amber-500 transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs md:text-sm font-medium truncate",
                        t.status === "done"
                          ? "text-neutral-400 line-through"
                          : "text-neutral-900 dark:text-white"
                      )}>
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {t.projects?.name && (
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500 truncate">
                            {t.projects.name}
                          </span>
                        )}
                        <span className={cn(
                          "text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                          pc.bg, pc.color
                        )}>
                          {pc.label}
                        </span>
                      </div>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Clock className="w-3 h-3 text-neutral-400 hidden sm:block" />
                      <span className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase">
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "No date"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
