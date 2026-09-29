import { DemoProvider } from "@/features/demo/DemoProvider";
import { SessionGate } from "@/features/auth/SessionGate";
import { DashboardHeader } from "@/widgets/dashboard-header";
import { DashboardNotifications } from "@/widgets/dashboard-notifications/ui/DashboardNotifications";
import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGate><DemoProvider><div className="flex flex-col md:flex-row min-h-screen w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <DashboardNotifications />
    </div></DemoProvider></SessionGate>
  );
}
