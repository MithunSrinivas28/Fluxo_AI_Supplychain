import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Topbar } from "@/components/Topbar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageTransition } from "@/components/PageTransition";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AppLayout = ({ title, children }: AppLayoutProps) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-4">
            <AppBreadcrumb />
          </div>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  </SidebarProvider>
);
