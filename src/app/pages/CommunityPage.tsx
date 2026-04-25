import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { Send, Hash, Users, MessageSquare, Loader2, Smile, Plus, X, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  channel_id: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string | null;
  } | null;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  "HR":           "bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  "Manager":      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  "Team Leader":  "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  "Member":       "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  "Admin":        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  "Viewer":       "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
};

function getRoleBadge(role: string | null) {
  const r = role || "Member";
  const cls = ROLE_COLORS[r] || ROLE_COLORS["Member"];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{r}</span>;
}

function getInitials(profile: Message["profiles"]) {
  if (!profile) return "?";
  const f = profile.first_name?.[0] || "";
  const l = profile.last_name?.[0] || "";
  return (f + l).toUpperCase() || "?";
}

function getDisplayName(profile: Message["profiles"]) {
  if (!profile) return "Unknown";
  const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return name || "Unknown";
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// ─── Create Channel Modal ─────────────────────────────────────────────────────
function CreateChannelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (ch: Channel) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(name);
    if (!slug) { toast.error("Please enter a valid channel name."); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("channels")
      .insert({ name: slug, description: description.trim() || null })
      .select()
      .single();
    setCreating(false);
    if (error) {
      toast.error("Could not create channel: " + error.message);
    } else {
      toast.success(`#${slug} created!`);
      onCreate(data as Channel);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold">Create a Channel</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Channels are where your team communicates.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. design-team"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            {name && (
              <p className="text-xs text-neutral-400">
                Channel will be: <span className="font-semibold text-neutral-600 dark:text-neutral-300">#{slugify(name)}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Community Page ──────────────────────────────────────────────────────
export function CommunityPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [onlineCount] = useState(Math.floor(Math.random() * 4) + 2);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, []);

  // Load channels
  const loadChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("name", { ascending: true });
    if (error) { toast.error("Failed to load channels: " + error.message); return; }
    setChannels(data || []);
    if (data && data.length > 0 && !activeChannel) setActiveChannel(data[0]);
  }, [activeChannel]);

  useEffect(() => { loadChannels(); }, []);   // eslint-disable-line

  // Load messages + realtime subscription
  useEffect(() => {
    if (!activeChannel) return;
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    async function loadMessages() {
      setLoadingMessages(true);
      // Step 1: Fetch messages WITHOUT join
      const { data: msgs, error } = await supabase
        .from("messages")
        .select("id, content, created_at, user_id, channel_id")
        .eq("channel_id", activeChannel!.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) { toast.error("Failed to load messages: " + error.message); setLoadingMessages(false); return; }
      if (!msgs || msgs.length === 0) { setMessages([]); setLoadingMessages(false); return; }

      // Step 2: Batch-fetch profiles for unique user IDs
      const userIds = [...new Set(msgs.map((m: any) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .in("id", userIds);

      // Step 3: Merge
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      const merged = msgs.map((m: any) => ({ ...m, profiles: profileMap[m.user_id] || null }));
      setMessages(merged);
      setLoadingMessages(false);
    }
    loadMessages();

    const realtimeChannel = supabase
      .channel(`messages:${activeChannel.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `channel_id=eq.${activeChannel.id}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Don't add if we already have it (optimistic update)
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, profiles: null }];
        });
        // Enrich with profile in background
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, role")
          .eq("id", newMsg.user_id)
          .single();
        setMessages((prev) =>
          prev.map((m) => m.id === newMsg.id ? { ...m, profiles: profile || null } : m)
        );
      })
      .subscribe();

    subscriptionRef.current = realtimeChannel;
    return () => { if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current); };
  }, [activeChannel]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !activeChannel || !currentUser) return;

    // Optimistic update — message appears instantly
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      content: text,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      channel_id: activeChannel.id,
      profiles: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    setSending(true);
    // Insert without profile join
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ content: text, channel_id: activeChannel.id, user_id: currentUser.id })
      .select("id, content, created_at, user_id, channel_id")
      .single();

    if (error) {
      toast.error("Failed to send: " + error.message);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } else if (inserted) {
      // Fetch profile and merge
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, role")
        .eq("id", currentUser.id)
        .single();
      const fullMsg = { ...(inserted as any), profiles: profile || null };
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? fullMsg : m))
      );
    }
    setSending(false);
  };

  const handleDeleteChannel = async (ch: Channel) => {
    if (!window.confirm(`Delete #${ch.name}? All messages will be lost.`)) return;
    const { error } = await supabase.from("channels").delete().eq("id", ch.id);
    if (error) { toast.error("Failed to delete: " + error.message); return; }
    toast.success(`#${ch.name} deleted.`);
    setChannels((prev) => prev.filter((c) => c.id !== ch.id));
    if (activeChannel?.id === ch.id) setActiveChannel(null);
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.created_at);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else groupedMessages.push({ date, messages: [msg] });
  });

  return (
    <div className="flex h-full overflow-hidden bg-neutral-50 dark:bg-[#0E0E11]">
      {/* ── Channel Sidebar ───────────────────────── */}
      <div className="w-60 shrink-0 bg-white dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Community Chat
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">{onlineCount} members online</p>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {/* Section label + create button */}
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Channels
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create a channel"
              className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {channels.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <Hash className="w-6 h-6 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
              <p className="text-xs text-neutral-500">No channels yet.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 text-xs font-semibold text-blue-500 hover:underline"
              >
                + Create your first channel
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {channels.map((ch) => (
                <div key={ch.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => setActiveChannel(ch)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      activeChannel?.id === ch.id
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
                        : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(ch)}
                    title="Delete channel"
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-neutral-300 dark:text-neutral-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Channel CTA at bottom */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Channel
          </button>
        </div>
      </div>

      {/* ── Chat Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            {/* Channel Header */}
            <div className="h-14 shrink-0 flex items-center gap-3 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
              <Hash className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="font-semibold text-sm">{activeChannel.name}</p>
                {activeChannel.description && (
                  <p className="text-xs text-neutral-400">{activeChannel.description}</p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <Users className="w-3.5 h-3.5" />
                {onlineCount} online
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <Hash className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Welcome to #{activeChannel.name}!
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    {activeChannel.description || "Be the first to send a message here."}
                  </p>
                </div>
              ) : (
                groupedMessages.map(({ date, messages: dayMsgs }) => (
                  <div key={date}>
                    {/* Date divider */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                      <span className="text-xs font-semibold text-neutral-500 bg-neutral-50 dark:bg-[#0E0E11] px-3">{date}</span>
                      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    <div className="space-y-1">
                      {dayMsgs.map((msg, i) => {
                        const prevMsg = i > 0 ? dayMsgs[i - 1] : null;
                        const isGrouped =
                          prevMsg &&
                          prevMsg.user_id === msg.user_id &&
                          new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000;
                        const isOwn = msg.user_id === currentUser?.id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""} ${isGrouped ? (isOwn ? "mr-12" : "ml-12") : ""}`}
                          >
                            {!isGrouped && !isOwn && (
                              <Avatar className="w-9 h-9 shrink-0 border border-neutral-100 dark:border-neutral-800">
                                <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {getInitials(msg.profiles)}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                              {!isGrouped && (
                                <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                    {isOwn ? "You" : getDisplayName(msg.profiles)}
                                  </span>
                                  {getRoleBadge(msg.profiles?.role || null)}
                                  <span className="text-[10px] text-neutral-400">{formatTime(msg.created_at)}</span>
                                </div>
                              )}

                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                  isOwn
                                    ? "bg-neutral-900 dark:bg-white text-white dark:text-black rounded-tr-sm"
                                    : "bg-white dark:bg-[#1E1E22] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-sm"
                                } ${isGrouped ? (isOwn ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""}`}
                              >
                                {msg.content}
                              </div>

                              {isGrouped && (
                                <span className="text-[10px] text-neutral-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {formatTime(msg.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message #${activeChannel.name}...`}
                    className="w-full px-4 py-2.5 pr-12 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={sending}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-blue-500" />
              </div>
              <p className="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">No channel selected</p>
              <p className="text-sm text-neutral-500 mb-4">Create a channel or select one from the sidebar.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create a Channel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(ch) => {
            setChannels((prev) => [...prev, ch].sort((a, b) => a.name.localeCompare(b.name)));
            setActiveChannel(ch);
          }}
        />
      )}
    </div>
  );
}
