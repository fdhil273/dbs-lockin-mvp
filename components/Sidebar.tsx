"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // STATE UNTUK DATA USER DINAMIS
  const [userName, setUserName] = useState("Memuat...");
  const [userInitial, setUserInitial] = useState("-");
  const [userRole, setUserRole] = useState("MEMBER"); 

  // AMBIL DATA DARI DATABASE SAAT SIDEBAR MUNCUL
  useEffect(() => {
    setIsMobileOpen(false); // Tutup sidebar mobile otomatis saat pindah halaman
    
    const fetchUser = async () => {
      try {
        const { getUserProfile } = await import("@/app/actions/settings");
        const user = await getUserProfile();
        
        if (user) {
          const name = user.name || "Pengguna";
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
          // Menarik role dari database (default ke "MEMBER" jika kosong)
          setUserRole(user.role || "MEMBER"); 
        } else {
          setUserName("Tamu");
          setUserInitial("T");
          setUserRole("-");
        }
      } catch (error) {
        setUserName("User");
        setUserInitial("U");
        setUserRole("MEMBER");
      }
    };
    
    fetchUser();
  }, [pathname]);

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
      {/* TOMBOL HAMBURGER MENGAMBANG DI HP */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className={`md:hidden fixed bottom-6 right-6 z-[90] p-4 bg-[#1e2a5e] text-white rounded-full shadow-2xl active:scale-95 transition-all ${isMobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* OVERLAY GELAP SAAT MENU HP TERBUKA */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[95] backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR UTAMA */}
      <aside 
        className={`fixed md:relative top-0 left-0 z-[100] h-[100dvh] bg-planetary text-milkyway flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isCollapsed ? "w-20" : "w-64"} 
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 text-white/50 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 bg-white text-planetary w-6 h-6 rounded-full border border-venus/50 items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div>
          <div className={`flex items-center justify-center border-b border-white/10 mb-6 transition-all duration-300 mt-6 md:mt-0 ${isCollapsed ? "h-20" : "h-24 flex-col"}`}>
            <Image src="/logo_Lockin.png" alt="LockIn Logo" width={isCollapsed ? 28 : 36} height={isCollapsed ? 28 : 36} className={`object-contain transition-all duration-300 ${isCollapsed ? "" : "mb-2"}`} />
            {!isCollapsed && <span className="text-xl font-bold tracking-widest text-sky uppercase animate-in fade-in duration-300">LockIn</span>}
          </div>
          
          <nav className="px-3 space-y-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
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

        <div className="p-3 mb-4 md:mb-0">
          <Link 
            href="/dashboard/settings" 
            title={isCollapsed ? "Pengaturan" : ""}
            className={`bg-white/10 rounded-2xl flex items-center group hover:bg-white/15 transition-colors cursor-pointer mb-2 ${isCollapsed ? "p-2 justify-center" : "p-3 justify-between"}`}
          >
            <div className="flex items-center overflow-hidden">
              {/* INISIAL DINAMIS */}
              <div className="w-10 h-10 rounded-full bg-milkyway text-planetary flex items-center justify-center font-bold text-lg shrink-0">
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="ml-3 truncate animate-in fade-in duration-300">
                  {/* NAMA DAN ROLE DINAMIS */}
                  <p className="text-sm font-bold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-sky/70 truncate uppercase tracking-wider">{userRole}</p>
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