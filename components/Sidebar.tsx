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
  ChevronRight,
  User
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Menu untuk Desktop
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Task Matrix", icon: CheckSquare, path: "/dashboard/task" },
    { name: "AI Agent", icon: BrainCircuit, path: "/dashboard/ai-agent" },
    { name: "Project", icon: Folder, path: "/dashboard/project" },
    { name: "Notes", icon: FileText, path: "/dashboard/notes" },
    { name: "Jadwal", icon: Calendar, path: "/dashboard/jadwal" },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* 1. MOBILE BOTTOM NAVIGATION (HANYA MUNCUL DI HP)          */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-[80] px-8 py-5 flex justify-between items-center">
        
        {/* Kiri: Dashboard & Jadwal */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="relative group">
            <LayoutDashboard className={`w-6 h-6 transition-colors ${pathname === '/dashboard' ? 'text-[#1e2a5e]' : 'text-gray-300'}`} />
            {pathname === '/dashboard' && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1e2a5e] rounded-full"></span>}
          </Link>
          <Link href="/dashboard/jadwal" className="relative group">
            <Calendar className={`w-6 h-6 transition-colors ${pathname.startsWith('/dashboard/jadwal') ? 'text-[#1e2a5e]' : 'text-gray-300'}`} />
            {pathname.startsWith('/dashboard/jadwal') && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1e2a5e] rounded-full"></span>}
          </Link>
        </div>

        {/* TENGAH: Tombol AI Agent Melayang (Ala Referensi UI) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          <Link 
            href="/dashboard/ai-agent" 
            className="w-16 h-16 bg-[#ffad4d] rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 hover:scale-105 transition-transform border-[6px] border-[#f8fafc]"
          >
            <BrainCircuit className="w-7 h-7 text-white" />
          </Link>
        </div>

        {/* Kanan: Task Matrix & Settings/Profil */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard/task" className="relative group">
            <CheckSquare className={`w-6 h-6 transition-colors ${pathname.startsWith('/dashboard/task') ? 'text-[#1e2a5e]' : 'text-gray-300'}`} />
            {pathname.startsWith('/dashboard/task') && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1e2a5e] rounded-full"></span>}
          </Link>
          <Link href="/dashboard/settings" className="relative group">
            <User className={`w-6 h-6 transition-colors ${pathname.startsWith('/dashboard/settings') ? 'text-[#1e2a5e]' : 'text-gray-300'}`} />
            {pathname.startsWith('/dashboard/settings') && <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1e2a5e] rounded-full"></span>}
          </Link>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* 2. SIDEBAR DESKTOP (TIDAK BERUBAH)                        */}
      {/* ========================================================= */}
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
              const isActive = item.path === '/dashboard' 
                ? pathname === '/dashboard' 
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
    </>
  );
}