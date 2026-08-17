"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Mic, MonitorUp, History, Send, Plus, 
  MessageSquare, StopCircle, PanelLeftClose, 
  PanelLeftOpen, User, RotateCw, Edit3, CalendarDays, 
  Folder, CheckCircle2, Loader2, Search, Pencil, Trash2, Check, X
} from "lucide-react";

import { getSidebarSessions, getSessionChats, saveTriageResult, renameSession, deleteSession } from "@/app/actions/ai";
import { getProjects } from "@/app/actions/task";

export default function AIAgentWorkspace() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionChats, setSessionChats] = useState<any[]>([]); 
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<"mic" | "screen" | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  
  const [projects, setProjects] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchSidebar = async () => {
    const history = await getSidebarSessions();
    setSessions(history);
  };

  useEffect(() => {
    fetchSidebar();
    getProjects().then(p => { if (p) setProjects(p); });
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      if (activeSessionId === "loading") return;
      getSessionChats(activeSessionId).then(chats => {
        setSessionChats(chats);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
    } else {
      setSessionChats([]);
    }
  }, [activeSessionId]);

  const handleRename = async (id: string) => {
    if (editTitleValue.trim() === "") {
        setEditingSessionId(null);
        return;
    }
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitleValue } : s));
    setEditingSessionId(null);
    await renameSession(id, editTitleValue);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus obrolan ini?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
      await deleteSession(id);
    }
  };

  const filteredSessions = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const processMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isProcessing) return;
    
    // Matikan rekaman jika sedang aktif
    if (isRecording) handleStopRecording();

    setIsProcessing(true);
    setInputText("");
    
    const tempUserChat = { id: Date.now().toString(), prompt: textToSend, triageData: null };
    setSessionChats(prev => [...prev, tempUserChat]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToSend, sessionId: activeSessionId })
      });
      
      if (!res.ok) throw new Error("Gagal mengambil respon");
      
      const data = await res.json();
      
      if (data.sessionId && data.sessionId !== activeSessionId) {
        setActiveSessionId(data.sessionId);
        await fetchSidebar(); 
      } else {
        setSessionChats(prev => [...prev, { id: Date.now().toString(), prompt: null, triageData: data }]);
      }
    } catch (error) {
      alert("Koneksi terputus. Silakan coba lagi.");
      setSessionChats(prev => prev.filter(c => c.id !== tempUserChat.id));
    } finally {
      setIsProcessing(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleStartRecording = async (mode: "mic" | "screen") => {
    try {
      let stream: MediaStream;
      if (mode === "mic") stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      else stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      
      streamRef.current = stream;
      setRecordMode(mode);
      setIsRecording(true);
      setLiveTranscript("");

      const DEEPGRAM_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      socketRef.current = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&language=id', ['token', DEEPGRAM_KEY as string]);

      socketRef.current.onopen = () => {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
        mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current.addEventListener('dataavailable', (e) => {
          if (e.data.size > 0 && socketRef.current?.readyState === 1) socketRef.current.send(e.data);
        });
        mediaRecorderRef.current.start(250); 
      };

      socketRef.current.onmessage = (message) => {
        const received = JSON.parse(message.data);
        if (received.type === 'Results') {
          const transcript = received.channel.alternatives[0]?.transcript;
          if (transcript) setLiveTranscript(prev => prev + " " + transcript);
        }
      };
      stream.getVideoTracks()[0]?.addEventListener('ended', () => handleStopRecording());
    } catch (error) { alert("Akses dibatalkan."); }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (socketRef.current) socketRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setRecordMode(null);
    if (liveTranscript.trim()) setInputText(prev => prev + " " + liveTranscript.trim());
    setLiveTranscript("");
  };

  const TriageCard = ({ data }: { data: any }) => {
    const [selectedProject, setSelectedProject] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleApprove = async () => {
      setIsSaving(true);
      try { await saveTriageResult(data, selectedProject); setIsSaved(true); } 
      catch (error) { alert("Gagal menyimpan ke Database."); } 
      finally { setIsSaving(false); }
    };

    if (!data) return null;

    return (
      <div className="relative bg-white border border-gray-200 p-5 rounded-2xl rounded-tl-none shadow-sm space-y-4 w-full">
        {isSaved && (<div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tersimpan</div>)}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100"><p className="text-gray-800 leading-relaxed">{data.message || data.summary}</p></div>
        {data.events?.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-500"/> Jadwal</h4>
            <div className="space-y-2">{data.events.map((e: any, i: number) => <div key={i} className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg text-sm text-indigo-900">📅 {e.title}</div>)}</div>
          </div>
        )}
        {data.tasks?.length > 0 && (
          <div>
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500"/> Tugas</h4>
            <div className="space-y-2">
              {data.tasks.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-lg">
                  <div><p className="text-sm font-medium text-gray-800">{t.title}</p>{t.assignee && <p className="text-xs text-gray-500">Ditugaskan: {t.assignee}</p>}</div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-md ${t.quadrant === 'Q1' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{t.quadrant}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {(data.tasks?.length > 0 || data.events?.length > 0) && !isSaved && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <div className="flex-1">
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none">
                <option value="">-- Tanpa Project --</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={handleApprove} disabled={isSaving} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-600 flex items-center shadow-sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Simpan
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white text-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      {/* SIDEBAR AREA */}
      <div className={`bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-72" : "w-0 border-r-0 overflow-hidden"}`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center w-72 shrink-0">
          <h2 className="font-bold text-gray-700">LockIn AI</h2>
          <button onClick={() => setActiveSessionId(null)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Percakapan Baru"><Plus className="w-4 h-4" /></button>
        </div>
        
        <div className="p-3 w-72 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Cari percakapan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 w-72 shrink-0 custom-scrollbar">
          {filteredSessions.map((item) => (
            <div key={item.id} onClick={() => { if (editingSessionId !== item.id) setActiveSessionId(item.id); }} className={`group relative w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${activeSessionId === item.id ? "bg-blue-50 border-blue-200 border text-blue-700" : "hover:bg-gray-100 border border-transparent text-gray-600"}`}>
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === item.id ? "text-blue-500" : "text-gray-400"}`} />
                {editingSessionId === item.id ? (
                  <input autoFocus type="text" value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRename(item.id); }} className="w-full bg-white border border-blue-300 rounded px-2 py-0.5 text-sm outline-none" />
                ) : (
                  <p className="text-sm font-semibold truncate pr-2">{item.title}</p>
                )}
              </div>
              {editingSessionId === item.id ? (
                <div className="flex gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleRename(item.id); }} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check className="w-3.5 h-3.5"/></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }} className="text-gray-400 hover:bg-gray-200 p-1 rounded"><X className="w-3.5 h-3.5"/></button>
                </div>
              ) : (
                <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-gradient-to-l from-gray-100 via-gray-100 pl-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(item.id); setEditTitleValue(item.title); }} className="text-gray-400 hover:text-blue-600 p-1" title="Ganti Nama"><Pencil className="w-3.5 h-3.5"/></button>
                  <button onClick={(e) => handleDelete(item.id, e)} className="text-gray-400 hover:text-red-600 p-1" title="Hapus Obrolan"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-white min-w-0 pb-32">
        <div className="absolute top-4 left-4 z-10"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 shadow-sm">{isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}</button></div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-8 custom-scrollbar">
          {sessionChats.length === 0 && !activeSessionId ? (
            <div className="h-full flex flex-col items-center justify-center text-center transform -translate-y-10">
              <Image src="/logo_Lockin.png" alt="LockIn" width={64} height={64} className="mb-6 opacity-80" />
              <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">Halo, Arsitek.</h1>
              <p className="text-gray-400 mt-4 max-w-md">Kirimkan instruksi atau rekam meeting. Percakapan ini akan tersimpan berkelanjutan dalam satu sesi.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-8 mt-10">
              {sessionChats.map((chat, idx) => (
                <div key={idx} className="space-y-6">
                  
                  {/* BUBBLE USER DENGAN TOMBOL EDIT */}
                  {chat.prompt && (
                    <div className="flex gap-4 group">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-700"/>
                      </div>
                      <div className="flex-1 flex items-end gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-800 mb-1">Anda</p>
                          <div className="text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-tl-none w-fit max-w-[100%] whitespace-pre-wrap">
                            {chat.prompt}
                          </div>
                        </div>
                        {/* Tombol Edit (Hanya Muncul saat di-Hover) */}
                        <button 
                          onClick={() => setInputText(chat.prompt || "")} 
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-full shadow-sm transition-all duration-200" 
                          title="Edit Pesan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* BUBBLE AI DENGAN TOMBOL REGENERATE */}
                  {chat.triageData && (
                    <div className="flex gap-4 group">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                        <Image src="/logo_Lockin.png" alt="AI" width={16} height={16} className="invert"/>
                      </div>
                      <div className="flex-1 flex items-start gap-2">
                        <div className="w-full">
                          <p className="text-sm font-bold text-gray-800 mb-1">LockIn AI</p>
                          <TriageCard data={chat.triageData} />
                        </div>
                        {/* Tombol Regenerate (Hanya Muncul saat di-Hover) */}
                        <button 
                          onClick={() => {
                            const prevPrompt = chat.prompt || (idx > 0 ? sessionChats[idx-1].prompt : "");
                            if (prevPrompt) processMessage(prevPrompt);
                          }} 
                          className="opacity-0 group-hover:opacity-100 mt-6 p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-full shadow-sm transition-all duration-200 shrink-0" 
                          title="Generate Ulang"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                </div>
              ))}
              {isProcessing && (
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center"><Image src="/logo_Lockin.png" alt="AI" width={16} height={16} className="invert"/></div>
                    <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 w-fit"><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> Memproses...</div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT AREA (MIC & SCREEN SHARE) */}
        <div className="p-6 bg-white absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-50 border border-gray-300 rounded-3xl flex items-center px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all gap-2">
              <button onClick={() => isRecording && recordMode === "mic" ? handleStopRecording() : handleStartRecording("mic")} disabled={isProcessing} className={`p-2.5 rounded-full ${isRecording && recordMode === "mic" ? "bg-red-100 text-red-600 ring-2 ring-red-400" : "bg-white border text-gray-500 hover:text-blue-600"}`}>
                {isRecording && recordMode === "mic" ? <StopCircle className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
              </button>
              
              <button onClick={() => isRecording && recordMode === "screen" ? handleStopRecording() : handleStartRecording("screen")} disabled={isProcessing} className={`p-2.5 rounded-full ${isRecording && recordMode === "screen" ? "bg-red-100 text-red-600 ring-2 ring-red-400" : "bg-white border text-gray-500 hover:text-blue-600"}`}>
                {isRecording && recordMode === "screen" ? <StopCircle className="w-5 h-5"/> : <MonitorUp className="w-5 h-5"/>}
              </button>

              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') processMessage(inputText); }} placeholder="Kirim pesan ke LockIn AI..." className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 px-2" disabled={isProcessing}/>
              <button onClick={() => processMessage(inputText)} disabled={isProcessing || !inputText.trim()} className={`p-2.5 rounded-full ${isProcessing || !inputText.trim() ? "bg-gray-300 text-gray-500" : "bg-gray-900 text-white hover:bg-blue-600"}`}><Send className="w-5 h-5 ml-0.5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}