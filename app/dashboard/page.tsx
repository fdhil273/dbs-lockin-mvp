import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  // 1. CEK SIAPA YANG SEDANG LOGIN
  const cookieStore = await cookies();
  const userId = cookieStore.get("lockin_user_id")?.value;

  if (!userId) {
    redirect("/login");
  }

  // 2. AMBIL SEMUA DATA DARI DATABASE
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  const allData = await prisma.task.findMany({
    where: { userId }
  });

  const aiHistory = await prisma.aiChat.findMany({ 
    where: { userId }, 
    orderBy: { createdAt: 'desc' },
    take: 3 
  });

  // 3. HITUNG STATISTIK TUGAS (HANYA TYPE "TASK")
  const tasks = allData.filter(d => d.type === "TASK" || !d.type);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "DONE").length;
  const activeTasks = totalTasks - doneTasks;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  // 4. FILTER JADWAL HARI INI (HANYA TYPE "EVENT")
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  const todayStr = new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  
  const todayEvents = allData.filter(d => {
    if (d.type !== "EVENT" || !d.dueDate) return false;
    const eventDateStr = new Date(d.dueDate.getTime() - tzOffset).toISOString().split('T')[0];
    return eventDateStr === todayStr;
  });

  // 5. LOGIKA GRAFIK PRODUKTIVITAS (7 Hari Terakhir)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d.getTime());
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const trendData = last7Days.map(date => {
    const targetDateStr = new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
    const count = tasks.filter(t => {
      if (t.status !== "DONE") return false;
      // Gunakan updatedAt untuk mengetahui kapan tugas diselesaikan
      const completedDateStr = new Date(t.updatedAt.getTime() - tzOffset).toISOString().split('T')[0];
      return completedDateStr === targetDateStr;
    }).length;

    return {
      dayName: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      count
    };
  });

  const maxCount = Math.max(...trendData.map(d => d.count), 1);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-galaxy mb-1">Dashboard</h1>
          <p className="text-planetary font-bold text-lg">Selamat Datang Kembali, {user?.name || "Arsitek"} 👋</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <p className="text-galaxy/50 text-sm font-semibold mb-2">Total Tugas Aktif (Pending)</p>
            <h2 className="text-4xl font-extrabold text-planetary">{activeTasks} <span className="text-lg font-bold text-galaxy/40">Tugas</span></h2>
          </div>

          {/* Grafik Produktivitas Hidup */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-galaxy">Tren Produktivitas (7 Hari Terakhir)</h3>
            </div>
            
            {/* INJEKSI MESIN GRAFIK KE DALAM UI LAMA */}
            <div className="h-48 w-full border-b border-l border-venus/30 relative flex items-end justify-between px-2 gap-2 pb-2">
              {trendData.map((data, idx) => {
                const heightPercentage = (data.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 w-full h-full group">
                    <div className="w-full h-full flex items-end justify-center relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-galaxy text-white text-[10px] py-1 px-2 rounded font-bold transition-opacity z-10">
                        {data.count} Selesai
                      </div>
                      <div 
                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ${data.count > 0 ? 'bg-planetary group-hover:bg-planetary/80' : 'bg-venus/20'}`}
                        style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-galaxy/40 uppercase absolute -bottom-6">{data.dayName}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-8"></div> {/* Spacer bawah grafik */}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <h3 className="font-bold text-galaxy mb-4">Weekly Summary</h3>
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-galaxy/70">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">Tugas Selesai: <span className="font-bold text-galaxy">{doneTasks} / {totalTasks}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-galaxy/70">
                  <Clock className="w-5 h-5 text-galaxy/30" />
                  <span className="font-medium">Waktu Fokus: <span className="font-bold text-galaxy">0 Jam</span></span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-xs text-galaxy/40 font-bold mb-1">
                  <span>Progress ({progressPercentage}%)</span>
                </div>
                <div className="h-2 w-full bg-venus/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-planetary rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div className="space-y-6">
          
          {/* Jadwal Dinamis */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <h3 className="font-bold text-galaxy mb-4">Jadwal hari ini</h3>
            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="bg-sky/20 rounded-xl p-4 border border-sky/30">
                  <p className="font-bold text-galaxy text-sm">Belum ada jadwal</p>
                  <p className="text-xs text-galaxy/60 mt-1">Nikmati harimu!</p>
                </div>
              ) : (
                todayEvents.map(event => (
                  <div key={event.id} className="bg-sky/10 border border-sky/20 p-3 rounded-xl flex flex-col">
                    <p className="text-sm font-bold text-planetary line-clamp-1">{event.title}</p>
                    <p className="text-[11px] font-semibold text-galaxy/50 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {event.dueDate ? new Date(event.dueDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI History Dinamis */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <h3 className="font-bold text-galaxy mb-4">Aktivitas AI Terbaru</h3>
            <div className="space-y-3">
              {aiHistory.length === 0 ? (
                <p className="text-sm text-galaxy/40 italic">Belum ada interaksi dengan AI.</p>
              ) : (
                aiHistory.map(chat => (
                  <div key={chat.id} className="bg-[#F8F9FB] border border-venus/40 p-3 rounded-xl group relative overflow-hidden">
                    <p className="text-[10px] font-bold text-planetary flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3" /> Input Anda
                    </p>
                    <p className="text-xs font-semibold text-galaxy line-clamp-2">{chat.prompt}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-venus/30">
            <h3 className="font-bold text-galaxy mb-4">Laporan Eksekusi</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><ArrowUpRight className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-galaxy/50 font-semibold">Tugas Diselesaikan</p>
                  <p className="text-lg font-extrabold text-galaxy">{doneTasks} <span className="text-xs font-normal">tugas</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0"><ArrowDownRight className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-galaxy/50 font-semibold">Tugas Tertunda</p>
                  <p className="text-lg font-extrabold text-galaxy">{activeTasks} <span className="text-xs font-normal">tugas</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}