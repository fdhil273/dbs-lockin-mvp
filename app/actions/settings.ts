"use server";

import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// Ambil ID User yang sedang aktif (Membaca session cookie)
const getUserId = async () => {
  try {
    const cookieStore = await cookies();
    // Kunci cookie disamakan dengan yang ada di dashboard
    const currentUserId = cookieStore.get("lockin_user_id")?.value;

    if (!currentUserId) {
      return null;
    }

    return currentUserId;
  } catch (e) { 
    return null; 
  }
};

// Mengambil Data Profil
export async function getUserProfile() {
  try {
    const userId = await getUserId();
    if (!userId) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    return user;
  } catch (error) { return null; }
}

// Menyimpan Perubahan Profil
export async function updateUserProfile(data: { name: string; birthDate: string; password?: string }) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false };

    // Siapkan data yang akan diupdate
    const updateData: any = {
      name: data.name, // atau username, tergantung penamaan di schema-mu
      birthDate: data.birthDate,
    };

    // Jika password diisi / diubah, ikut simpan (Note: di production asli, gunakan bcrypt hash)
    if (data.password && data.password !== "••••••••") {
      updateData.password = data.password;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return { success: true };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false };
  }
}