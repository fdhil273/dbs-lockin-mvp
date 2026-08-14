"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, CheckCircle2, Quote, Loader2, AlertCircle } from "lucide-react";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    setIsLoading(true);

    if (!email || !password) {
      setError("Email dan password tidak boleh kosong.");
      setIsLoading(false);
      return;
    }

    const result = await loginUser(email, password);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    // DIKUNCI MENGGUNAKAN h-screen dan overflow-hidden
    <div className="h-screen w-full flex flex-col md:flex-row font-sans selection:bg-planetary selection:text-white overflow-hidden">
      
      {/* SISI KIRI: Formulir */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 lg:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="flex items-center space-x-3 mb-6 hover:opacity-80 transition-opacity">
              {/* Pastikan file logo.png ada di dalam folder public */}
              <Image src="/logo.png" alt="LockIn Logo" width={32} height={32} className="object-contain" />
              <span className="text-2xl font-bold text-planetary tracking-widest uppercase">LockIn</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-galaxy mb-2 tracking-tight">Selamat Datang</h1>
            <p className="text-galaxy/60 text-sm">Masuk untuk melanjutkan fokusmu hari ini.</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-galaxy mb-1.5 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alamat@email.com" 
                className="w-full bg-meteor/30 border border-venus/50 rounded-xl px-4 py-3 text-sm text-galaxy focus:outline-none focus:ring-2 focus:ring-planetary/50"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
                <label className="block text-xs font-bold text-galaxy">Password</label>
                <Link href="#" className="text-[10px] font-bold text-planetary hover:text-universe transition-colors">Lupa Password?</Link>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda" 
                className="w-full bg-meteor/30 border border-venus/50 rounded-xl px-4 py-3 text-sm text-galaxy focus:outline-none focus:ring-2 focus:ring-planetary/50"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white rounded-xl px-5 py-3.5 font-bold text-base transition-all shadow-md flex items-center justify-center group mt-6 ${
                isLoading ? "bg-galaxy cursor-not-allowed opacity-80" : "bg-planetary hover:bg-galaxy"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  Masuk Akun 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-galaxy/70">
            Belum memiliki akun?{" "}
            <Link href="/register" className="text-planetary hover:text-universe font-bold transition-colors">
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>

      {/* SISI KANAN: Visual (Skala disesuaikan) */}
      <div className="hidden md:flex w-1/2 h-full bg-milkyway relative flex-col items-center justify-center p-8 lg:p-12 overflow-hidden border-l border-venus/30 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute top-0 left-0 w-full h-full bg-planetary/[0.02] pointer-events-none z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-planetary/15 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-universe/10 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 w-full max-w-sm mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-2xl border border-venus/40 transform -rotate-2 hover:rotate-0 transition-transform duration-500 hover:scale-105">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-planetary rounded-2xl flex items-center justify-center text-white shadow-inner"><BrainCircuit className="w-5 h-5" /></div>
                <div><p className="text-sm font-bold text-galaxy">AI Triage Active</p><p className="text-[10px] text-galaxy/50">Processing notes...</p></div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
            </div>
            <div className="space-y-3">
              <div className="h-1.5 w-full bg-galaxy/5 rounded-full overflow-hidden"><div className="h-full bg-planetary w-3/4 rounded-full"></div></div>
              <div className="flex gap-2">
                <div className="h-16 w-1/2 bg-red-50 rounded-2xl border border-red-100 p-2.5"><div className="w-2 h-2 rounded-full bg-red-400 mb-2"></div><div className="h-1.5 w-3/4 bg-red-200 rounded mb-1.5"></div><div className="h-1.5 w-1/2 bg-red-200 rounded"></div></div>
                <div className="h-16 w-1/2 bg-blue-50 rounded-2xl border border-blue-100 p-2.5"><div className="w-2 h-2 rounded-full bg-blue-400 mb-2"></div><div className="h-1.5 w-2/3 bg-blue-200 rounded mb-1.5"></div></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-venus/40 flex items-center gap-3 transform translate-x-4 rotate-3 hover:rotate-0 transition-transform duration-500">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div><p className="text-sm font-bold text-galaxy">Matriks Siap!</p><p className="text-[10px] text-galaxy/50">4 tugas teridentifikasi</p></div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-sm mt-2 bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white shadow-md">
          <Quote className="w-6 h-6 text-planetary/30 mb-2" />
          <p className="text-sm text-galaxy/80 font-medium italic mb-4 leading-relaxed">"Semenjak menggunakan LockIn, tim kami menghemat 10 jam per minggu dari sekadar menyusun jadwal dan to-do list."</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-galaxy flex items-center justify-center text-white text-xs font-bold shadow-inner">R</div>
            <div><p className="text-xs font-bold text-galaxy">Rama J.</p><p className="text-[10px] text-galaxy/50 uppercase tracking-widest font-semibold mt-0.5">Product Manager</p></div>
          </div>
        </div>

      </div>
    </div>
  );
}