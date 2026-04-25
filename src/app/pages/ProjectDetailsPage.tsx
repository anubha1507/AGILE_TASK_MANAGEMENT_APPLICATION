import { useState, useEffect, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, MoreHorizontal, Calendar, ChevronRight, Loader2, Users } from "lucide-react";
import { Link, useParams } from "react-router";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

const ITEM_TYPE = "TASK";

const TaskCard = ({ task, moveTask }: { task: any, moveTask: (id: string, listId: string) => void }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={dragRef}
      className={`bg-white dark:bg-[#1C1C1E] p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm cursor-grab active:cursor-grabbing mb-3 group hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-sm ${
          task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" :
          task.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
          "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
        }`}>
          {task.priority || "medium"}
        </div>
        <button className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <h4 className="text-sm font-medium mb-3 text-neutral-900 dark:text-white">{task.title}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
        {task.profiles && (
          <img src={task.profiles.avatar_url || `https://ui-avatars.com/api/?name=${task.profiles.full_name}&background=random`} alt="Assignee" className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-800" title={task.profiles.full_name} />
        )}
      </div>
    </div>
  );
};

const Column = ({ list, tasks, moveTask, onAddTask }: { list: any, tasks: any[], moveTask: (id: string, listId: string) => void, onAddTask: (listId: string) => void }) => {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => moveTask(item.id, list.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div className="flex flex-col w-full md:w-80 shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{list.name}</h3>
          <span className="text-xs text-neutral-500 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(list.id)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={dropRef}
        className={`flex-1 rounded-xl p-2 md:min-h-[500px] transition-colors ${
          isOver ? "bg-neutral-100 dark:bg-neutral-800/50" : "bg-neutral-50 dark:bg-[#111113] border border-transparent dark:border-neutral-800/30"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} moveTask={moveTask} />
        ))}
      </div>
    </div>
  );
};

export function ProjectDetailsPage() {
  const { id: projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("board");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTaskToList, setAddingTaskToList] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    
    // Fetch Project
    const { data: pData } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (pData) setProject(pData);

    // Fetch Lists
    const { data: lData } = await supabase.from("project_lists").select("*").eq("project_id", projectId).order("position");
    if (lData) setLists(lData);

    // Fetch Tasks with Assignees
    const { data: tData } = await supabase.from("tasks").select("*, profiles:assignee_id(full_name, avatar_url)").eq("project_id", projectId);
    if (tData) setTasks(tData);

    // Fetch Members
    const { data: mData } = await supabase.from("project_members").select("*, profiles(full_name, avatar_url, role)").eq("project_id", projectId);
    if (mData) setMembers(mData);

    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const moveTask = async (taskId: string, newListId: string) => {
    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, list_id: newListId } : t)));
    
    // Database update
    const { error } = await supabase.from("tasks").update({ list_id: newListId }).eq("id", taskId);
    if (error) {
      toast.error("Failed to move task: " + error.message);
      fetchData(); // Revert on failure
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !addingTaskToList || !project) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.from("tasks").insert({
      title: newTaskTitle.trim(),
      project_id: project.id,
      list_id: addingTaskToList,
      created_by: user?.id,
    }).select("*, profiles:assignee_id(full_name, avatar_url)").single();

    if (error) {
      toast.error("Error creating task: " + error.message);
    } else if (data) {
      setTasks((prev) => [...prev, data]);
      setNewTaskTitle("");
      setAddingTaskToList(null);
    }
  };

  const handleAddList = async () => {
    const name = prompt("Enter list name:");
    if (!name || !project) return;
    
    const { data, error } = await supabase.from("project_lists").insert({
      name,
      project_id: project.id,
      position: lists.length
    }).select().single();

    if (error) toast.error("Error creating list: " + error.message);
    else if (data) setLists((prev) => [...prev, data]);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!project) return <div className="p-8">Project not found</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161618] shrink-0">
          <div className="flex items-center text-xs text-neutral-500 mb-4">
            <Link to="/app/projects" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Projects</Link>
            <ChevronRight className="w-3 h-3 mx-1" />
            <span className="text-neutral-900 dark:text-neutral-300">{project.name}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                project.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>{project.status}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 mr-2" title={`${members.length} members`}>
                {members.slice(0, 5).map((m, i) => (
                  <img key={i} src={m.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${m.profiles?.full_name}&background=random`} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161618] relative" style={{ zIndex: 10 - i }} />
                ))}
                {members.length > 5 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#161618] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs relative z-0">
                    +{members.length - 5}
                  </div>
                )}
              </div>
              <button className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-1.5 text-sm font-medium rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                Settings
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {["Board", "Timeline", "Members"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.toLowerCase()
                    ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-x-hidden md:overflow-x-auto overflow-y-auto md:overflow-y-hidden bg-neutral-50 dark:bg-[#0E0E11] pb-[100px] md:pb-0">
          {activeTab === "board" && (
            <div className="flex flex-col md:flex-row gap-6 h-full items-start p-4 md:p-8 overflow-y-visible md:overflow-y-hidden pb-12">
              {lists.map((list) => (
                <div key={list.id} className="flex flex-col w-full md:w-auto">
                  <Column
                    list={list}
                    tasks={tasks.filter((t) => t.list_id === list.id)}
                    moveTask={moveTask}
                    onAddTask={(listId) => setAddingTaskToList(listId)}
                  />
                  {addingTaskToList === list.id && (
                    <form onSubmit={handleCreateTask} className="mt-2 w-full md:w-80">
                      <input 
                        type="text" 
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..." 
                        className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1C1C1E]"
                      />
                      <div className="flex gap-2 mt-2">
                        <button type="submit" className="px-3 py-2 md:py-1 bg-blue-500 text-white text-xs rounded-md font-medium">Save</button>
                        <button type="button" onClick={() => setAddingTaskToList(null)} className="px-3 py-2 md:py-1 bg-neutral-200 dark:bg-neutral-800 text-xs rounded-md font-medium">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
              <div className="w-full md:w-80 shrink-0">
                <button onClick={handleAddList} className="w-full flex items-center justify-center gap-2 py-4 md:py-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <Plus className="w-4 h-4" /> Add List
                </button>
              </div>
            </div>
          )}
          
          {activeTab === "members" && (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-[#161618] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                  <h3 className="font-semibold">Project Team</h3>
                  <button className="text-sm bg-neutral-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md font-medium">Add Member</button>
                </div>
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {members.length === 0 ? <p className="p-4 text-neutral-500 text-sm">No members added yet.</p> : members.map(m => (
                    <div key={m.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={m.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${m.profiles?.full_name}&background=random`} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{m.profiles?.full_name}</p>
                          <p className="text-xs text-neutral-500">{m.profiles?.role}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">{m.role_in_project}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="p-8 flex items-center justify-center text-neutral-500 h-full flex-col gap-4">
              <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
              <p>Timeline view is currently visualizing {tasks.length} tasks...</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
