"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  itemId: string | null;
  details: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not admin
    if (session?.user.role !== "ADMIN") {
      router.push("/inventory");
      return;
    }

    async function fetchLogs() {
      try {
        const response = await fetch("/api/audit-logs");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, [session, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="px-4 py-2 text-sm">
                    {format(new Date(log.createdAt), "PPpp")}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm">{log.user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {log.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 