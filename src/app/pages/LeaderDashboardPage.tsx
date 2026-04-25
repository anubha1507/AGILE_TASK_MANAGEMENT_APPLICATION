import { useState, useEffect } from "react";
import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus,
  ArrowUpRight,
  Briefcase,
  Loader2
} from "lucide-react";
import { Link } from "react-router";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell
} from "recharts";
import { motion } from "motion/react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export function LeaderDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Projects", value: "0", icon: Briefcase, trend: "Loading...", color: "text-blue-500" },
    { label: "Active Tasks", value: "0", icon: Clock, trend: "Loading...", color: "text-amber-500" },
    { label: "Team Velocity", value: "0", icon: TrendingUp, trend: "Loading...", color: "text-green-500" },
    { label: "Completed", value: "0", icon: CheckCircle2, trend: "Loading...", color: "text-purple-500" },
  ]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [projectHealth, setProjectHealth] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Projects for Stats and Health
      const { data: projects, error: pError } = await supabase
        .from("projects")
        .select("*");
      
      if (pError) throw pError;

      // 2. Process Stats
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status !== 'Done').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'Done').length || 0;

      setStats([
        { label: "Total Projects", value: totalProjects.toString(), icon: Briefcase, trend: `${activeProjects} active now`, color: "text-blue-500" },
        { label: "Active Projects", value: activeProjects.toString(), icon: Clock, trend: "Updated just now", color: "text-amber-500" },
        { label: "Team Performance", value: "88%", icon: TrendingUp, trend: "+5% vs last month", color: "text-green-500" },
        { label: "Completed", value: completedProjects.toString(), icon: CheckCircle2, trend: "Total milestones", color: "text-purple-500" },
      ]);

      // 3. Process Project Health
      setProjectHealth((projects || []).slice(0, 4).map(p => ({
        name: p.name,
        status: p.status,
        health: p.progress || 0,
        color: p.status === 'Done' ? '#10b981' : p.status === 'At Risk' ? '#ef4444' : '#3b82f6'
      })));

      // 4. Fetch Profiles for Team
      const { data: profiles, error: prError } = await supabase
        .from("profiles")
        .select("*")
        .limit(4);
      
      if (prError) throw prError;
      
      setTeamPerformance((profiles || []).map(p => ({
        name: p.full_name || p.username || "Team Member",
        role: p.role || "Member",
        tasks: 10, // Mock for now until tasks table is ready
        completed: 8,
        efficiency: 80,
        avatar: p.avatar_url
      })));

      // Mock chart data for now as we don't have historical task data yet
      setChartData([
        { name: "Mon", tasks: 20 },
        { name: "Tue", tasks: 30 },
        { name: "Wed", tasks: 45 },
        { name: "Thu", tasks: 60 },
        { name: "Fri", tasks: 80 },
        { name: "Sat", tasks: 35 },
        { name: "Sun", tasks: 25 },
      ]);

      // Mock activity until we have a real activity table
      setRecentActivity([
        { user: "System", action: "fetched", target: "Live Workspace Data", time: "Just now", color: "bg-blue-500" },
      ]);

    } catch (error: any) {
      toast.error("Error loading dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Leader Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Manage your workspace, track team performance, and ship projects faster.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            Refresh Data
          </button>
          <Link to="/app/projects" className="bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Manage Projects
          </Link>
        </div>
      </div>

      {loading && stats[0].trend === "Loading..." ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-neutral-500 font-medium">Syncing with workspace...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <Card key={i} className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-neutral-500">{stat.label}</CardTitle>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-neutral-500 mt-1">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <Card className="lg:col-span-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workspace Momentum</CardTitle>
                    <CardDescription>Activity trends over the last week.</CardDescription>
                  </div>
                  <BarChart3 className="w-4 h-4 text-neutral-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#161618', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.tasks > 50 ? "#3b82f6" : "#60a5fa"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Project Health */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shadow-sm">
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Real-time status of your initiatives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {projectHealth.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-4 text-center">No active projects to display.</p>
                ) : (
                  projectHealth.map((p, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate pr-4">{p.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "Done" ? "bg-green-100 text-green-700" :
                          p.status === "At Risk" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{p.status}</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.health}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Team Monitoring */}
            <Card className="lg:col-span-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>Members overview from your workspace.</CardDescription>
                  </div>
                  <Link to="/app/team" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                    View Team <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 mt-4">
                  {teamPerformance.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-4 text-center">No team members found.</p>
                  ) : (
                    teamPerformance.map((member, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-neutral-100 dark:border-neutral-800">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-sm font-semibold truncate">{member.name}</p>
                              <p className="text-xs text-neutral-500">{member.role}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{member.efficiency}%</p>
                              <p className="text-[10px] text-neutral-400 uppercase font-black">EFFICIENCY</p>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                member.efficiency > 80 ? "bg-green-500" : member.efficiency > 50 ? "bg-blue-500" : "bg-red-500"
                              }`}
                              style={{ width: `${member.efficiency}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shadow-sm">
              <CardHeader>
                <CardTitle>Workspace Activity</CardTitle>
                <CardDescription>Updates from your collaborators.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-2 ring-4 ring-neutral-50 dark:ring-[#111113] ${act.color}`} />
                        {i !== recentActivity.length - 1 && <div className="w-[1px] flex-1 bg-neutral-100 dark:bg-neutral-800 mt-2" />}
                      </div>
                      <div className="flex-1 pb-4 border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 group-hover:pl-1 transition-all">
                        <p className="text-sm">
                          <span className="font-bold">{act.user}</span> <span className="text-neutral-500">{act.action}</span> <span className="font-medium">{act.target}</span>
                        </p>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
