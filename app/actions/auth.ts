"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"

// 1. REGISTER
export async function registerUser(name: string, email: string, pass: string) {
  try {
    if (pass.length < 6) return { error: "Password minimal harus 6 karakter." }
    
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return { error: "Akun dengan email ini sudah terdaftar." }

    await prisma.user.create({
      data: { name, email, password: pass }
    })
    
    return { success: true }
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);
    return { error: "Gagal menyambung ke Database. Pastikan npx prisma db push sudah berhasil." }
  }
}

// 2. LOGIN
export async function loginUser(email: string, pass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) return { error: "Akun tidak ditemukan. Silakan daftar terlebih dahulu." }
    if (user.password !== pass) return { error: "Password salah. Coba lagi." }

    // PERBAIKAN NEXT.JS TERBARU: Wajib menggunakan 'await cookies()'
    const cookieStore = await cookies();
    cookieStore.set("lockin_user_id", user.id, { maxAge: 60 * 60 * 24 * 7 });
    
    return { success: true }
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    return { error: "Gagal menyambung ke Database. Pastikan npx prisma db push sudah berhasil." }
  }
}

// 3. LOGOUT
export async function logoutUser() {
  // PERBAIKAN NEXT.JS TERBARU
  const cookieStore = await cookies();
  cookieStore.delete("lockin_user_id");
}