"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  BrainCircuit, 
  Folder, 
  FileText, 
  Calendar, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Task Matrix", icon: CheckSquare, path: "/dashboard/task" },
    { name: "AI Agent", icon: BrainCircuit, path: "/dashboard/ai-agent" },
    { name: "Project", icon: Folder, path: "/dashboard/project" },
    { name: "Notes", icon: FileText, path: "/dashboard/notes" },
    { name: "Jadwal", icon: Calendar, path: "/dashboard/jadwal" },
  ];

  return (
    <aside 
      className={`relative h-screen bg-planetary text-milkyway hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white text-planetary w-6 h-6 rounded-full border border-venus/50 flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div>
        <div className={`flex items-center justify-center border-b border-white/10 mb-6 transition-all duration-300 ${isCollapsed ? "h-20" : "h-24 flex-col"}`}>
          <Image src="/logo_Lockin.png" alt="LockIn Logo" width={isCollapsed ? 28 : 36} height={isCollapsed ? 28 : 36} className={`object-contain transition-all duration-300 ${isCollapsed ? "" : "mb-2"}`} />
          {!isCollapsed && <span className="text-xl font-bold tracking-widest text-sky uppercase animate-in fade-in duration-300">LockIn</span>}
        </div>
        
        <nav className="px-3 space-y-2">
          {menuItems.map((item) => {
            // PERBAIKAN BUG TAB GANDA DI SINI
            const isActive = item.path === '/dashboard' 
              ? pathname === '/dashboard' // Khusus Dashboard harus persis
              : pathname.startsWith(item.path);

            return (
              <Link 
                key={item.name} href={item.path} title={isCollapsed ? item.name : ""}
                className={`flex items-center py-3 rounded-xl font-medium transition-all duration-200 ${isCollapsed ? "justify-center px-0" : "px-4"} ${isActive ? "bg-white/15 text-white shadow-sm" : "text-sky/70 hover:bg-white/5 hover:text-white"}`}
              >
                <item.icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-4"} shrink-0 ${isActive ? "text-white" : "text-sky/70"}`} />
                {!isCollapsed && <span className="animate-in fade-in duration-300 whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3">
        {/* PERBAIKAN: Mengubah div menjadi Link agar mengarah ke halaman settings */}
        <Link 
          href="/dashboard/settings" 
          title={isCollapsed ? "Pengaturan" : ""}
          className={`bg-white/10 rounded-2xl flex items-center group hover:bg-white/15 transition-colors cursor-pointer mb-2 ${isCollapsed ? "p-2 justify-center" : "p-3 justify-between"}`}
        >
          <div className="flex items-center overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-milkyway text-planetary flex items-center justify-center font-bold text-lg shrink-0">F</div>
            {!isCollapsed && (
              <div className="ml-3 truncate animate-in fade-in duration-300">
                <p className="text-sm font-bold text-white truncate">fdhil273</p>
                <p className="text-[10px] text-sky/70 truncate uppercase tracking-wider">Product Manager</p>
              </div>
            )}
          </div>
          {!isCollapsed && <Settings className="w-4 h-4 text-sky/70 group-hover:text-white shrink-0 ml-2" />}
        </Link>
        
        <Link href="/" title={isCollapsed ? "Logout" : ""} className={`w-full flex items-center py-3 text-sky/70 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-medium transition-colors ${isCollapsed ? "justify-center px-0" : "px-4 justify-center"}`}>
          <LogOut className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} shrink-0`} />
          {!isCollapsed && <span className="animate-in fade-in duration-300 whitespace-nowrap">Logout</span>}
        </Link>
      </div>
    </aside>
  );
}