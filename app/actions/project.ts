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
    include: { tasks: true, members: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProject(name: string) {
  const userId = await getCurrentUserId()
  await prisma.project.create({
    data: { name, ownerId: userId }
  })
  revalidatePath('/dashboard/project')
  revalidatePath('/dashboard/task') 
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } })
  revalidatePath('/dashboard/project')
  revalidatePath('/dashboard/task')
}

// DIUBAH: Tambahkan pengambilan data profil anggota
export async function getProjectById(projectId: string) {
  const userId = await getCurrentUserId();
  
  return await prisma.project.findFirst({
    where: { id: projectId }, 
    include: {
      tasks: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      members: { 
        include: { user: { select: { id: true, name: true, email: true } } } 
      }
    }
  });
}

// FUNGSI BARU: Tambah Anggota via Email
export async function addMemberToProject(projectId: string, email: string) {
  // 1. Cari apakah email terdaftar di LockIn
  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) return { error: "Email tidak ditemukan di sistem LockIn." };

  // 2. Cek apakah dia ownernya sendiri
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project?.ownerId === userToAdd.id) return { error: "Kamu adalah pemilik project ini." };

  // 3. Cek apakah sudah jadi member
  const existingMember = await prisma.projectMember.findFirst({
    where: { projectId, userId: userToAdd.id }
  });
  if (existingMember) return { error: "User sudah menjadi anggota." };

  // 4. Masukkan ke dalam project
  await prisma.projectMember.create({
    data: { projectId, userId: userToAdd.id }
  });
  
  return { success: true };
}