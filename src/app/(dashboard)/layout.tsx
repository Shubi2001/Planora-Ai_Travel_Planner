import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar: hidden on mobile (overlay), fixed on desktop */}
      <DashboardSidebar user={session.user} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardNav user={session.user} />
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </main>
      </div>
    </div>
  );
}
