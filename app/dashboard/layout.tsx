import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Latar belakang aplikasi menggunakan abu-abu super muda agar kartu putih terlihat menonjol
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden font-sans selection:bg-planetary selection:text-white">
      <Sidebar />
      {/* Area utama (panggung) yang bisa di-scroll */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}