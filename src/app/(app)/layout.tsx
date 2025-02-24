import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 