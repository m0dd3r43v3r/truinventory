import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

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
        <main className={cn(
          "flex-1 overflow-y-auto p-8",
          "pl-24 md:pl-8"
        )}>{children}</main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
} 