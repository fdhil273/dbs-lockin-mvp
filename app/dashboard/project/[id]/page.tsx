"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle2, Trash2, Edit, Loader2, X, Users, StickyNote, CheckSquare } from "lucide-react";
import { getProjectById, addMemberToProject } from "@/app/actions/project";
import { createTask, toggleTaskStatus, deleteTask, editTask } from "@/app/actions/task";
import { createNote, deleteNote, editNote } from "@/app/actions/note";

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // STATE MODAL LOKAL
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  
  // STATE EDIT ID (Null = Create, Ada ID = Edit)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // STATE FORM
  const [taskForm, setTaskForm] = useState({ title: "", quad: "Q1", dueDate: "" });
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [memberEmail, setMemberEmail] = useState("");

  const fetchProjectDetail = async () => {
    setIsLoading(true);
    const data = await getProjectById(projectId);
    if (!data) { router.push("/dashboard/project"); return; }
    setProject(data);
    setIsLoading(false);
  };

  useEffect(() => { fetchProjectDetail(); }, [projectId]);

  // ================= HANDLER TASKS =================
  const handleToggleTask = (taskId: string, currentStatus: string) => {
    startTransition(async () => { await toggleTaskStatus(taskId, currentStatus); await fetchProjectDetail(); });
  };

  const handleDeleteTask = (taskId: string) => {
    if(confirm("Hapus tugas ini?")) {
      startTransition(async () => { await deleteTask(taskId); await fetchProjectDetail(); });
    }
  };

  const openTaskModal = (task: any = null) => {
    if (task) {
      setEditingTaskId(task.id);
      const dateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "";
      setTaskForm({ title: task.title, quad: task.quadrant, dueDate: dateStr });
    } else {
      setEditingTaskId(null);
      setTaskForm({ title: "", quad: "Q1", dueDate: "" });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    
    startTransition(async () => {
      if (editingTaskId) {
        await editTask(editingTaskId, taskForm.title, taskForm.quad, taskForm.dueDate, projectId);
      } else {
        await createTask(taskForm.title, taskForm.quad, taskForm.dueDate, projectId);
      }
      await fetchProjectDetail();
      setIsTaskModalOpen(false);
    });
  };

  // ================= HANDLER NOTES =================
  const handleDeleteNote = (noteId: string) => {
    if(confirm("Hapus catatan ini?")) {
      startTransition(async () => { await deleteNote(noteId); await fetchProjectDetail(); });
    }
  };

  const openNoteModal = (note: any = null) => {
    if (note) {
      setEditingNoteId(note.id);
      setNoteForm({ title: note.title, content: note.content });
    } else {
      setEditingNoteId(null);
      setNoteForm({ title: "", content: "" });
    }
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;

    startTransition(async () => {
      if (editingNoteId) {
        await editNote(editingNoteId, noteForm.title, noteForm.content);
      } else {
        await createNote(noteForm.title, noteForm.content, projectId);
      }
      await fetchProjectDetail();
      setIsNoteModalOpen(false);
    });
  };

  // ================= HANDLER MEMBERS =================
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    startTransition(async () => {
      const result = await addMemberToProject(projectId, memberEmail);
      if (result.error) {
        alert(result.error);
      } else {
        await fetchProjectDetail();
        setIsMemberModalOpen(false);
        setMemberEmail("");
      }
    });
  };

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-planetary animate-spin" /></div>;

  const totalTasks = project.tasks?.length || 0;
  const doneTasks = project.tasks?.filter((t: any) => t.status === "DONE").length || 0;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  
  let projectStatus = "DRAFT";
  let statusColor = "bg-galaxy/10 text-galaxy/60";
  if (totalTasks > 0 && progressPercentage < 100) {
    projectStatus = "IN PROGRESS"; statusColor = "bg-sky-100 text-sky-600";
  } else if (totalTasks > 0 && progressPercentage === 100) {
    projectStatus = "COMPLETED"; statusColor = "bg-emerald-100 text-emerald-600";
  }

  return (
    <div className="p-8 h-full max-w-6xl mx-auto flex flex-col overflow-y-auto">
      <Link href="/dashboard/project" className="flex items-center text-planetary font-bold text-sm mb-6 hover:opacity-70 transition-opacity w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Projects
      </Link>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-venus/30 mb-8 relative">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-extrabold text-galaxy mb-3 leading-tight break-words">{project.name}</h1>
            <p className="text-galaxy/50 text-sm md:text-base max-w-xl">Workspace ringkas untuk memantau perkembangan dan mencatat ide-ide project secara terfokus.</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-widest uppercase w-fit h-fit shrink-0 mt-2 md:mt-0 ${statusColor}`}>
            {projectStatus}
          </span>
        </div>
        <div className="bg-milkyway/50 p-4 rounded-2xl border border-venus/40 mt-4">
          <div className="flex justify-between text-sm font-bold text-galaxy/70 mb-2">
            <span>Workspace Progress</span>
            <span className={progressPercentage === 100 ? "text-emerald-500" : "text-planetary"}>{progressPercentage}% Completed ({doneTasks}/{totalTasks} Tugas)</span>
          </div>
          <div className="h-3 w-full bg-venus/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-[#1e3a8a]'}`} style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        
        {/* KOLOM KIRI */}
        <div className="lg:col-span-2 space-y-6">
          {/* TASKS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-venus/30 shrink-0">
              <h3 className="font-extrabold text-galaxy flex items-center gap-2 text-lg"><CheckSquare className="w-5 h-5 text-planetary" /> Project Tasks</h3>
              <button onClick={() => openTaskModal()} className="px-3 py-1.5 rounded-lg bg-sky/20 text-planetary font-bold text-sm flex items-center gap-2 hover:bg-planetary hover:text-white transition-colors">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {project.tasks?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50"><CheckSquare className="w-12 h-12 mb-3 text-galaxy/30" /><p className="text-sm font-bold text-galaxy/50">Belum ada tugas.</p></div>
              ) : (
                project.tasks?.map((task: any) => (
                  <div key={task.id} className={`flex items-center justify-between p-3.5 border border-venus/50 bg-[#F8F9FB] hover:bg-white rounded-xl group transition-all ${isPending ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleToggleTask(task.id, task.status)} className="hover:scale-110 transition-transform">
                        <CheckCircle2 className={`w-5 h-5 ${task.status === "DONE" ? "text-emerald-500" : "text-galaxy/30 hover:text-emerald-300"}`} />
                      </button>
                      <div>
                        <p className={`text-sm font-bold ${task.status === "DONE" ? "text-galaxy/40 line-through" : "text-galaxy"}`}>{task.title}</p>
                        <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block ${task.quadrant === 'Q1' ? 'bg-red-100 text-red-600' : task.quadrant === 'Q2' ? 'bg-sky-100 text-sky-600' : task.quadrant === 'Q3' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{task.quadrant}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {task.dueDate && <span className="text-[11px] text-galaxy/50 font-bold hidden sm:block bg-white px-2 py-1 border border-venus/50 rounded-lg">🗓️ {new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                      {/* TOMBOL EDIT TASK BARU */}
                      <button onClick={() => openTaskModal(task)} className="text-galaxy/30 hover:text-planetary opacity-0 group-hover:opacity-100 transition-opacity"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-galaxy/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MEMBERS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-venus/30">
              <h3 className="font-extrabold text-galaxy flex items-center gap-2"><Users className="w-5 h-5 text-galaxy/50" /> Project Members</h3>
              <button onClick={() => setIsMemberModalOpen(true)} className="px-3 py-1.5 rounded-lg bg-sky/20 text-planetary font-bold text-sm flex items-center gap-2 hover:bg-planetary hover:text-white transition-colors">
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-4 p-3 border border-venus/50 bg-milkyway rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold shadow-inner">M</div>
                <div><p className="font-bold text-galaxy text-sm">Me (Owner)</p><p className="text-[10px] text-galaxy/50 uppercase tracking-widest font-bold">Admin</p></div>
              </div>
              {/* LOOPING ANGGOTA TAMBAHAN */}
              {project.members?.map((mem: any) => (
                <div key={mem.id} className="flex items-center gap-4 p-3 border border-venus/50 bg-white rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-planetary text-white flex items-center justify-center font-bold shadow-inner">{mem.user.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1"><p className="font-bold text-galaxy text-sm line-clamp-1">{mem.user.name}</p><p className="text-[10px] text-galaxy/50 font-bold">{mem.user.email}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: NOTES */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-venus/30 shrink-0">
            <h3 className="font-extrabold text-galaxy flex items-center gap-2 text-lg"><StickyNote className="w-5 h-5 text-amber-500" /> Project Notes</h3>
            <button onClick={() => openNoteModal()} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold text-sm flex items-center gap-2 hover:bg-amber-100 transition-colors">
              <Plus className="w-4 h-4" /> Add Note
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {project.notes?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-50"><StickyNote className="w-12 h-12 mb-3 text-galaxy/30" /><p className="text-sm font-bold text-galaxy/50">Belum ada catatan.</p></div>
            ) : (
              project.notes?.map((note: any) => (
                <div key={note.id} className={`bg-[#FFFDF7] border border-amber-200/60 p-4 rounded-2xl relative group hover:shadow-sm transition-all ${isPending ? "opacity-50" : ""}`}>
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* TOMBOL EDIT NOTE BARU */}
                    <button onClick={() => openNoteModal(note)} className="text-amber-900/30 hover:text-planetary"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-amber-900/30 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h4 className="font-bold text-amber-950 text-sm mb-2 pr-10">{note.title}</h4>
                  <p className="text-xs text-amber-900/70 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* 1. MODAL TASK (Otomatis Handle Edit/Create) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative pt-10 pb-6 px-8">
            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500"><X className="w-5 h-5" /></button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-6">{editingTaskId ? "Edit Tugas" : "Tambah Tugas ke Project"}</h3>
            <form onSubmit={handleSaveTask} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Nama Tugas</label>
                <input type="text" autoFocus required value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-center font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Deadline</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-galaxy/80 text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Kuadran</label>
                  <select value={taskForm.quad} onChange={(e) => setTaskForm({...taskForm, quad: e.target.value})} className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none appearance-none text-center font-bold">
                    <option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3">Q3</option><option value="Q4">Q4</option>
                  </select>
                </div>
              </div>
              <div className="pt-2"><button type="submit" disabled={isPending} className="w-full bg-planetary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors shadow-md flex items-center justify-center">{isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} {editingTaskId ? "Simpan Perubahan" : "Simpan Tugas"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL NOTE (Otomatis Handle Edit/Create) */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative pt-10 pb-6 px-8">
            <button onClick={() => setIsNoteModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500"><X className="w-5 h-5" /></button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-6">{editingNoteId ? "Edit Catatan" : "Tambah Catatan Project"}</h3>
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5">Judul Catatan</label>
                <input type="text" autoFocus required value={noteForm.title} onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} placeholder="Contoh: Hasil Meeting UX" className="w-full bg-amber-50/30 border border-amber-200/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/50 focus:outline-none font-medium text-amber-950" />
              </div>
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5">Isi Catatan</label>
                <textarea required rows={4} value={noteForm.content} onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} placeholder="Tulis ide atau detail rapat di sini..." className="w-full bg-amber-50/30 border border-amber-200/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/50 focus:outline-none text-amber-900 resize-none custom-scrollbar" />
              </div>
              <div className="pt-2"><button type="submit" disabled={isPending} className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center">{isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} {editingNoteId ? "Update Catatan" : "Simpan Catatan"}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL ADD MEMBER (BARU) */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative pt-10 pb-6 px-8">
            <button onClick={() => setIsMemberModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500"><X className="w-5 h-5" /></button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-2">Undang Anggota</h3>
            <p className="text-center text-xs text-galaxy/50 mb-6">Masukkan email temanmu yang sudah terdaftar di LockIn.</p>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <input type="email" autoFocus required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="email.teman@contoh.com" className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-center font-medium" />
              </div>
              <div className="pt-2"><button type="submit" disabled={isPending} className="w-full bg-[#1e3a8a] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors shadow-md flex items-center justify-center">{isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} Kirim Undangan</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}