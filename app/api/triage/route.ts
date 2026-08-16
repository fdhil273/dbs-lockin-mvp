import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { saveAiChat } from '@/app/actions/ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getActiveUserId() {
  try { const anyUser = await prisma.user.findFirst(); return anyUser ? anyUser.id : null; } 
  catch (e) { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, sessionId } = body;

    if (!transcript) return NextResponse.json({ error: "Transkrip kosong" }, { status: 400 });

    const userId = await getActiveUserId();
    
    // 1. Ambil Konteks Database (Task yang sudah ada)
    let dbContext = "Tidak ada data.";
    if (userId) {
      try {
        const userTasks = await prisma.task.findMany({ where: { userId: userId }, orderBy: { createdAt: 'desc' }, take: 10, select: { title: true, quadrant: true, type: true, dueDate: true } });
        if (userTasks.length > 0) dbContext = JSON.stringify(userTasks);
      } catch (dbError) { console.warn("Gagal query DB"); }
    }

    // 2. Ambil Riwayat Percakapan (Agar AI nyambung di sesi yang sama)
    let chatContext = "";
    if (userId && sessionId) {
      try {
        const pastChats = await prisma.aiChat.findMany({
          where: { userId, OR: [{ sessionId: sessionId }, { id: sessionId }] },
          orderBy: { createdAt: 'asc' },
          take: 6
        });
        if (pastChats.length > 0) {
          chatContext = pastChats.map(c => `User: ${c.prompt}\nAI: ${c.response}`).join("\n\n");
        }
      } catch (e) { console.warn("Gagal ambil history sesi"); }
    }

    // 3. Beritahu AI Waktu Sekarang (Penting untuk Jadwal & Kalender)
    const today = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
      Anda adalah LockIn AI, asisten produktivitas eksekutif.
      Waktu server saat ini: ${today}

      [DATA DATABASE JADWAL & TUGAS PENGGUNA]
      ${dbContext}
      
      [RIWAYAT OBROLAN SESI INI]
      ${chatContext || "Ini adalah pesan pertama dari pengguna."}
      
      Instruksi: Tentukan apakah ini "chat" atau "triage". JIKA ada riwayat obrolan di atas, gunakan konteks tersebut untuk menyambung pembicaraan.
      
      WAJIB membalas dengan JSON skema ini:
      {
        "type": "chat" atau "triage",
        "message": "Balasan obrolan ATAU ringkasan rapat",
        "tasks": [ 
          { "title": "Nama", "quadrant": "Q1/Q2/Q3/Q4", "assignee": "Nama", "dueDate": "YYYY-MM-DDTHH:mm:ssZ (Opsional isi jika ada)" } 
        ],
        "events": [ 
          { "title": "Deskripsi", "date": "YYYY-MM-DDTHH:mm:ssZ (Wajib diisi jika ada informasi waktu acara/jadwal)" } 
        ]
      }
      Teks Pengguna: "${transcript}"
    `;

    const result = await model.generateContent(prompt);
    const triageData = JSON.parse(result.response.text());

    // 4. Simpan ke Database
    let returnedSessionId = sessionId;
    try {
      if (userId) {
        const saved = await saveAiChat(transcript, triageData, sessionId);
        if (saved.success && saved.sessionId) returnedSessionId = saved.sessionId;
      }
    } catch (saveError) { console.error("Gagal simpan DB"); }

    return NextResponse.json({ ...triageData, sessionId: returnedSessionId }, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}