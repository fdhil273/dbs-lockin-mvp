"use client";

import { useState, useEffect, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Loader2, X, CheckCircle2, Edit, Trash2, CalendarDays } from "lucide-react";
import { getTasks, createTask, editTask, toggleTaskStatus, deleteTask } from "@/app/actions/task";
import { getProjects } from "@/app/actions/project";

export default function JadwalPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State Form
  const [formData, setFormData] = useState({ 
    title: "", category: "Q2", fromDate: "", toDate: "", note: "", type: "TASK", projectId: "" 
  });

  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: string, tasks: any[] } | null>(null);

  const fetchData = async () => {
    setIsLoadingFetch(true);
    const [tasksData, projectsData] = await Promise.all([getTasks(), getProjects()]);
    setTasks(tasksData);
    setProjects(projectsData);
    setIsLoadingFetch(false);
  };

  useEffect(() => { fetchData(); }, []);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dayNames = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

  const getFormatDate = (y: number, m: number, d: number) => `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

  const extractDateString = (dateVal: any) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; 
  };

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
    let prevMonth = currentMonth - 1, prevYear = currentYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear--; }
    calendarCells.push({ day: dayNum, month: prevMonth, year: prevYear, isCurrentMonth: false, dateStr: getFormatDate(prevYear, prevMonth, dayNum) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true, dateStr: getFormatDate(currentYear, currentMonth, i) });
  }
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    let nextMonth = currentMonth + 1, nextYear = currentYear;
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    calendarCells.push({ day: i, month: nextMonth, year: nextYear, isCurrentMonth: false, dateStr: getFormatDate(nextYear, nextMonth, i) });
  }

  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const todayStr = getFormatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  
  const validTasks = tasks.filter(t => t.dueDate);
  const searchedTasks = validTasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const openFormModal = (dateStr: string = "", task: any = null) => {
    if (task) {
      setEditingId(task.id);
      const fmt = (dStr: any) => {
        if(!dStr) return "";
        const d = new Date(dStr);
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      }
      setFormData({ 
        title: task.title, category: task.quadrant, fromDate: fmt(task.dueDate),
        toDate: fmt(task.endDate), note: task.note || "", type: task.type || "TASK", projectId: task.projectId || "" 
      });
    } else {
      setEditingId(null);
      const targetDate = dateStr ? new Date(dateStr) : new Date();
      if(dateStr) targetDate.setHours(9, 0, 0, 0); else targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
      const tzOffset = targetDate.getTimezoneOffset() * 60000;
      const defaultFrom = new Date(targetDate.getTime() - tzOffset).toISOString().slice(0, 16);
      setFormData({ title: "", category: "Q2", fromDate: defaultFrom, toDate: "", note: "", type: "TASK", projectId: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    startTransition(async () => {
      if (editingId) {
        await editTask(editingId, formData.title, formData.category, formData.fromDate, formData.projectId, formData.type, formData.toDate, formData.note);
      } else {
        await createTask(formData.title, formData.category, formData.fromDate, formData.projectId, formData.type, formData.toDate, formData.note);
      }
      await fetchData();
      setIsModalOpen(false);
      
      if (selectedDayTasks) {
        const updated = await getTasks();
        const validUpdated = updated.filter(t => t.dueDate);
        setSelectedDayTasks({ 
          date: selectedDayTasks.date, 
          tasks: validUpdated.filter(t => extractDateString(t.dueDate) === selectedDayTasks.date) 
        });
      }
    });
  };

  const handleToggle = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleTaskStatus(id, currentStatus);
      await fetchData();
      if (selectedDayTasks) {
        setSelectedDayTasks(prev => {
          if(!prev) return prev;
          return { ...prev, tasks: prev.tasks.map(t => t.id === id ? {...t, status: currentStatus === "TODO" ? "DONE" : "TODO"} : t) }
        });
      }
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Yakin ingin menghapus jadwal ini?")) {
      startTransition(async () => {
        await deleteTask(id);
        await fetchData();
        if (selectedDayTasks) {
          setSelectedDayTasks(prev => {
            if(!prev) return prev;
            return { ...prev, tasks: prev.tasks.filter(t => t.id !== id) }
          });
        }
      });
    }
  };

  return (
    <div className="p-8 h-full max-w-7xl mx-auto flex flex-col relative overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-extrabold text-galaxy flex items-center gap-3"><CalendarDays className="w-8 h-8 text-planetary" />Kalender</h1>
          <button onClick={goToToday} className="px-4 py-2 bg-white border border-venus/50 rounded-lg text-sm font-bold hover:bg-milkyway">Hari ini</button>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 bg-white border rounded-full hover:bg-milkyway"><ChevronLeft className="w-5 h-5 text-galaxy/70" /></button>
            <button onClick={nextMonth} className="p-2 bg-white border rounded-full hover:bg-milkyway"><ChevronRight className="w-5 h-5 text-galaxy/70" /></button>
          </div>
          <h2 className="text-xl font-extrabold text-galaxy w-48">{monthNames[currentMonth]} {currentYear}</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openFormModal()} className="bg-planetary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-galaxy flex items-center shadow-md"><Plus className="w-4 h-4 mr-2" /> Buat Jadwal</button>
        </div>
      </div>

      {isLoadingFetch ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-planetary animate-spin" /></div>
      ) : (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-venus/50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-venus/50 bg-[#F8F9FB] shrink-0">
            {dayNames.map(day => <div key={day} className="py-2.5 md:py-3 text-center text-[10px] md:text-xs font-bold text-galaxy/60">{day}</div>)}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-6 h-full bg-venus/30 gap-[1px]">
            {calendarCells.map((cell, idx) => {
              const dayTasks = searchedTasks.filter(t => extractDateString(t.dueDate) === cell.dateStr);
              
              return (
                <div key={idx} onClick={() => { if (dayTasks.length > 0) setSelectedDayTasks({ date: cell.dateStr, tasks: dayTasks }); else openFormModal(cell.dateStr); }}
                  className={`bg-white p-1 md:p-2 relative cursor-pointer hover:bg-milkyway overflow-hidden flex flex-col ${!cell.isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                >
                  <div className="flex justify-center mb-1 shrink-0">
                    <span className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-xs md:text-sm font-bold ${cell.dateStr === todayStr ? 'bg-[#1e3a8a] text-white' : !cell.isCurrentMonth ? 'text-galaxy/30' : 'text-galaxy/70'}`}>
                      {cell.day}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => {
                      const time = new Date(task.dueDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                      const isEvent = task.type === "EVENT";
                      
                      // PERBAIKAN VISUAL KALENDER: Beda warna Tugas (Biru) vs Acara (Kuning/Oranye)
                      let badgeStyle = "";
                      if (task.status === 'DONE' && !isEvent) {
                        badgeStyle = "bg-emerald-100 text-emerald-700 line-through";
                      } else if (isEvent) {
                        badgeStyle = "bg-amber-100/80 text-amber-900 border-amber-300/50 hover:bg-amber-200";
                      } else {
                        badgeStyle = "bg-sky-100/80 text-sky-900 border-sky-300/50 hover:bg-sky-200";
                      }

                      return (
                        <div key={task.id} onClick={(e) => { e.stopPropagation(); openFormModal("", task); }}
                          className={`text-[9px] md:text-[11px] font-bold px-1.5 py-0.5 rounded md:rounded-md truncate border transition-colors ${badgeStyle}`}
                        >
                          {task.status === 'DONE' && !isEvent ? '✓ ' : (isEvent ? '📅 ' : `${time} `)}{task.title}
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && <div className="text-[9px] md:text-[10px] font-bold text-galaxy/50 text-center pt-0.5">+ {dayTasks.length - 3} lainnya</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDayTasks && (
        <div className="fixed inset-0 bg-galaxy/50 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-xl">{new Date(selectedDayTasks.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <button onClick={() => setSelectedDayTasks(null)} className="hover:text-red-500"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {selectedDayTasks.tasks.map(task => {
                const isEvent = task.type === "EVENT";
                return (
                  <div key={task.id} className={`flex items-center justify-between p-3 border rounded-xl ${isEvent ? 'bg-amber-50/50 border-amber-100' : 'bg-sky-50/50 border-sky-100'}`}>
                    <div className="flex items-center gap-3">
                      {isEvent ? (
                         <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0"><CalendarDays className="w-3 h-3 text-amber-600" /></div>
                      ) : (
                        <button onClick={() => handleToggle(task.id, task.status)} className="hover:scale-110 shrink-0">
                          <CheckCircle2 className={`w-5 h-5 ${task.status === "DONE" ? "text-emerald-500" : "text-sky-600/30"}`} />
                        </button>
                      )}
                      <div>
                        <p className={`text-sm font-bold ${task.status === "DONE" && !isEvent ? "text-galaxy/40 line-through" : "text-galaxy"}`}>{task.title}</p>
                        <p className="text-[11px] font-bold text-galaxy/50">
                          {new Date(task.dueDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} 
                          {task.endDate ? ` - ${new Date(task.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}` : ''}
                        </p>
                        {/* Menampilkan Note jika ada */}
                        {task.note && <p className="text-[10px] text-galaxy/60 mt-1 italic leading-tight line-clamp-2">{task.note}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setSelectedDayTasks(null); openFormModal("", task); }} className="p-1 text-galaxy/40 hover:text-planetary"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(task.id)} className="p-1 text-galaxy/40 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-[20px] shadow-2xl p-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            <h3 className="font-extrabold text-[#1e3a8a] text-xl mb-6">{editingId ? "Edit" : "Add"} Schedule</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex bg-[#f1f5f9] rounded-xl p-1 mb-4">
                <button type="button" onClick={() => setFormData({...formData, type: "TASK"})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === "TASK" ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}>Task (Tugas)</button>
                <button type="button" onClick={() => setFormData({...formData, type: "EVENT"})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.type === "EVENT" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"}`}>Event (Acara)</button>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Title</label>
                <input type="text" autoFocus required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/40 focus:bg-white outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">From</label>
                  <input type="datetime-local" required value={formData.fromDate} onChange={(e) => setFormData({...formData, fromDate: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/40 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">To</label>
                  <input type="datetime-local" value={formData.toDate} onChange={(e) => setFormData({...formData, toDate: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#1e3a8a]/40 focus:bg-white outline-none" />
                </div>
              </div>

              {formData.type === "TASK" && (
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Category (Quadrant)</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:bg-white outline-none font-medium">
                    <option value="Q1">Q1 (Do First)</option><option value="Q2">Q2 (Schedule)</option><option value="Q3">Q3 (Delegate)</option><option value="Q4">Q4 (Eliminate)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Note / Description</label>
                <textarea rows={2} value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full bg-[#f1f5f9] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:bg-white outline-none resize-none custom-scrollbar" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isPending} className="w-full bg-[#2445B0] text-white py-3.5 rounded-xl font-bold hover:bg-[#1e3a8a] shadow-lg flex items-center justify-center">
                  {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null} Save Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}