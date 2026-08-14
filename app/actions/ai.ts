"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lockin_user_id")?.value;
  if (!userId) throw new Error("Anda belum login!")
  return userId
}

export async function getChatHistory() {
  const userId = await getCurrentUserId();
  return await prisma.aiChat.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  });
}

// ==========================================
// FUNGSI 1: SIMPAN HASIL TRIAGE SEKALIGUS
// ==========================================
export async function saveTriageResult(triageData: any, projectId?: string) {
  const userId = await getCurrentUserId();

  if (triageData.summary || triageData.notes) {
    try {
      await prisma.note.create({
        data: {
          title: "AI Triage: Meeting Summary",
          content: `**SUMMARY:**\n${triageData.summary}\n\n**NOTES:**\n${triageData.notes}`,
          userId,
          projectId: projectId || null
        }
      });
    } catch (error) {
      console.error("Gagal menyimpan Note:", error);
    }
  }

  if (triageData.tasks && triageData.tasks.length > 0) {
    for (const t of triageData.tasks) {
      await prisma.task.create({
        data: {
          title: t.title,
          quadrant: t.quadrant || "Q2",
          type: "TASK",
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          userId,
          projectId: projectId || null
        }
      });
    }
  }

  if (triageData.events && triageData.events.length > 0) {
    for (const e of triageData.events) {
      await prisma.task.create({
        data: {
          title: e.title,
          quadrant: "Q2",
          type: "EVENT",
          dueDate: e.fromDate ? new Date(e.fromDate) : null,
          endDate: e.toDate ? new Date(e.toDate) : null,
          userId,
          projectId: projectId || null
        }
      });
    }
  }

  revalidatePath('/dashboard/task');
  revalidatePath('/dashboard/jadwal');
  revalidatePath('/dashboard/notes');
  revalidatePath('/dashboard');
  return { success: true };
}


// ==========================================
// FUNGSI 2: ASK AI (GEMINI 3.6 FLASH)
// ==========================================
export async function askAI(prompt: string) {
  const userId = await getCurrentUserId();
  
  const systemPrompt = `
    Kamu adalah "LockIn AI", asisten Triage Produktivitas.
    Tugasmu memproses transkrip meeting/instruksi dan mengubahnya menjadi struktur JSON.
    
    ATURAN MUTLAK:
    1. KELUARKAN HANYA FORMAT JSON MURNI TANPA BLOK KODE (tanpa \`\`\`json).
    2. Quadrant HANYA BOLEH bernilai: "Q1", "Q2", "Q3", atau "Q4".
    
    SKEMA JSON YANG WAJIB DIGUNAKAN:
    {
      "isTriage": true,
      "summary": "Ringkasan singkat dari meeting...",
      "notes": "Catatan tambahan atau detail spesifik...",
      "tasks": [
        { "title": "Nama tugas", "quadrant": "Q1", "dueDate": "2026-08-20T09:00:00Z" }
      ],
      "events": [
        { "title": "Nama jadwal", "fromDate": "2026-08-21T10:00:00Z", "toDate": "2026-08-21T12:00:00Z" }
      ]
    }
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 🔥 PERUBAHAN FINAL: Menggunakan model Gemini 3.6 Flash yang sesuai dengan timeline 2026!
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return JSON.stringify({ 
        isTriage: false, 
        message: `⚠️ Error Google: ${data.error?.message}` 
      });
    }

    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!aiResponse) {
      return JSON.stringify({ isTriage: false, message: "⚠️ AI menolak merespons." });
    }

    // Pembersihan ekstra
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    try {
      const parsedData = JSON.parse(aiResponse);
      parsedData.isTriage = true; 
      aiResponse = JSON.stringify(parsedData);
    } catch (parseError) {
      console.error("Gagal parse JSON:", parseError);
      return JSON.stringify({ 
        isTriage: false, 
        message: "AI merespons dengan format yang salah:\n" + aiResponse 
      });
    }

    await prisma.aiChat.create({
      data: { prompt, response: aiResponse, userId }
    });

    return aiResponse;
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return JSON.stringify({ isTriage: false, message: `⚠️ Sistem Gagal: ${error.message}` });
  }
}