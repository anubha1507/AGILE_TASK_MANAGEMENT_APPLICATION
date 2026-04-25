import { 
  Users, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Loader2,
  User as UserIcon,
  Plus,
  X,
  Mail,
  Briefcase,
  UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

// ─── Add Member Modal ─────────────────────────────────────────────────────────
interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (member: any) => void;
  creatorId: string;
}

function AddMemberModal({ open, onClose, onCreated, creatorId }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [work, setWork] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(""); setEmail(""); setWork(""); }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Member name is required"); return; }

    setSaving(true);
    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      work: work.trim() || null,
      created_by: creatorId,
    };

    let { data, error } = await supabase
      .from("manual_members")
      .insert(payload)
      .select()
      .single();

    // If there's a foreign key error because the user's profile is missing, retry without created_by
    if (error && error.code === '23503') {
      const fallbackPayload = { ...payload, created_by: null };
      const retry = await supabase
        .from("manual_members")
        .insert(fallbackPayload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Member added successfully!");
    onCreated(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[#18181b] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-white">Add Team Member</h2>
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
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Full Name <span className="text-blue-500">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Work / Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Work / Role
            </label>
            <input
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

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
              className="flex-1 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TeamMonitoringPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentRole(profile?.role || user.user_metadata?.role || "Member");
      }
    } catch (e) {
      console.error(e);
    } finally {
      await fetchTeamMembers();
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);

      // 1. Fetch authenticated profiles
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*");

      if (pError) throw pError;

      // 2. Fetch manually added members (created by Team Leader)
      const { data: manualMembers } = await supabase
        .from("manual_members")
        .select("*")
        .order("created_at", { ascending: false });

      // 3. Map profiles robustly
      const fromProfiles = (profiles || []).map((p) => {
        const displayName = p.full_name || (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null) || p.username || "Unknown Member";
        return {
          id: p.id,
          name: displayName,
          email: p.email || p.username || "—",
          role: p.role || "Member",
          work: p.role || "Member",
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
          status: "Active",
          workload: Math.floor(Math.random() * 70) + 10,
          lastActive: "Today",
          source: "auth",
        };
      });

      // 4. Map manual members
      const fromManual = (manualMembers || []).map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email || "—",
        role: "Member",
        work: m.work || "Team Member",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=6366f1`,
        status: "Active",
        workload: 0,
        lastActive: "Added manually",
        source: "manual",
      }));

      setMembers([...fromProfiles, ...fromManual]);
    } catch (error: any) {
      toast.error("Error loading team: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberCreated = (data: any) => {
    const newMember = {
      id: data.id,
      name: data.name,
      email: data.email || "—",
      role: "Member",
      work: data.work || "Team Member",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=6366f1`,
      status: "Active",
      workload: 0,
      lastActive: "Just added",
      source: "manual",
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.work.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTeamLeader = currentRole === "Team Leader";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-20">
      {/* Add Member Modal — Team Leader only */}
      {isTeamLeader && (
        <AddMemberModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={handleMemberCreated}
          creatorId={currentUserId}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-1">User Monitoring</h1>
          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400">
            Track team workload, task history, and real-time activity.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Search */}
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 md:py-2 text-sm bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 min-h-[44px] md:min-h-0"
            />
          </div>
          {/* Refresh */}
          <button
            onClick={fetchTeamMembers}
            className="p-3 md:p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh"
          >
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* Add Member — Team Leader only */}
          {isTeamLeader && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/25 whitespace-nowrap min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">Total Members</p>
                <h3 className="text-2xl font-bold">{members.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">Active Now</p>
                <h3 className="text-2xl font-bold">{members.filter((m) => m.status === "Active").length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium">Issues Detected</p>
                <h3 className="text-2xl font-bold">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Syncing team data...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
            <UserIcon className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">
              {members.length === 0
                ? "No members found in this workspace."
                : "No members match your search."}
            </p>
            {isTeamLeader && members.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Member</th>
                  <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Work / Role</th>
                  <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Workload</th>
                  <th className="px-6 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">Last Active</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-neutral-100 dark:border-neutral-800">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name?.[0] ?? "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{member.name}</p>
                          <p className="text-xs text-neutral-500 font-medium">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                        {member.work}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          member.status === "Active"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              member.workload > 80
                                ? "bg-red-500"
                                : member.workload > 50
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${member.workload}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-500">{member.workload}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 font-medium">
                      {member.lastActive}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 transition-colors" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
