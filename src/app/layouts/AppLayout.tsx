import { Outlet, NavLink, useNavigate } from "react-router";
import { 
  LayoutDashboard, CheckSquare, BarChart2, Settings, Bell, Search, Sun, Moon, 
  LogOut, Users, MessageSquare, Briefcase, UserCheck, ShieldCheck, Zap, 
  Command, Cpu, Users2, Menu, X
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { FullScreenLoader } from "../components/FullScreenLoader";

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      // Try fetching from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        // Double check the role is present
        const resolvedRole = profileData.role || session.user.user_metadata?.role || "Member";
        setProfile({ ...profileData, role: resolvedRole });
      } else {
        // Fallback to auth metadata if profile row isn't found/ready
        setProfile({
          full_name: session.user.user_metadata?.full_name || "User",
          role: session.user.user_metadata?.role || "Member"
        });
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <FullScreenLoader />;

  const role = profile?.role || "Member";

  // Navigation Items with Role-Based Visibility
  const allNavItems = [
    { name: "Dashboard", href: "/app", icon: LayoutDashboard, roles: ["HR", "Team Leader", "Member"] },
    { name: "Projects", href: "/app/projects", icon: Briefcase, roles: ["Team Leader", "Member"] },
    { name: "Team", href: "/app/team", icon: Users, roles: ["Manager", "HR", "Team Leader"] },
    { name: "Reports", href: "/app/reports", icon: BarChart2, roles: ["Manager", "Team Leader"] },
    { name: "Community", href: "/app/community", icon: MessageSquare, roles: ["Manager", "HR", "Team Leader", "Member"] },
    { name: "Settings", href: "/app/settings", icon: Settings, roles: ["Manager", "HR", "Team Leader", "Member"] },
  ];

  const filteredNavItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <div className="flex h-screen w-full font-sans overflow-hidden bg-neutral-50 dark:bg-[#0E0E11] transition-colors duration-500">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r bg-white dark:bg-[#161618] border-neutral-200 dark:border-neutral-800 flex-col">
        <div className="h-16 flex items-center px-6 border-b border-inherit shrink-0">
          <div className="flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-blue-500 fill-current" />
            <span className="font-bold text-sm tracking-tight">AgileFlow</span>
          </div>
        </div>

        <div className="flex-1 py-8 px-4 overflow-y-auto">
          <nav className="space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/app"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-inherit shrink-0">
          <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <img 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`} 
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-neutral-900 dark:text-white">{profile?.full_name}</p>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                role === "HR" ? "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400" :
                role === "Manager" ? "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400" :
                role === "Team Leader" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" :
                "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              )}>
                {role}
              </span>
            </div>
            <button onClick={handleLogout} className="p-1 text-neutral-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-[#161618] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          {/* Mobile Header Left (Logo + Hamburger) */}
          <div className="md:hidden flex items-center gap-3">
             <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-neutral-500">
               <Menu className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-2">
               <Zap className="w-5 h-5 text-blue-500 fill-current" />
               <span className="font-bold text-sm tracking-tight">AgileFlow</span>
             </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center flex-1">
             <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Quick search..."
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-blue-500 transition-all"
                />
             </div>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
               <Bell className="w-5 h-5 md:w-4 md:h-4" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-[#161618] rounded-full" />
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hidden md:block p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
            </button>
            <button onClick={() => navigate('/app/settings')} className="p-1 md:hidden ml-1">
              <img 
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`} 
                className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover"
              />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-[#FAFAFB] dark:bg-[#0E0E11] pb-16 md:pb-0">
          <Outlet />
        </div>

        {/* MOBILE BOTTOM NAV */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#161618] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around h-16 px-2 z-40 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.1)] dark:shadow-none">
           {filteredNavItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === "/app"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-300"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                    <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
        </nav>
      </main>

      {/* MOBILE HAMBURGER MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-[#161618] shadow-2xl flex flex-col transition-transform transform translate-x-0" onClick={e => e.stopPropagation()}>
            <div className="h-14 p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                 <Zap className="w-5 h-5 text-blue-500 fill-current" />
                 <span className="font-bold text-sm tracking-tight">AgileFlow Menu</span>
               </div>
               <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-4">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/app"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4 shrink-0">
              <div className="flex items-center justify-between px-2">
                 <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Appearance</span>
                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 text-neutral-500 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors">
                   {mounted && (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
                 </button>
              </div>
              <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <img 
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`} 
                  className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{profile?.full_name}</p>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    role === "HR" ? "bg-pink-100 text-pink-600" :
                    role === "Manager" ? "bg-purple-100 text-purple-600" :
                    role === "Team Leader" ? "bg-blue-100 text-blue-600" :
                    "bg-neutral-100 text-neutral-600"
                  )}>
                    {role}
                  </span>
                </div>
                <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
