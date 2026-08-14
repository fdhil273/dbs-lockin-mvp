"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Send, Bot, User, Loader2, Sparkles, BrainCircuit, CheckCircle2, CalendarDays, StickyNote, Folder, Mic, Square, ScreenShare } from "lucide-react";
import { getChatHistory, askAI, saveTriageResult } from "@/app/actions/ai";
import { getProjects } from "@/app/actions/task";

export default function AiAgentPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inputData, setInputData] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingFetch, setIsLoadingFetch] = useState(true);
  
  // State untuk Perekam Suara & Deepgram
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoadingFetch(true);
    const [history, projData] = await Promise.all([getChatHistory(), getProjects()]);
    setMessages(history);
    setProjects(projData);
    setIsLoadingFetch(false);
    scrollToBottom();
  };

  useEffect(() => { fetchData(); }, []);

  // Pastikan mematikan semua saat komponen di-unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  // ==========================================
  // FITUR AI MEETING (DEEPGRAM SCREEN SHARE AUDIO)
  // ==========================================
  const toggleListening = () => {
    if (isListening || connectionStatus === "connecting") {
      stopListening();
    } else {
      startDeepgramSession();
    }
  };

  const startDeepgramSession = async () => {
    try {
      setConnectionStatus("connecting");
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        alert("Deepgram API Key tidak ditemukan di .env");
        setConnectionStatus("disconnected");
        return;
      }

      // 1. Minta akses Screen/Tab Audio
      // Penting: Pengguna harus memilih tab Google Meet dan MENCENTANG "Share tab audio"
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" }, // Hanya perlu untuk memicu permintaan audio browser
        audio: true
      });
      audioStreamRef.current = stream;

      // 2. Buat koneksi WebSocket ke Deepgram (Nova-3, Bahasa Indonesia)
      // model=nova-3 & language=id
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-3&language=id&smart_format=true', [
        'token', apiKey
      ]);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus("connected");
        setIsListening(true);
        
        // 3. Tangkap audio dan kirim ke Deepgram
        // Menggunakan MediaRecorder untuk memecah audio menjadi *chunks*
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === 1) {
            socket.send(event.data);
          }
        });

        // Kirim potongan audio setiap 250 milidetik
        mediaRecorder.start(250);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        
        // Deepgram mengirim hasil interim (sementara) dan final.
        // Kita hanya mengambil yang sudah final agar teksnya stabil.
        if (transcript && received.is_final) {
          setInputData(prev => {
            const separator = prev.trim() ? " " : "";
            return (prev + separator + transcript).trim();
          });
        }
      };

      socket.onclose = () => {
        stopListening();
      };

      socket.onerror = (error) => {
        console.error("Deepgram Error:", error);
        stopListening();
      };

      // Matikan perekaman jika user mengeklik "Stop Sharing" di browser UI
      stream.getTracks().forEach(track => {
        track.onended = () => stopListening();
      });

    } catch (err) {
      console.error("Gagal mendapatkan akses layar/audio:", err);
      alert("Harap izinkan akses Screen Share dan pastikan 'Share Tab Audio' dicentang.");
      setConnectionStatus("disconnected");
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setConnectionStatus("disconnected");
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };
  // ==========================================

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputData.trim()) return;

    if (isListening) stopListening();

    const userMessage = inputData;
    setInputData("");

    setMessages(prev => [...prev, { prompt: userMessage, response: "", isTemporary: true }]);
    scrollToBottom();

    startTransition(async () => {
      const aiResponse = await askAI(userMessage);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { prompt: userMessage, response: aiResponse };
        return newMsgs;
      });
      scrollToBottom();
    });
  };

  const TriageCard = ({ data, msgIndex }: { data: any, msgIndex: number }) => {
    const [selectedProject, setSelectedProject] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleApprove = async () => {
      setIsSaving(true);
      await saveTriageResult(data, selectedProject);
      setIsSaving(false);
      setIsSaved(true);
    };

    if (isSaved) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-800 text-sm">Triage Disetujui & Disimpan!</h4>
            <p className="text-xs text-emerald-600">Catatan, Tugas, dan Jadwal telah ditambahkan ke database.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-venus/60 rounded-2xl overflow-hidden shadow-sm mt-2 w-full md:min-w-[400px]">
        <div className="bg-[#1e3a8a] px-4 py-3 text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5" />
          <h4 className="font-bold text-sm">Hasil Triage AI (Menunggu Validasi)</h4>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1 text-amber-800"><StickyNote className="w-4 h-4"/> <span className="font-bold text-xs">Summary & Notes</span></div>
            <p className="text-xs text-amber-900 leading-relaxed">{data.summary}</p>
          </div>

          {data.tasks && data.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sky-800"><CheckCircle2 className="w-4 h-4"/> <span className="font-bold text-xs">Tugas Terdeteksi ({data.tasks.length})</span></div>
              <div className="space-y-2">
                {data.tasks.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-sky-50 px-3 py-2 rounded-lg text-xs text-sky-900 border border-sky-100">
                    <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm">{t.quadrant}</span> {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.events && data.events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-800"><CalendarDays className="w-4 h-4"/> <span className="font-bold text-xs">Jadwal Terdeteksi ({data.events.length})</span></div>
              <div className="space-y-2">
                {data.events.map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg text-xs text-indigo-900 border border-indigo-100">
                    📅 {e.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#F8F9FB] p-4 border-t border-venus/50 flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold text-galaxy/60 mb-1 flex items-center gap-1"><Folder className="w-3 h-3"/> Simpan ke Project (Opsional)</label>
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full bg-white border border-venus/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1e3a8a] text-galaxy font-medium">
              <option value="">-- Tidak masuk project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={handleApprove} disabled={isSaving} className="w-full bg-[#2445B0] text-white py-2.5 rounded-lg font-bold text-xs hover:bg-[#1e3a8a] transition-colors flex items-center justify-center shadow-md">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Approve & Save Triage
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full max-w-5xl mx-auto flex flex-col relative overflow-hidden">
      
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <div className="w-14 h-14 bg-[#1e3a8a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1e3a8a]/20">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-galaxy flex items-center gap-2">
            Deepgram STT Engine <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-galaxy/60 text-sm font-medium">Rekam audio Google Meet secara langsung via Screen Share.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-venus/50 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 custom-scrollbar bg-slate-50/50">
          {isLoadingFetch ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#1e3a8a] animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-70">
              <Bot className="w-16 h-16 text-galaxy/20 mb-4" />
              <p className="text-galaxy/60 font-bold text-center max-w-md text-sm leading-relaxed">
                Halo! Tekan tombol Screen Share di bawah, lalu pilih tab Google Meet kamu. Pastikan untuk mencentang <span className="font-extrabold">"Share tab audio"</span> agar aku bisa merekam percakapan klien dan merangkumnya untukmu.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              let triageData = null;
              let normalText = msg.response;
              
              if (!msg.isTemporary) {
                try {
                  const parsed = JSON.parse(msg.response);
                  if (parsed.isTriage) triageData = parsed;
                  else normalText = parsed.message || msg.response;
                } catch (e) {}
              }

              return (
                <div key={idx} className="space-y-6">
                  <div className="flex justify-end gap-4">
                    <div className="max-w-[80%] bg-[#1e3a8a] text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm font-medium leading-relaxed">
                      {msg.prompt}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-planetary/10 border border-planetary/30 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-planetary" />
                    </div>
                  </div>

                  <div className="flex justify-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="max-w-[90%]">
                      {msg.isTemporary ? (
                        <div className="bg-white border border-venus/60 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-galaxy/40 font-medium flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Sedang menganalisis struktur meeting...
                        </div>
                      ) : triageData ? (
                        <TriageCard data={triageData} msgIndex={idx} />
                      ) : (
                        <div className="bg-white border border-venus/60 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-galaxy/80 font-medium whitespace-pre-wrap">
                          {normalText}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT & RECORD AREA */}
        <div className="p-4 bg-white border-t border-venus/50 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-end gap-3 max-w-4xl mx-auto">
            
            {/* TOMBOL DEEPGRAM SCREEN SHARE */}
            <button 
              type="button" 
              onClick={toggleListening}
              disabled={connectionStatus === "connecting"}
              className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md border ${
                isListening 
                ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                : connectionStatus === "connecting"
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
              }`}
              title={isListening ? "Hentikan Perekaman" : "Mulai Screen Share Audio"}
            >
              {connectionStatus === "connecting" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isListening ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <ScreenShare className="w-5 h-5" />
              )}
            </button>

            <textarea
              value={inputData} onChange={(e) => setInputData(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={
                connectionStatus === "connecting" ? "Menghubungkan ke Deepgram..." :
                isListening ? "Merekam suara dari Tab (Bicara atau putar audio)..." : 
                "Ketik manual atau klik ikon Screen Share untuk merekam meeting online..."
              }
              className={`w-full border rounded-2xl pl-4 pr-14 py-4 text-sm focus:ring-2 focus:ring-[#1e3a8a]/30 transition-all text-slate-800 outline-none resize-none custom-scrollbar ${isListening ? 'bg-red-50/50 border-red-200' : 'bg-[#f1f5f9] border-transparent focus:bg-white'}`}
              rows={2} style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            
            <button type="submit" disabled={isPending || (!inputData.trim() && !isListening)} className="absolute right-3 bottom-2 w-10 h-10 bg-[#1e3a8a] text-white rounded-xl flex items-center justify-center hover:bg-planetary transition-colors disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}