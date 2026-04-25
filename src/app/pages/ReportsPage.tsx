import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Calendar as CalendarIcon, ShieldAlert } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart"

const taskData = [
  { name: "Mon", completed: 12, added: 8 },
  { name: "Tue", completed: 19, added: 10 },
  { name: "Wed", completed: 15, added: 12 },
  { name: "Thu", completed: 22, added: 5 },
  { name: "Fri", completed: 30, added: 15 },
  { name: "Sat", completed: 10, added: 2 },
  { name: "Sun", completed: 8, added: 1 },
];

const burndownData = [
  { day: "Day 1", remaining: 100, ideal: 100 },
  { day: "Day 2", remaining: 90, ideal: 85 },
  { day: "Day 3", remaining: 85, ideal: 71 },
  { day: "Day 4", remaining: 60, ideal: 57 },
  { day: "Day 5", remaining: 50, ideal: 42 },
  { day: "Day 6", remaining: 30, ideal: 28 },
  { day: "Day 7", remaining: 10, ideal: 14 },
  { day: "Day 8", remaining: 0, ideal: 0 },
];

const chartConfig = {
  projects: {
    label: "Projects",
    color: "#3b82f6", // using tailwind blue-500 as fallback
  },
} satisfies ChartConfig

function MemberProjectsChart({ data }: { data: any[] }) {
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.projects, 0),
    [data]
  )

  return (
    <Card className="py-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618]">
      <CardHeader className="flex flex-col items-stretch border-b border-neutral-200 dark:border-neutral-800 p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
          <CardTitle>Member Workload</CardTitle>
          <CardDescription>
            Showing number of projects assigned to each member
          </CardDescription>
        </div>
        <div className="flex">
          <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6 bg-neutral-50 dark:bg-neutral-900/50">
            <span className="text-xs text-muted-foreground">
              Total Assignments
            </span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} stroke="#333" opacity={0.1} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px] bg-white dark:bg-[#161618] border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                  nameKey="projects"
                />
              }
            />
            <Bar dataKey="projects" fill="var(--color-projects)" radius={[4,4,0,0]} barSize={40} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function ReportsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [memberProjectData, setMemberProjectData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        const resolvedRole = data?.role || session.user.user_metadata?.role || "Member";
        setProfile({ ...data, role: resolvedRole });

        // Fetch workload data
        const { data: pmData } = await supabase.from('project_members').select('user_id, profiles(full_name)');
        const { data: pData } = await supabase.from('projects').select('owner_id, profiles(full_name)');

        const counts: Record<string, {name: string, projects: number}> = {};
        
        // Count owned projects
        pData?.forEach((p: any) => {
          const name = p.profiles?.full_name || 'Unknown';
          if (!counts[p.owner_id]) counts[p.owner_id] = { name, projects: 0 };
          counts[p.owner_id].projects += 1;
        });

        // Count memberships
        pmData?.forEach((pm: any) => {
          const name = pm.profiles?.full_name || 'Unknown';
          if (!counts[pm.user_id]) counts[pm.user_id] = { name, projects: 0 };
          counts[pm.user_id].projects += 1;
        });

        const formattedData = Object.values(counts);
        setMemberProjectData(formattedData.length > 0 ? formattedData : [{ name: 'No Members', projects: 0 }]);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (profile?.role !== "Manager" && profile?.role !== "Team Leader") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-neutral-50 dark:bg-black">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h1 className="text-2xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white">Access Restricted</h1>
        <p className="text-neutral-500 max-w-xs mt-2 text-sm font-medium">Strategic analytics are restricted to executive and operational leads only.</p>
      </div>
    );
  }
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">Reports</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Analyze your team's velocity and project health.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-[#161618] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <CalendarIcon className="w-4 h-4" /> Last 7 Days
          </button>
          <button className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
           <MemberProjectsChart data={memberProjectData} />
        </div>

        {/* Task Completion Chart */}
        <div className="bg-white dark:bg-[#161618] p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1 text-neutral-900 dark:text-white">Task Velocity</h2>
            <p className="text-sm text-neutral-500">Tasks completed vs added over time.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart id="task-velocity" accessibilityLayer={false} data={taskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: '#161618', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="added" name="Added" fill="#9ca3af" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Burndown Chart */}
        <div className="bg-white dark:bg-[#161618] p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1 text-neutral-900 dark:text-white">Sprint Burndown</h2>
            <p className="text-sm text-neutral-500">Remaining work in current sprint.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart id="sprint-burndown" accessibilityLayer={false} data={burndownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161618', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="remaining" name="Actual Remaining" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="ideal" name="Ideal Trend" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
