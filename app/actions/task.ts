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

export async function getProjects() {
  const userId = await getCurrentUserId()
  return await prisma.project.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true }, 
    orderBy: { createdAt: 'desc' }
  })
}

// ==========================================
// 1. CREATE (SUDAH DITAMBAH TYPE, ENDDATE, NOTE)
// ==========================================
export async function createTask(title: string, quadrant: string, dueDateStr?: string, projectId?: string, type: string = "TASK", endDateStr?: string, note?: string) {
  const userId = await getCurrentUserId()
  
  await prisma.task.create({
    data: {
      title,
      quadrant, 
      status: "TODO", 
      type, // <-- INI PENYELAMAT KITA!
      userId,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null, // <-- UNTUK JAM SELESAI
      note: note || null, // <-- UNTUK CATATAN
      projectId: projectId || null, 
    }
  })
  revalidatePath('/dashboard/task')
  revalidatePath('/dashboard/jadwal')
}

// 2. READ
export async function getTasks() {
  const userId = await getCurrentUserId()
  return await prisma.task.findMany({
    where: { userId },
    include: {
      project: { select: { name: true } } 
    },
    orderBy: { createdAt: 'desc' }
  })
}

// 3. UPDATE STATUS (Ditambah pencatat waktu selesai untuk Grafik Dashboard)
export async function toggleTaskStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "TODO" ? "DONE" : "TODO"
  await prisma.task.update({
    where: { id },
    data: { 
      status: newStatus,
      completedAt: newStatus === "DONE" ? new Date() : null
    }
  })
  revalidatePath('/dashboard/task')
  revalidatePath('/dashboard/jadwal')
}

// ==========================================
// 4. UPDATE DETAILS (SUDAH DITAMBAH TYPE, ENDDATE, NOTE)
// ==========================================
export async function editTask(id: string, title: string, quadrant: string, dueDateStr?: string, projectId?: string, type: string = "TASK", endDateStr?: string, note?: string) {
  await prisma.task.update({
    where: { id },
    data: { 
      title, 
      quadrant, 
      type,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      endDate: endDateStr ? new Date(endDateStr) : null,
      note: note || null,
      projectId: projectId || null,
    }
  })
  revalidatePath('/dashboard/task')
  revalidatePath('/dashboard/jadwal')
}

// 5. DELETE
export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id }
  })
  revalidatePath('/dashboard/task')
  revalidatePath('/dashboard/jadwal')
}