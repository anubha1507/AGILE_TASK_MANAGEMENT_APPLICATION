import { useState, useRef, useEffect } from "react";
import { User, Users, Shield, Bell, Key, Plus, Trash2, Upload, Loader2, X, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  invited_by?: string;
  created_at?: string;
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1609371497456-3a55a205d5eb?w=100&h=100&fit=crop&crop=faces");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviting, setInviting] = useState(false);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error && error.code !== "PGRST116") throw error;
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || user.email || "");
          setBio(data.bio || "");
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        } else {
          setEmail(user.email || "");
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
      }
    }
    loadProfile();
  }, []);

  // Load team members when team tab is active
  useEffect(() => {
    if (activeTab === "team") {
      fetchTeamMembers();
    }
  }, [activeTab]);

  const fetchTeamMembers = async () => {
    setTeamLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err: any) {
      toast.error("Failed to load team: " + err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const updates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        bio: bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error("Error updating profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Check if already invited
      const existing = teamMembers.find((m) => m.email === inviteEmail);
      if (existing) {
        toast.error("This member has already been invited.");
        return;
      }

      const newMember = {
        email: inviteEmail,
        name: inviteName || inviteEmail.split("@")[0],
        role: inviteRole,
        invited_by: user.id,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${inviteName || inviteEmail}`,
      };

      const { error } = await supabase.from("team_members").insert([newMember]);
      if (error) throw error;

      // Send the actual invite email via Supabase Edge Function
      const { error: inviteError } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail }
      });

      if (inviteError) {
        console.error("Invite email send failed:", inviteError);
        toast.warning("Member added, but failed to send Gmail invite. You can share the link manually.");
      } else {
        toast.success(`${inviteName || inviteEmail} has been invited! An email was sent.`);
      }

      setShowInviteModal(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("Member");
      fetchTeamMembers();
    } catch (err: any) {
      toast.error("Error inviting member: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Role updated!");
      fetchTeamMembers();
    } catch (err: any) {
      toast.error("Error updating role: " + err.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      toast.success("Member removed.");
      fetchTeamMembers();
    } catch (err: any) {
      toast.error("Error removing member: " + err.message);
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }

      setUploadingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded! Save your profile to apply changes.");
    } catch (error: any) {
      toast.error("Error uploading avatar: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "team", name: "Team Members", icon: Users },
    { id: "roles", name: "Roles & Permissions", icon: Shield },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "security", name: "Security", icon: Key },
  ];

  const getRoleBadgeClass = (role: string) => {
    if (role === "Owner") return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    if (role === "Admin") return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    return "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-white dark:bg-[#161618] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold mb-6">Profile Settings</h2>
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="w-20 h-20 border border-neutral-200 dark:border-neutral-800">
                <AvatarImage src={avatarUrl} alt="User Avatar" className="object-cover" />
                <AvatarFallback className="bg-neutral-100 dark:bg-neutral-800 text-xl font-bold">
                  {firstName ? firstName[0] : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" disabled={uploadingAvatar} />
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors mb-2 flex items-center gap-2 disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                  {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                </button>
                <p className="text-xs text-neutral-500">JPG, GIF or PNG. 2MB max.</p>
              </div>
            </div>
            <form className="space-y-5 max-w-lg" onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Carter" className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@agileflow.app" className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Product Lead building awesome tools." className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all resize-none"></textarea>
              </div>
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                <button type="submit" disabled={saving} className="flex items-center justify-center min-w-[120px] bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab === "team" && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Team Members</h2>
                <p className="text-sm text-neutral-500">Manage who has access to this workspace.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-4 h-4" /> Invite Member
              </button>
            </div>

            {teamLoading ? (
              <div className="flex items-center justify-center py-12 text-neutral-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading team...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mb-3" />
                <p className="text-sm font-medium text-neutral-500 mb-1">No team members yet</p>
                <p className="text-xs text-neutral-400">Click "Invite Member" to add your first team member.</p>
              </div>
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                {teamMembers.map((member, i) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${i !== teamMembers.length - 1 ? "border-b border-neutral-200 dark:border-neutral-800" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100"
                      />
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-neutral-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeClass(member.role)}`}>
                        {member.role}
                      </span>
                      {member.role !== "Owner" && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeRole(member.id, e.target.value)}
                            className="text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other tabs */}
        {["roles", "notifications", "security"].includes(activeTab) && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center h-64">
            <h3 className="text-lg font-medium mb-2 capitalize">{activeTab} Settings</h3>
            <p className="text-sm text-neutral-500 max-w-sm">This section is currently under development. Please check back later.</p>
          </div>
        )}
      </div>

      {/* ── INVITE MEMBER MODAL ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h2 className="text-lg font-bold">Invite Team Member</h2>
                <p className="text-sm text-neutral-500">Add a new member to your workspace.</p>
              </div>
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail(""); setInviteName(""); setInviteRole("Member"); }}
                className="p-2 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(""); setInviteName(""); setInviteRole("Member"); }}
                  className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4" /> Send Invite</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
