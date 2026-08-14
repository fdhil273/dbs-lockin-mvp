"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lockin_user_id")?.value;
  if (!userId) throw new Error("Anda belum login!")
  return userId
}

// 1. GET ALL NOTES
export async function getNotes() {
  const userId = await getCurrentUserId()
  return await prisma.note.findMany({
    where: { userId },
    include: {
      project: { select: { name: true } } // Minta Prisma mengambilkan nama Project-nya juga
    },
    orderBy: { createdAt: 'desc' }
  })
}

// 2. CREATE NOTE (Mendukung Project Relasi)
export async function createNote(title: string, content: string, projectId?: string) {
  const userId = await getCurrentUserId()
  await prisma.note.create({
    data: { 
      title, 
      content, 
      userId, 
      projectId: projectId || null 
    }
  })
  revalidatePath('/dashboard/notes')
}

// 3. EDIT NOTE (Mendukung pemindahan Project)
export async function editNote(id: string, title: string, content: string, projectId?: string) {
  await prisma.note.update({
    where: { id },
    data: { 
      title, 
      content,
      projectId: projectId || null 
    }
  })
  revalidatePath('/dashboard/notes')
}

// 4. DELETE NOTE
export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } })
  revalidatePath('/dashboard/notes')
}