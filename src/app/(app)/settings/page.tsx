"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Save, Plus, Search, Pencil, Trash2, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Settings {
  azureClientId: string;
  azureTenantId: string;
  hasAzureClientSecret: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "EDITOR" | "READ_ONLY" | "USER";
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "EDITOR" | "READ_ONLY" | "USER";
}

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

// Key for localStorage
const SETTINGS_FORM_KEY = "azure_settings_form";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("integrations");
  const [isLoading, setIsLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    azureClientId: "",
    azureTenantId: "",
    hasAzureClientSecret: false,
  });
  const [formData, setFormData] = useState({
    azureClientId: "",
    azureTenantId: "",
    azureClientSecret: "",
  });
  const [isAzureModalOpen, setIsAzureModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [intendedRoute, setIntendedRoute] = useState("");
  const [hasEnteredSecret, setHasEnteredSecret] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem(SETTINGS_FORM_KEY);
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm);
        setFormData(parsed);
        // If there was a client secret saved, mark it as entered
        if (parsed.azureClientSecret) {
          setHasEnteredSecret(true);
        }
      } catch (e) {
        console.error("Failed to parse saved form data:", e);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SETTINGS_FORM_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/inventory");
      return;
    }

    fetchSettings();
  }, [session, status, router]);

  // Add beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Intercept navigation when there are unsaved changes
  const handleNavigation = (route: string) => {
    if (hasUnsavedChanges) {
      setIntendedRoute(route);
      setShowLeaveDialog(true);
    } else {
      router.push(route);
    }
  };

  // Override the router.push
  useEffect(() => {
    const originalPush = router.push;
    router.push = (route: string) => {
      if (hasUnsavedChanges) {
        setIntendedRoute(route);
        setShowLeaveDialog(true);
        return Promise.resolve(false);
      }
      return originalPush(route);
    };
    return () => {
      router.push = originalPush;
    };
  }, [hasUnsavedChanges, router]);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/inventory");
          return;
        }
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data);
      // Only update form data if it's empty (not already set from localStorage)
      if (!formData.azureClientId && !formData.azureTenantId) {
        setFormData({
          azureClientId: data.azureClientId,
          azureTenantId: data.azureTenantId,
          azureClientSecret: "", // Don't show the secret
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settings",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      // Check if values are different from current settings
      const hasChanges = 
        newData.azureClientId !== settings.azureClientId ||
        newData.azureTenantId !== settings.azureTenantId ||
        (name === 'azureClientSecret' ? value !== "" : hasEnteredSecret);
      
      // Update hasEnteredSecret if changing the client secret
      if (name === 'azureClientSecret') {
        setHasEnteredSecret(value !== "");
      }
      
      setHasUnsavedChanges(hasChanges);
      return newData;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          azureClientId: formData.azureClientId,
          azureTenantId: formData.azureTenantId,
          ...(formData.azureClientSecret && {
            azureClientSecret: formData.azureClientSecret,
          }),
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/inventory");
          return;
        }
        throw new Error("Failed to update settings");
      }

      // Update environment variables
      process.env.AZURE_AD_CLIENT_ID = formData.azureClientId;
      process.env.AZURE_AD_TENANT_ID = formData.azureTenantId;
      if (formData.azureClientSecret) {
        process.env.AZURE_AD_CLIENT_SECRET = formData.azureClientSecret;
      }

      localStorage.removeItem(SETTINGS_FORM_KEY);
      setHasUnsavedChanges(false);
      setHasEnteredSecret(false);

      toast({
        title: "Success",
        description: "Settings updated successfully. Please restart the server for changes to take effect.",
      });

      fetchSettings();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update settings",
      });
    }
  }

  // Add new effects for Users and Audit Logs
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, userSearch]);

  async function fetchUsers() {
    try {
      const response = await fetch(`/api/users${userSearch ? `?search=${encodeURIComponent(userSearch)}` : ""}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    }
  }

  async function fetchAuditLogs() {
    try {
      const response = await fetch("/api/audit-logs");
      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch audit logs",
      });
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userFormData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await fetchUsers();
      setIsAddUserModalOpen(false);
      setUserFormData({ name: "", email: "", password: "", role: "USER" });
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userFormData,
          oldRole: selectedUser.role
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await fetchUsers();
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
      });
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await fetchUsers();
      setIsDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
      });
    }
  }

  function handleEditUserClick(user: User) {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || "",
      email: user.email,
      password: "", // Leave password empty for edit
      role: user.role,
    });
    setIsEditUserModalOpen(true);
  }

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          {hasUnsavedChanges && (
            <span className="text-sm text-yellow-500 dark:text-yellow-400">
              You have unsaved changes
            </span>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Integrations</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col justify-between p-6 border rounded-lg bg-background aspect-square">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Azure Active Directory</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manage user authentication and access control through Azure AD.
                      </p>
                      <p className="text-sm font-medium mt-2">
                        Status: <span className={settings.hasAzureClientSecret ? "text-green-500" : "text-yellow-500"}>
                          {settings.hasAzureClientSecret ? "Configured" : "Not configured"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAzureModalOpen(true)}
                      className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 mt-4"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">User Management</h2>
                <button
                  onClick={() => {
                    setUserFormData({ name: "", email: "", password: "", role: "USER" });
                    setIsAddUserModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  Add User
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Role</th>
                        <th className="px-4 py-2 text-left">Joined</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="px-4 py-2">{user.name}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded px-2 py-1 text-xs font-medium ${
                              user.role === "ADMIN" 
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {format(new Date(user.createdAt), "PP")}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditUserClick(user)}
                                className="rounded-md p-1 hover:bg-secondary"
                                title="Edit user"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              {user.id !== session?.user.id && (
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeleteUserDialogOpen(true);
                                  }}
                                  className="rounded-md p-1 hover:bg-secondary"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Audit Logs</h2>
              </div>
              
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
                    {auditLogs.map((log) => (
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Azure AD Configuration Modal */}
      <Dialog open={isAzureModalOpen} onOpenChange={setIsAzureModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Azure AD Configuration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <input
                type="text"
                name="azureClientId"
                value={formData.azureClientId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter Azure Client ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tenant ID</label>
              <input
                type="text"
                name="azureTenantId"
                value={formData.azureTenantId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter Azure Tenant ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Client Secret {settings.hasAzureClientSecret && "(already set)"}
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  name="azureClientSecret"
                  value={formData.azureClientSecret}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border bg-background px-3 py-2 pr-10"
                  placeholder={
                    settings.hasAzureClientSecret
                      ? hasEnteredSecret 
                        ? "New secret entered (click save to apply)"
                        : "Leave blank to keep current secret"
                      : "Enter Azure Client Secret"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {hasEnteredSecret && (
                <p className="mt-1 text-xs text-muted-foreground">
                  New secret has been entered. Click save to apply changes.
                </p>
              )}
            </div>
            <DialogFooter>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter password"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as "ADMIN" | "EDITOR" | "READ_ONLY" | "USER" })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
              >
                <option value="READ_ONLY">Read Only</option>
                <option value="EDITOR">Editor</option>
                <option value="USER">User (Legacy)</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create User
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as "ADMIN" | "EDITOR" | "READ_ONLY" | "USER" })}
                className="mt-1 block w-full rounded-md border bg-background px-3 py-2"
                disabled={selectedUser?.id === session?.user.id}
              >
                <option value="READ_ONLY">Read Only</option>
                <option value="EDITOR">Editor</option>
                <option value="USER">User (Legacy)</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Update User
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for {selectedUser?.email}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Settings Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHasUnsavedChanges(false);
                router.push(intendedRoute);
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 