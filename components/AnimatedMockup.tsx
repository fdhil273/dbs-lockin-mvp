"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, BrainCircuit, CheckCircle2, LayoutDashboard } from "lucide-react";

const slides = [
  {
    id: 1,
    icon: <Mic className="w-8 h-8 text-blue-500" />,
    title: "1. Merekam Transkrip",
    desc: "Mendengarkan instruksi... 'Budi bikin desain banner, rilis 20 Agustus.'",
    color: "bg-blue-50 border-blue-200"
  },
  {
    id: 2,
    icon: <BrainCircuit className="w-8 h-8 text-indigo-500" />,
    title: "2. AI Menganalisis",
    desc: "Mengekstrak tugas, menentukan prioritas kuadran Eisenhower...",
    color: "bg-indigo-50 border-indigo-200"
  },
  {
    id: 3,
    icon: <LayoutDashboard className="w-8 h-8 text-emerald-500" />,
    title: "3. Matriks Tereksekusi",
    desc: "Tugas berhasil masuk ke Q2. Siap dieksekusi oleh tim!",
    color: "bg-emerald-50 border-emerald-200"
  }
];

export default function AnimatedMockup() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play slider setiap 3.5 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[400px]">
      
      {/* Fake Browser Header */}
      <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-red-400"></div>
        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-400"></div>
        <div className="ml-4 bg-white px-3 py-1 text-xs text-gray-400 rounded-md w-48 shadow-sm">
          lockin.web.id/dashboard
        </div>
      </div>

      {/* Konten Animasi */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className={`flex flex-col items-center text-center p-8 rounded-2xl border-2 w-full max-w-md ${slides[currentIndex].color} shadow-sm`}
          >
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              {slides[currentIndex].icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {slides[currentIndex].title}
            </h3>
            <p className="text-slate-600 font-medium">
              {slides[currentIndex].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}