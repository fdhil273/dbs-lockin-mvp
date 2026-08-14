"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Folder, Plus, Search, Loader2, MoreVertical, Trash2, CheckCircle2, Users, X 
} from "lucide-react";
// 1. TAMBAHKAN IMPORT LINK DARI NEXT.JS
import Link from "next/link";
import { getProjects, createProject, deleteProject } from "@/app/actions/project";

export default function ProjectPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const fetchProjects = async () => {
    setIsLoadingFetch(true);
    const data = await getProjects();
    setProjects(data);
    setIsLoadingFetch(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    
    startTransition(async () => {
      await createProject(projectName);
      await fetchProjects();
      setProjectName("");
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Yakin ingin menghapus Project ini? Semua tugas di dalamnya juga akan terhapus.")) {
      startTransition(async () => {
        await deleteProject(id);
        await fetchProjects();
      });
    }
  };

  const ProjectCard = ({ project }: { project: any }) => {
    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t: any) => t.status === "DONE").length;
    const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    return (
      // 2. UBAH <div> TERLUAR MENJADI <Link>
      <Link 
        href={`/dashboard/project/${project.id}`} 
        className={`bg-white rounded-3xl p-6 shadow-sm border border-venus/30 flex flex-col hover:border-planetary/50 hover:shadow-md transition-all group cursor-pointer block ${isPending ? "opacity-50" : ""}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-sky/20 rounded-2xl flex items-center justify-center text-planetary">
            <Folder className="w-6 h-6" fill="currentColor" />
          </div>
          {/* 3. TAMBAHKAN e.preventDefault() PADA TOMBOL HAPUS */}
          <button 
            onClick={(e) => {
              e.preventDefault(); // Mencegah browser pindah halaman saat tombol hapus diklik
              handleDelete(project.id);
            }} 
            className="text-galaxy/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        <h3 className="font-extrabold text-galaxy text-lg mb-1 line-clamp-1">{project.name}</h3>
        <div className="flex items-center gap-4 text-xs font-semibold text-galaxy/50 mb-6">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 1 Member</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {totalTasks} Tugas</span>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-xs font-bold text-galaxy/50 mb-2">
            <span>Progress</span>
            <span className={progress === 100 ? "text-emerald-500" : "text-planetary"}>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-venus/30 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-planetary'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-8 h-full max-w-7xl mx-auto flex flex-col relative overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-galaxy mb-1">Manajemen Project</h1>
          <p className="text-galaxy/60 text-sm">Kelompokkan tugasmu ke dalam ruang kerja yang fokus.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-galaxy/40" />
            <input 
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Cari project..." 
              className="w-full bg-white border border-venus/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-galaxy focus:outline-none focus:border-planetary shadow-sm" 
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-planetary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors flex items-center shadow-md whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> Project Baru
          </button>
        </div>
      </div>

      {/* GRID PROJECT */}
      {isLoadingFetch ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-planetary animate-spin" /></div>
      ) : (
        <>
          {filteredProjects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-venus/30">
                <Folder className="w-10 h-10 text-galaxy/20" />
              </div>
              <h2 className="text-xl font-extrabold text-galaxy mb-2">Belum ada Project</h2>
              <p className="text-galaxy/50 text-sm mb-6 max-w-sm">Buat project pertamamu untuk mengelompokkan tugas-tugas yang memiliki tujuan yang sama.</p>
              <button onClick={() => setIsModalOpen(true)} className="bg-planetary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors flex items-center shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Buat Project Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
              {filteredProjects.map(proj => <ProjectCard key={proj.id} project={proj} />)}
            </div>
          )}
        </>
      )}

      {/* MODAL PROJECT BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative pt-10 pb-6 px-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-6">Buat Project Baru</h3>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5 text-center">Nama Project</label>
                <input 
                  type="text" autoFocus required 
                  value={projectName} onChange={(e) => setProjectName(e.target.value)} 
                  placeholder="Contoh: Redesign Website"
                  className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none text-center font-medium" 
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isPending} className="w-full bg-planetary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-galaxy transition-colors shadow-md flex items-center justify-center">
                  {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Simpan Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}