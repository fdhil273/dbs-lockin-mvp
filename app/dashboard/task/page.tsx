"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Flame, CalendarDays, Users, Ban, Plus, 
  CheckCircle2, Edit, Trash2, Folder, X, Search, Loader2, Calendar
} from "lucide-react";
import { createTask, getTasks, toggleTaskStatus, deleteTask as deleteTaskAction, editTask, getProjects } from "@/app/actions/task";

export default function TaskMatrixPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]); 
  
  const [isPending, startTransition] = useTransition(); 
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ title: "", quad: "Q1", dueDate: "", projectId: "" });

  const fetchData = async () => {
    setIsLoadingFetch(true);
    const [tasksData, projectsData] = await Promise.all([
      getTasks(),
      getProjects()
    ]);
    
    // 🔥 FILTER SAKTI: Usir semua data yang bertipe "EVENT" agar tidak masuk ke sini
    const onlyTasks = tasksData.filter((t: any) => t.type === "TASK" || t.type === null || t.type === undefined);
    
    setTasks(onlyTasks);
    setProjects(projectsData);
    setIsLoadingFetch(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
    t.type !== "EVENT" // <-- INI ADALAH PENJAGA GERNBANGNYA
  );

  const openAddModal = (quad = "Q1") => {
    setEditingId(null);
    setFormData({ title: "", quad, dueDate: "", projectId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingId(task.id);
    let formattedDate = "";
    if (task.dueDate) {
      formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
    }
    setFormData({ 
      title: task.title, 
      quad: task.quadrant, 
      dueDate: formattedDate,
      projectId: task.projectId || "" 
    });
    setIsModalOpen(true);
  };

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    startTransition(async () => {
      if (editingId) {
        await editTask(editingId, formData.title, formData.quad, formData.dueDate, formData.projectId);
      } else {
        await createTask(formData.title, formData.quad, formData.dueDate, formData.projectId);
      }
      await fetchData();
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Yakin ingin menghapus tugas ini?")) {
      startTransition(async () => {
        await deleteTaskAction(id);
        await fetchData();
      });
    }
  };

  const handleToggle = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleTaskStatus(id, currentStatus);
      await fetchData();
    });
  };

  const TaskItem = ({ task }: { task: any }) => {
    const isDone = task.status === "DONE";
    const displayDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : null;

    return (
      <div className={`bg-[#F8F9FB] rounded-xl p-4 mb-3 border border-transparent hover:border-venus/50 hover:bg-white transition-all group flex justify-between items-start shrink-0 ${isPending ? "opacity-50" : ""}`}>
        <div>
          <h4 className={`font-bold text-sm mb-2 ${isDone ? 'text-galaxy/40 line-through' : 'text-galaxy'}`}>{task.title}</h4>
          <div className="flex flex-wrap gap-3">
            {displayDate && (
               <div className="flex items-center gap-1 text-[11px] font-semibold text-galaxy/50"><Calendar className="w-3 h-3" /> {displayDate}</div>
            )}
            {task.project && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-planetary">
                <Folder className="w-3 h-3" fill="currentColor" /> {task.project.name}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleToggle(task.id, task.status)} className="text-emerald-500 hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4" /></button>
          <button onClick={() => openEditModal(task)} className="text-galaxy/40 hover:text-planetary hover:scale-110 transition-transform"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 h-[calc(100vh)] max-w-7xl mx-auto flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-galaxy mb-1">Priority Matrix</h1>
          <p className="text-galaxy/60 text-sm">Selesaikan tugas berdasarkan tingkat kepentingan dan urgensi.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-galaxy/40" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari tugas..." className="w-full bg-white border border-venus/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-galaxy focus:outline-none focus:border-planetary shadow-sm" />
          </div>
          <button onClick={() => openAddModal("Q1")} className="bg-planetary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors flex items-center shadow-md whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> New Task
          </button>
        </div>
      </div>

      {isLoadingFetch ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-planetary animate-spin" /></div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 pb-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-full min-h-0"><div className="flex items-center justify-between border-b border-dashed border-venus/50 pb-4 mb-4 shrink-0"><div className="flex items-center gap-2 text-red-600"><Flame className="w-5 h-5" strokeWidth={2.5} /><h2 className="font-extrabold text-sm tracking-wide">Do First (Q1)</h2></div><button onClick={() => openAddModal("Q1")} className="text-galaxy/30 hover:text-red-600"><Plus className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">{filteredTasks.filter(t => t.quadrant === "Q1").length === 0 && <p className="text-xs font-bold text-galaxy/30 text-center mt-10">Belum ada tugas</p>}{filteredTasks.filter(t => t.quadrant === "Q1").map(t => <TaskItem key={t.id} task={t} />)}</div></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-full min-h-0"><div className="flex items-center justify-between border-b border-dashed border-venus/50 pb-4 mb-4 shrink-0"><div className="flex items-center gap-2 text-sky-600"><CalendarDays className="w-5 h-5" strokeWidth={2.5} /><h2 className="font-extrabold text-sm tracking-wide">Schedule (Q2)</h2></div><button onClick={() => openAddModal("Q2")} className="text-galaxy/30 hover:text-sky-600"><Plus className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">{filteredTasks.filter(t => t.quadrant === "Q2").length === 0 && <p className="text-xs font-bold text-galaxy/30 text-center mt-10">Belum ada tugas</p>}{filteredTasks.filter(t => t.quadrant === "Q2").map(t => <TaskItem key={t.id} task={t} />)}</div></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-full min-h-0"><div className="flex items-center justify-between border-b border-dashed border-venus/50 pb-4 mb-4 shrink-0"><div className="flex items-center gap-2 text-amber-500"><Users className="w-5 h-5" strokeWidth={2.5} /><h2 className="font-extrabold text-sm tracking-wide">Delegate (Q3)</h2></div><button onClick={() => openAddModal("Q3")} className="text-galaxy/30 hover:text-amber-500"><Plus className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">{filteredTasks.filter(t => t.quadrant === "Q3").length === 0 && <p className="text-xs font-bold text-galaxy/30 text-center mt-10">Belum ada tugas</p>}{filteredTasks.filter(t => t.quadrant === "Q3").map(t => <TaskItem key={t.id} task={t} />)}</div></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-full min-h-0"><div className="flex items-center justify-between border-b border-dashed border-venus/50 pb-4 mb-4 shrink-0"><div className="flex items-center gap-2 text-slate-500"><Ban className="w-5 h-5" strokeWidth={2.5} /><h2 className="font-extrabold text-sm tracking-wide">Eliminate (Q4)</h2></div><button onClick={() => openAddModal("Q4")} className="text-galaxy/30 hover:text-slate-500"><Plus className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">{filteredTasks.filter(t => t.quadrant === "Q4").length === 0 && <p className="text-xs font-bold text-galaxy/30 text-center mt-10">Belum ada tugas</p>}{filteredTasks.filter(t => t.quadrant === "Q4").map(t => <TaskItem key={t.id} task={t} />)}</div></div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative pt-12 pb-6 px-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-6">
              {editingId ? "Edit Tugas" : "Tambah Tugas Baru"}
            </h3>
            
            <form onSubmit={saveTask} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Nama Tugas</label>
                <input 
                  type="text" autoFocus required 
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-center font-medium" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Deadline</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                    className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-galaxy/80 text-center" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Kuadran</label>
                  <select 
                    value={formData.quad} onChange={(e) => setFormData({...formData, quad: e.target.value})} 
                    className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none appearance-none text-center"
                  >
                    <option value="Q1">Q1 (Do First)</option>
                    <option value="Q2">Q2 (Schedule)</option>
                    <option value="Q3">Q3 (Delegate)</option>
                    <option value="Q4">Q4 (Eliminate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Hubungkan ke Project (Opsional)</label>
                <select 
                  value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})} 
                  className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none appearance-none text-center"
                >
                  <option value="">-- Berdiri Sendiri --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={isPending} className="w-full bg-planetary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors shadow-md flex items-center justify-center">
                  {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  {editingId ? "Simpan Perubahan" : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}