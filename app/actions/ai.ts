"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers"; // <-- TAMBAHAN WAJIB

const prisma = new PrismaClient();

// ==========================================
// 1. MENDAPATKAN USER ID DARI SESSION LOGIN
// ==========================================
const getUserId = async () => {
  try {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("lockin_user_id")?.value;
    
    if (!currentUserId) {
      return null;
    }
    return currentUserId;
  } catch (e) { 
    return null; 
  }
};

// ==========================================
// 2. MENGAMBIL DAFTAR SESI UNTUK SIDEBAR
// ==========================================
export async function getSidebarSessions() {
  try {
    const userId = await getUserId();
    if (!userId) return [];
    
    const chats = await prisma.aiChat.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: 'desc' } 
    });

    const sessionsMap = new Map();
    chats.forEach(chat => {
      const sId = chat.sessionId || chat.id;
      if (!sessionsMap.has(sId)) {
        sessionsMap.set(sId, {
          id: sId,
          title: chat.title || chat.prompt.substring(0, 25) + "...",
          createdAt: chat.createdAt
        });
      }
    });
    return Array.from(sessionsMap.values());
  } catch (error) { return []; }
}

// ==========================================
// 3. MENGAMBIL OBROLAN DALAM SATU SESI
// ==========================================
export async function getSessionChats(sessionId: string) {
  try {
    const userId = await getUserId();
    if (!userId) return [];
    
    const chats = await prisma.aiChat.findMany({
      where: { userId, OR: [{ sessionId: sessionId }, { id: sessionId }] },
      orderBy: { createdAt: 'asc' } 
    });

    return chats.map(chat => {
      let parsedResponse;
      try { parsedResponse = JSON.parse(chat.response); } 
      catch (e) { parsedResponse = { message: chat.response }; }
      return { id: chat.id, prompt: chat.prompt, triageData: parsedResponse, createdAt: chat.createdAt };
    });
  } catch (error) { return []; }
}

// ==========================================
// 4. MENYIMPAN CHAT BARU
// ==========================================
export async function saveAiChat(prompt: string, responseJson: any, sessionId?: string) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    let activeSessionId = sessionId;
    let sessionTitle = prompt.substring(0, 25) + "...";
    
    // Pertahankan judul jika ini sesi lanjutan
    if (activeSessionId) {
        const existing = await prisma.aiChat.findFirst({
            where: { userId, OR: [{ sessionId: activeSessionId }, { id: activeSessionId }] }
        });
        if (existing && existing.title) sessionTitle = existing.title;
    } else {
        activeSessionId = crypto.randomUUID(); // Menggunakan bawaan Node.js, tanpa package external!
    }

    await prisma.aiChat.create({
      data: {
        userId, prompt, response: JSON.stringify(responseJson),
        sessionId: activeSessionId, title: sessionTitle
      }
    });
    return { success: true, sessionId: activeSessionId };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 5. CRUD SIDEBAR (RENAME & DELETE)
// ==========================================
export async function renameSession(sessionId: string, newTitle: string) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false };
    await prisma.aiChat.updateMany({
      where: { userId, OR: [{ sessionId: sessionId }, { id: sessionId }] },
      data: { title: newTitle }
    });
    return { success: true };
  } catch (error) { return { success: false }; }
}

export async function deleteSession(sessionId: string) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false };
    await prisma.aiChat.deleteMany({
      where: { userId, OR: [{ sessionId: sessionId }, { id: sessionId }] }
    });
    return { success: true };
  } catch (error) { return { success: false }; }
}

// ==========================================
// 6. MENYIMPAN HASIL AI KE TABEL TASK/EVENT
// ==========================================
export async function saveTriageResult(data: any, projectId: string | null) {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");
    const validProjectId = projectId && projectId.trim() !== "" ? projectId : null;

    // Simpan Ringkasan ke Notes
    if (data.message || data.summary) {
      await prisma.note.create({ data: { title: "AI Meeting Summary", content: data.message || data.summary, aiSummary: data.message || data.summary, userId, projectId: validProjectId } });
    }
    
    // Simpan Tugas beserta Tanggalnya (jika ada)
    if (data.tasks && Array.isArray(data.tasks)) {
      const taskPromises = data.tasks.map((task: any) => {
        const noteContent = task.assignee ? `Ditugaskan kepada: ${task.assignee}` : null;
        const parsedDate = task.dueDate ? new Date(task.dueDate) : null;
        return prisma.task.create({ data: { title: task.title, quadrant: task.quadrant || "Q4", status: "TODO", type: "TASK", note: noteContent, dueDate: parsedDate, userId, projectId: validProjectId }});
      });
      await Promise.all(taskPromises);
    }
    
    // Simpan Jadwal/Event beserta Tanggalnya
    if (data.events && Array.isArray(data.events)) {
      const eventPromises = data.events.map((event: any) => {
        const parsedDate = event.date ? new Date(event.date) : null;
        return prisma.task.create({ data: { title: event.title, quadrant: "Q2", status: "TODO", type: "EVENT", dueDate: parsedDate, userId, projectId: validProjectId }});
      });
      await Promise.all(eventPromises);
    }
    
    return { success: true, message: "Tersimpan!" };
  } catch (error) { throw new Error("Gagal menyimpan ke DB"); }
}