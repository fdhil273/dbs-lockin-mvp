"use client";

import { useState, useEffect, useTransition } from "react";
import { StickyNote, Plus, Search, Loader2, Trash2, Edit, X, Folder } from "lucide-react";
import { getNotes, createNote, deleteNote, editNote } from "@/app/actions/note";
import { getProjects } from "@/app/actions/project"; // Untuk mengambil daftar project di Dropdown

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // STATE MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", projectId: "" });

  const fetchData = async () => {
    setIsLoadingFetch(true);
    const [notesData, projectsData] = await Promise.all([
      getNotes(),
      getProjects()
    ]);
    setNotes(notesData);
    setProjects(projectsData);
    setIsLoadingFetch(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (note: any = null) => {
    if (note) {
      setEditingId(note.id);
      setFormData({ 
        title: note.title, 
        content: note.content,
        projectId: note.projectId || "" 
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", content: "", projectId: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    startTransition(async () => {
      if (editingId) {
        await editNote(editingId, formData.title, formData.content, formData.projectId);
      } else {
        await createNote(formData.title, formData.content, formData.projectId);
      }
      await fetchData();
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Yakin ingin menghapus catatan ini?")) {
      startTransition(async () => {
        await deleteNote(id);
        await fetchData();
      });
    }
  };

  return (
    <div className="p-8 h-full max-w-7xl mx-auto flex flex-col relative overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-galaxy mb-1">Catatan</h1>
          <p className="text-galaxy/60 text-sm">Simpan ide, rangkuman AI, dan detail penting proyekmu di sini.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-galaxy/40" />
            <input 
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Cari catatan..." 
              className="w-full bg-white border border-venus/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-galaxy focus:outline-none focus:border-amber-400 shadow-sm" 
            />
          </div>
          <button onClick={() => openModal()} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors flex items-center shadow-md whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> Note Baru
          </button>
        </div>
      </div>

      {/* GRID CATATAN */}
      {isLoadingFetch ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
      ) : (
        <>
          {filteredNotes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center mt-20">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <StickyNote className="w-10 h-10 text-amber-300" />
              </div>
              <h2 className="text-xl font-extrabold text-galaxy mb-2">Belum ada Catatan</h2>
              <p className="text-galaxy/50 text-sm mb-6 max-w-sm">Ide brilian sering kali hilang jika tidak dicatat. Mulai buat catatan pertamamu sekarang.</p>
              <button onClick={() => openModal()} className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors flex items-center shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Buat Catatan
              </button>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-10">
              {/* Desain Layout Masonry (Pinterest style) untuk Notes yang panjangnya beda-beda */}
              {filteredNotes.map(note => (
                <div key={note.id} className={`break-inside-avoid bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-amber-200/60 relative group hover:shadow-md transition-all ${isPending ? "opacity-50" : ""}`}>
                  
                  {/* TOMBOL AKSI HOVER */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FFFDF7]/80 backdrop-blur-sm p-1 rounded-lg">
                    <button onClick={() => openModal(note)} className="p-1.5 text-amber-900/40 hover:text-planetary hover:bg-planetary/10 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(note.id)} className="p-1.5 text-amber-900/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <h3 className="font-extrabold text-amber-950 text-lg mb-2 pr-16">{note.title}</h3>
                  <p className="text-sm text-amber-900/80 whitespace-pre-wrap leading-relaxed mb-4">{note.content}</p>
                  
                  {/* FOOTER KARTU (Tanggal & Project) */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-amber-100/50">
                    <span className="text-[10px] font-bold text-amber-900/30 uppercase tracking-wider">
                      {new Date(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    {note.project && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-planetary bg-sky-50 px-2 py-1 rounded-md">
                        <Folder className="w-3 h-3" /> {note.project.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL FORM NOTE (Diperbarui dengan Opsi Project) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative pt-10 pb-6 px-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-galaxy/40 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-galaxy text-lg text-center mb-6">{editingId ? "Edit Catatan" : "Buat Catatan Baru"}</h3>
            
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5">Judul Catatan</label>
                <input 
                  type="text" autoFocus required 
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="Contoh: Rangkuman Meeting UX"
                  className="w-full bg-amber-50/30 border border-amber-200/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/50 focus:outline-none font-medium text-amber-950" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5">Isi Catatan</label>
                <textarea 
                  required rows={6}
                  value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} 
                  placeholder="Tulis ide atau detail rapat di sini..."
                  className="w-full bg-amber-50/30 border border-amber-200/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400/50 focus:outline-none text-amber-900 resize-none custom-scrollbar" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-galaxy/70 mb-1.5">Hubungkan ke Project (Opsional)</label>
                <select 
                  value={formData.projectId} onChange={(e) => setFormData({...formData, projectId: e.target.value})} 
                  className="w-full bg-white border border-venus/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-planetary/50 focus:outline-none appearance-none font-medium text-galaxy"
                >
                  <option value="">-- Berdiri Sendiri --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isPending} className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center">
                  {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  {editingId ? "Simpan Perubahan" : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}