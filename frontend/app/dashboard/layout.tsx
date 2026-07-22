import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar/>
      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
