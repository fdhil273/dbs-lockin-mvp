"use client";

import { useState, useEffect } from "react";
import { UserCircle2, CalendarDays, Lock, Camera, Edit, LogOut, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import { getUserProfile, updateUserProfile } from "@/app/actions/settings";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: "", // Menggunakan name/username dari DB
    email: "",
    birthDate: "",
    password: "••••••••" // Placeholder rahasia
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);

  // 1. AMBIL DATA DARI DATABASE SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getUserProfile();
      if (user) {
        setFormData({
          name: user.name || "Pengguna",
          email: user.email || "",
          birthDate: user.birthDate || "Belum diatur",
          password: "••••••••"
        });
      }
      setIsLoadingFetch(false);
    };
    fetchProfile();
  }, []);

  // 2. SIMPAN DATA KE DATABASE
  const handleSave = async () => {
    setIsSaving(true);
    
    const result = await updateUserProfile({
      name: formData.name,
      birthDate: formData.birthDate,
      password: formData.password
    });

    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
      setShowSuccess(true);
      // Reset password ke titik-titik lagi jika berhasil
      setFormData(prev => ({ ...prev, password: "••••••••" }));
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("Gagal menyimpan pengaturan ke Database.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoadingFetch) {
    return <div className="h-full flex items-center justify-center bg-[#f8fafc]"><Loader2 className="w-8 h-8 animate-spin text-[#2e42a5]" /></div>;
  }

  return (
    <div className="h-full flex flex-col p-6 md:p-10 overflow-y-auto custom-scrollbar bg-[#f8fafc] relative">
      
      {showSuccess && (
        <div className="absolute top-10 right-10 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-5 z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold">Data berhasil diperbarui ke Database!</span>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto pb-20">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e2a5e] mb-6 tracking-tight">Setting</h1>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="w-24 h-24 bg-[#e0e7ff] text-[#2e42a5] rounded-full flex items-center justify-center text-4xl font-bold">
                {formData.name.charAt(0).toUpperCase()}
              </div>
              <button className={`absolute bottom-0 right-0 p-1.5 rounded-full border-[3px] border-white transition-colors shadow-sm ${isEditing ? "bg-blue-600 hover:bg-blue-700 cursor-pointer" : "bg-[#2e42a5] opacity-70 cursor-not-allowed"}`}>
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-10">
            
            <section>
              <div className="flex items-start gap-3 mb-5">
                <UserCircle2 className="w-6 h-6 text-[#2e42a5] shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-[#2e42a5]">Account Information</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">Update Your Account Information</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-9">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Username</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing} 
                    className={`w-full bg-[#f8fafc] border-0 rounded-xl px-4 py-3.5 text-sm outline-none transition-all ${isEditing ? "text-gray-900 ring-2 ring-blue-100 focus:ring-[#2e42a5]" : "text-gray-500"}`} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Email Address</label>
                  {/* Email sengaja selalu di-disable agar aman dari konflik auth */}
                  <input 
                    type="text" 
                    value={formData.email} 
                    disabled 
                    className="w-full bg-[#f8fafc] border-0 rounded-xl px-4 py-3.5 text-sm outline-none text-gray-400 cursor-not-allowed" 
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-3 mb-5">
                <CalendarDays className="w-6 h-6 text-[#2e42a5] shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-[#2e42a5]">Personal</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">Help me to celebrate your milestone</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-9">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Birth Date</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY"
                    value={formData.birthDate} 
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    disabled={!isEditing} 
                    className={`w-full bg-[#f8fafc] border-0 rounded-xl px-4 py-3.5 text-sm outline-none transition-all ${isEditing ? "text-gray-900 ring-2 ring-blue-100 focus:ring-[#2e42a5]" : "text-gray-500"}`} 
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-3 mb-5">
                <Lock className="w-6 h-6 text-[#2e42a5] shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-[#2e42a5]">Security</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">Secure your workspace with a strong Password</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-0 md:ml-9">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">Password</label>
                  <input 
                    type={isEditing ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    disabled={!isEditing}
                    onFocus={() => {
                      if (formData.password === "••••••••") setFormData({...formData, password: ""});
                    }}
                    className={`w-full bg-[#f8fafc] border-0 rounded-xl px-4 py-3.5 text-sm outline-none transition-all ${isEditing ? "text-gray-900 ring-2 ring-blue-100 focus:ring-[#2e42a5]" : "text-gray-500"}`} 
                  />
                </div>
              </div>
            </section>

          </div>

          <div className="mt-12 pt-6 flex flex-wrap items-center justify-end gap-4">
            {isEditing ? (
              <>
                <button onClick={handleCancel} disabled={isSaving} className="bg-white border border-gray-200 text-gray-600 px-7 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving} className="bg-green-600 text-white px-7 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm w-[120px] justify-center">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="bg-[#2e42a5] text-white px-7 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-sm">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button className="bg-white border border-gray-200 text-[#1e2a5e] px-7 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}