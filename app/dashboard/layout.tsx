import Sidebar from '@/components/dashboard/Sidebar';

export const metadata = {
  title: 'Dashboard | FunnelGuard AI',
  description: 'Gerencie suas campanhas, funil e concorrentes com IA',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-dark-base">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
