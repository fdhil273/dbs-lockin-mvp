"use client";

import AnimatedMockup from "@/components/AnimatedMockup";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  BrainCircuit, 
  CheckSquare, 
  LayoutGrid,
  FileText,
  ChevronDown,
  Users,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function LandingPage() {
  // 1. STATE UNTUK ANIMASI KATA (HERO)
  const actionWords = [
    { text: "BEKERJA", bg: "bg-sky", textCol: "text-planetary", dot: "bg-planetary" },
    { text: "BERPIKIR", bg: "bg-amber-100", textCol: "text-amber-900", dot: "bg-amber-500" },
    { text: "EKSEKUSI", bg: "bg-emerald-100", textCol: "text-emerald-900", dot: "bg-emerald-500" },
  ];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % actionWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [actionWords.length]);
  const currentWord = actionWords[wordIndex];

  // 2. STATE UNTUK FITUR INTERAKTIF (FEATURE SWITCHER)
  const [activeFeature, setActiveFeature] = useState(0);
  const features = [
    {
      title: "AI Auto-Triage",
      desc: "Ubah teks rapat berantakan menjadi daftar tugas terstruktur seketika.",
      icon: BrainCircuit
    },
    {
      title: "Priority Matrix",
      desc: "Visualisasikan dan eksekusi tugas dengan metode 4 Kuadran Eisenhower.",
      icon: CheckSquare
    },
    {
      title: "Team Workspace",
      desc: "Isolasi proyek, atur hak akses, dan pantau produktivitas tim secara real-time.",
      icon: Users
    }
  ];

  // 3. STATE UNTUK FAQ ACCORDION (ANIMASI JS)
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqData = [
    { q: "Apa itu LockIn?", a: "Aplikasi manajemen tugas berbasis AI. Kami memproses catatan rapat menjadi daftar tugas terstruktur menggunakan metode 4 Kuadran (Eisenhower Matrix) otomatis." },
    { q: "Bagaimana data saya disimpan?", a: "Kami menerapkan sistem isolasi data per Workspace (Project). Data Anda hanya bisa diakses oleh Anda dan anggota tim yang memiliki hak akses eksplisit." },
    { q: "Seberapa pintar AI-nya?", a: "AI kami menggunakan model bahasa dari OpenRouter yang dirancang khusus untuk membedah konteks, mendeteksi urgensi, dan menyusun strategi eksekusi." },
    { q: "Apakah ini berbayar?", a: "Anda bisa menggunakan LockIn secara gratis dengan kuota AI Agent bulanan. Opsi pro tersedia jika Anda membutuhkan fitur kolaborasi tanpa batas." }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-milkyway bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-galaxy font-sans selection:bg-planetary selection:text-white relative overflow-hidden">
      
      {/* Pendaran Cahaya BG */}
      <div className="absolute top-0 left-0 w-full h-full bg-planetary/[0.02] pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-planetary/15 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-milkyway/90 backdrop-blur-md border-b border-venus/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <Image src="/logo_Lockin.png" alt="LockIn Logo" width={32} height={32} className="object-contain" />
            <span className="text-xl font-bold text-galaxy tracking-wider">LockIn</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#how-it-works" className="text-sm font-medium text-galaxy/70 hover:text-planetary transition-colors">Cara Kerja</Link>
            <Link href="#features" className="text-sm font-medium text-galaxy/70 hover:text-planetary transition-colors">Fitur</Link>
            <Link href="#faq" className="text-sm font-medium text-galaxy/70 hover:text-planetary transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold text-galaxy hover:text-planetary transition-colors hidden md:block">
              Masuk
            </Link>
            <Link href="/login" className="bg-planetary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-galaxy transition-all shadow-sm">
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="pt-24 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-galaxy tracking-tight uppercase flex flex-col items-center justify-center mb-6">
            <span className="mb-3 md:mb-5">TIM DAN AI</span>
            <span className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <span className={`inline-flex items-center px-5 py-1.5 md:py-2 md:px-6 rounded-full border border-venus/50 shadow-sm transition-all duration-500 ${currentWord.bg} ${currentWord.textCol}`}>
                <span className={`w-3 h-3 md:w-4 md:h-4 rounded-full mr-2 md:mr-3 transition-colors duration-500 ${currentWord.dot}`}></span>
                <span className="text-3xl md:text-5xl tracking-tight mt-1">{currentWord.text}</span>
              </span>
              <span>BERSAMA.</span>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-galaxy/70 font-medium max-w-3xl mx-auto mb-10 leading-relaxed">
            Rapat berjam-jam seringkali berakhir dengan catatan mentah dan kebingungan. LockIn membedah kekacauan itu—menyulap transkrip menjadi matriks prioritas yang siap dieksekusi.
          </p>
          
          <div className="flex justify-center mb-12">
            <Link href="/login" className="bg-planetary text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:bg-galaxy transition-all shadow-md flex items-center group">
              Mulai Gunakan LockIn
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 3. HERO MOCKUP (DIPERBARUI DENGAN ANIMATED MOCKUP) */}
        <div className="max-w-5xl mx-auto px-6 relative">
          <AnimatedMockup />
        </div>
      </main>

      {/* 4. CARA KERJA */}
      <section id="how-it-works" className="py-24 bg-white relative z-10 border-t border-venus/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-galaxy mb-4 tracking-tight">Dari kekacauan menuju kejelasan.</h2>
            <p className="text-lg text-galaxy/70 max-w-2xl mx-auto">Tiga langkah sederhana bagaimana LockIn menghemat berjam-jam waktu tim Anda.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-venus/50 z-0"></div>
            {[
              { step: "1. Masukkan Catatan", icon: FileText, color: "text-planetary", desc: "Paste transkrip rapat, ide acak, atau hasil brainstorming yang panjang dan tidak teratur." },
              { step: "2. AI Membedah Data", icon: BrainCircuit, color: "text-planetary", desc: "Mesin AI LockIn otomatis menganalisis urgensi, dan membuat ringkasan tugas." },
              { step: "3. Matriks Tereksekusi", icon: LayoutGrid, color: "text-universe", desc: "Tugas langsung terpetakan ke dalam 4 kuadran prioritas, lengkap dengan langkah awal." }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center bg-white">
                <div className={`w-20 h-20 bg-milkyway rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-6 ${item.color}`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-galaxy mb-3">{item.step}</h3>
                <p className="text-galaxy/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FEATURES (Tab Dinamis ala SaaS Premium) */}
      <section id="features" className="py-24 bg-milkyway relative z-10 border-t border-venus/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-galaxy mb-4 tracking-tight">Fitur yang memikirkan fokus Anda.</h2>
            <p className="text-lg text-galaxy/70">Klik untuk melihat bagaimana AI LockIn bekerja di balik layar.</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            
            {/* Kiri: Tab Menu Interaktif */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {features.map((feat, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`text-left p-6 rounded-2xl transition-all duration-300 border ${
                    activeFeature === index 
                    ? "bg-white border-planetary shadow-md transform scale-[1.02]" 
                    : "bg-transparent border-transparent hover:bg-white/50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${activeFeature === index ? "bg-planetary text-white" : "bg-venus/50 text-galaxy"}`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h4 className={`text-xl font-bold mb-2 ${activeFeature === index ? "text-planetary" : "text-galaxy"}`}>{feat.title}</h4>
                  <p className="text-galaxy/70 text-sm leading-relaxed">{feat.desc}</p>
                </button>
              ))}
            </div>

            {/* Kanan: Dynamic UI Mockup (Berubah sesuai Tab) */}
            <div className="w-full lg:w-2/3 bg-white h-[400px] rounded-3xl border border-venus/50 shadow-xl overflow-hidden flex items-center justify-center p-8 relative transition-all duration-500">
              
              {activeFeature === 0 && (
                <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="bg-meteor/50 rounded-2xl p-6 border border-venus/30 mb-4">
                     <p className="text-xs text-galaxy/50 mb-2 font-mono">Teks Mentah:</p>
                     <p className="text-sm text-galaxy/80">&quot;Tolong buatkan presentasi UI untuk besok, lalu jadwalkan meeting dengan Rama minggu depan...&quot;</p>
                  </div>
                  <div className="flex justify-center my-4"><Sparkles className="w-6 h-6 text-planetary animate-pulse" /></div>
                  <div className="bg-white rounded-xl p-4 border border-planetary/30 shadow-sm flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-universe" />
                    <div>
                      <p className="text-sm font-bold text-galaxy">Buat presentasi UI</p>
                      <p className="text-xs text-red-500 font-semibold">Do First (Q1) - Besok</p>
                    </div>
                  </div>
                </div>
              )}

              {activeFeature === 1 && (
                <div className="w-full max-w-lg grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                  <div className="bg-red-50 rounded-xl p-5 border border-red-200 shadow-sm"><p className="text-red-700 font-bold mb-2">Q1: Do First</p><div className="h-12 bg-white rounded border border-red-100 mb-2"></div><div className="h-12 bg-white rounded border border-red-100"></div></div>
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 shadow-sm"><p className="text-blue-700 font-bold mb-2">Q2: Schedule</p><div className="h-12 bg-white rounded border border-blue-100"></div></div>
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200 shadow-sm"><p className="text-amber-700 font-bold mb-2">Q3: Delegate</p><div className="h-12 bg-white rounded border border-amber-100"></div></div>
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm"><p className="text-slate-600 font-bold mb-2">Q4: Eliminate</p></div>
                </div>
              )}

              {activeFeature === 2 && (
                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 space-y-4">
                  <div className="bg-white rounded-xl p-5 border border-venus/50 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-planetary text-white rounded-full flex items-center justify-center font-bold">F</div><div><p className="font-bold text-galaxy text-sm">fdhil273</p><p className="text-xs text-galaxy/50">Owner</p></div></div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-bold">Online</span>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-venus/50 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-universe text-white rounded-full flex items-center justify-center font-bold">R</div><div><p className="font-bold text-galaxy text-sm">ramaja</p><p className="text-xs text-galaxy/50">Editor</p></div></div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-bold">Offline</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION (Interactive JS Accordion) */}
      <section id="faq" className="bg-white py-24 relative z-10 border-t border-venus/30">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-galaxy mb-4">Pertanyaan yang sering diajukan</h2>
            <p className="text-galaxy/70 text-lg">Semua yang perlu Anda ketahui tentang LockIn.</p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                  openFaq === index ? "border-planetary shadow-md bg-milkyway/50" : "border-venus/50 hover:border-planetary/50"
                }`}
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                >
                  <span className={`font-bold text-lg transition-colors ${openFaq === index ? "text-planetary" : "text-galaxy"}`}>
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === index ? "rotate-180 text-planetary" : "text-galaxy/50"}`} />
                </button>
                <div 
                  className={`px-6 transition-all duration-300 ease-in-out ${
                    openFaq === index ? "max-h-40 opacity-100 pb-6" : "max-h-0 opacity-0 pb-0"
                  }`}
                >
                  <p className="text-galaxy/70 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-galaxy text-white pt-16 pb-8 border-t-4 border-planetary relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image src="/logo_Lockin.png" alt="LockIn Logo" width={24} height={24} className="object-contain grayscale brightness-200" />
              <span className="text-lg font-bold tracking-wider">LockIn</span>
            </div>
            <p className="text-white/60 text-sm max-w-sm mb-6">
              Sistem operasi produktivitas masa depan. Berhenti mencatat, mulai mengeksekusi dengan bantuan AI.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sky">Produk</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="#" className="hover:text-white transition-colors">AI Agent</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Priority Matrix</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Harga</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sky">Perusahaan</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="#" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Kontak</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10 pt-8 flex justify-between items-center text-xs text-white/40">
          <p>© 2026 LockIn Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}