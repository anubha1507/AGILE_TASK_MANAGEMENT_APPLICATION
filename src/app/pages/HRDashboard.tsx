import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Users, UserCheck, MessageSquare, Search, 
  Mail, Phone, ShieldCheck, MoreVertical
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase.from('profiles').select('*');
      setEmployees(data || []);
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">People Directory</h1>
          <p className="text-sm text-neutral-500">Manage employee profiles and engagement.</p>
        </div>
        <div className="flex w-full md:w-auto">
           <button className="flex w-full items-center justify-center gap-2 px-4 py-3 md:py-2 bg-pink-500 text-white rounded-lg text-sm font-bold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20 min-h-[44px]">Add Member</button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 md:gap-4 flex-col md:flex-row text-center md:text-left justify-center md:justify-start">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0"><Users className="w-5 h-5 md:w-6 md:h-6" /></div>
           <div>
             <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase">Total Employees</p>
             <p className="text-xl md:text-2xl font-bold">{employees.length}</p>
           </div>
        </div>
        <div className="bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 md:gap-4 flex-col md:flex-row text-center md:text-left justify-center md:justify-start">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500 shrink-0"><UserCheck className="w-5 h-5 md:w-6 md:h-6" /></div>
           <div>
             <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase">Active Now</p>
             <p className="text-xl md:text-2xl font-bold">{Math.floor(employees.length * 0.7)}</p>
           </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-white dark:bg-[#161618] p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 md:gap-4 flex-col md:flex-row text-center md:text-left justify-center md:justify-start">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><MessageSquare className="w-5 h-5 md:w-6 md:h-6" /></div>
           <div>
             <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase">New Messages</p>
             <p className="text-xl md:text-2xl font-bold">12</p>
           </div>
        </div>
      </div>

      {/* EMPLOYEE LIST / TABLE */}
      <div className="bg-white dark:bg-[#161618] rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-inherit flex items-center justify-between">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-pink-500 transition-colors" />
            <input type="text" placeholder="Search people..." className="w-full bg-neutral-50 dark:bg-neutral-900 border-none rounded-lg py-3 md:py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-pink-500 transition-all min-h-[44px] md:min-h-0" />
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black uppercase tracking-widest text-neutral-500">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar_url || `https://ui-avatars.com/api/?name=${emp.full_name}&background=random`} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-pink-500 transition-colors">{emp.full_name}</p>
                        <p className="text-xs text-neutral-500">Engineering</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Mail className="w-4 h-4 hover:text-pink-500 cursor-pointer" />
                      <Phone className="w-4 h-4 hover:text-pink-500 cursor-pointer" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {employees.map((emp) => (
             <div key={emp.id} className="p-4 flex items-center justify-between active:bg-neutral-50 dark:active:bg-neutral-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={emp.avatar_url || `https://ui-avatars.com/api/?name=${emp.full_name}&background=random`} className="w-10 h-10 rounded-full shrink-0 object-cover" />
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{emp.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 truncate">{emp.role}</span>
                      <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 shrink-0" />
                      <span className="text-[10px] text-green-500 flex items-center gap-1 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-2 text-neutral-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 rounded-full transition-colors"><Mail className="w-4 h-4" /></button>
                  <button className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
