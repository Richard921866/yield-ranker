import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listProfiles, updateProfile, ProfileRow, deleteUser, getSiteSettings, updateSiteSetting, SiteSetting } from "@/services/admin";
import * as XLSX from "xlsx";
import {
  BarChart3,
  ChevronLeft,
  Database,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  Users,
  Trash2,
} from "lucide-react";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const AdminPanel = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "etf-data" | "settings">("users");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ProfileRow | null>(null);

  const userMetadata =
    (user?.user_metadata as {
      display_name?: string;
      name?: string;
      role?: string;
      is_premium?: boolean;
    }) ?? {};
  const appMetadata = (user?.app_metadata as { role?: string }) ?? {};
  const displayName =
    profile?.display_name ??
    userMetadata.display_name ??
    userMetadata.name ??
    user?.email ??
    "";
  const roleFromSession =
    profile?.role ?? userMetadata.role ?? appMetadata.role ?? "user";
  const isAdmin = roleFromSession === "admin";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "users" || tab === "etf-data" || tab === "settings") {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await listProfiles();
      setProfiles(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load users";
      toast({
        variant: "destructive",
        title: "Failed to load users",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await getSiteSettings();
      setSiteSettings(data);
      const initialEdits: Record<string, string> = {};
      data.forEach(setting => {
        initialEdits[setting.key] = setting.value;
      });
      setEditingSettings(initialEdits);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load settings";
      toast({
        variant: "destructive",
        title: "Failed to load settings",
        description: message,
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchSettings();
    }
  }, [isAdmin]);

  const filteredProfiles = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return profiles;
    }
    return profiles.filter((profile) => {
      const name = profile.display_name ?? "";
      return (
        name.toLowerCase().includes(term) ||
        profile.email.toLowerCase().includes(term) ||
        profile.role.toLowerCase().includes(term)
      );
    });
  }, [profiles, searchQuery]);

  const totalUsers = profiles.length;
  const adminCount = profiles.filter((profile) => profile.role === "admin")
    .length;
  const guestCount = profiles.filter((profile) => !profile.is_premium && profile.role !== "admin").length;
  const premiumCount = profiles.filter((profile) => profile.is_premium && profile.role !== "admin").length;

  const updateLocalProfile = (next: ProfileRow) => {
    setProfiles((prev) =>
      prev.map((profile) => (profile.id === next.id ? next : profile))
    );
  };

  const handleRoleToggle = async (profile: ProfileRow) => {
    const nextRole = profile.role === "admin" ? "user" : "admin";
    const key = `${profile.id}-role`;
    setUpdatingId(key);
    try {
      const updated = await updateProfile(profile.id, { role: nextRole });
      updateLocalProfile(updated);
      toast({
        title:
          nextRole === "admin"
            ? "Admin access granted"
            : "Admin access removed",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update role";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePremiumToggle = async (
    profile: ProfileRow,
    isPremium: boolean
  ) => {
    const key = `${profile.id}-premium`;
    setUpdatingId(key);
    try {
      const updated = await updateProfile(profile.id, {
        is_premium: isPremium,
      });
      updateLocalProfile(updated);
      toast({
        title: isPremium ? "Premium enabled" : "Premium disabled",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update premium";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteDialog = (profile: ProfileRow) => {
    setUserToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const key = `${userToDelete.id}-delete`;
    setUpdatingId(key);
    setDeleteDialogOpen(false);
    
    try {
      await deleteUser(userToDelete.id);
      setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
      toast({
        title: "User deleted",
        description: "The user has been permanently removed.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete user";
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: message,
      });
    } finally {
      setUpdatingId(null);
      setUserToDelete(null);
    }
  };

  const handleUpdateSetting = async (key: string) => {
    setUpdatingId(key);
    try {
      const value = editingSettings[key];
      const updated = await updateSiteSetting(key, value);
      setSiteSettings(prev => prev.map(s => s.key === key ? updated : s));
      toast({
        title: "Setting updated",
        description: "Homepage message has been updated successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update setting";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const signOutAndRedirect = async () => {
    await signOut();
    navigate("/login");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadStatus("");
    }
  };

  const handleUploadDTR = async () => {
    if (!uploadFile) {
      setUploadStatus("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading and processing...");

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch(`${API_BASE_URL}/api/admin/upload-dtr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadStatus(`Success! Processed ${result.count} ETFs`);
      toast({
        title: "Upload successful",
        description: `Uploaded ${result.count} ETFs to database`,
      });
      setUploadFile(null);
      const fileInput = document.getElementById("dtr-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      window.dispatchEvent(new Event("storage"));
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadStatus(`Error: ${message}`);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: message,
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 ${
          mobileSidebarOpen ? "fixed left-0 top-0 z-50" : "hidden lg:flex"
        }`}
      >
        <div
          className={`h-16 border-b border-slate-200 flex items-center flex-shrink-0 ${
            sidebarCollapsed ? "justify-center px-2" : "px-6 justify-between"
          }`}
        >
          {!sidebarCollapsed && <Logo simple />}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden lg:block"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5 text-slate-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-slate-600" />
            )}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <nav
          className={`flex-1 overflow-y-auto ${
            sidebarCollapsed ? "p-2 space-y-1" : "p-4 space-y-2"
          }`}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors`}
            title={sidebarCollapsed ? "Dashboard" : ""}
          >
            <BarChart3 className="w-5 h-5" />
            {!sidebarCollapsed && "Dashboard"}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium ${
              activeTab === "users"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
            } transition-colors`}
            title={sidebarCollapsed ? "Users" : ""}
          >
            <Users className="w-5 h-5" />
            {!sidebarCollapsed && "User Administration"}
          </button>
          <button
            onClick={() => setActiveTab("etf-data")}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium ${
              activeTab === "etf-data"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
            } transition-colors`}
            title={sidebarCollapsed ? "ETF Data" : ""}
          >
            <Database className="w-5 h-5" />
            {!sidebarCollapsed && "ETF Data Management"}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium ${
              activeTab === "settings"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
            } transition-colors`}
            title={sidebarCollapsed ? "Site Settings" : ""}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && "Site Settings"}
          </button>
        </nav>
        <div
          className={`border-t border-slate-200 flex-shrink-0 ${
            sidebarCollapsed ? "p-2" : "p-4"
          }`}
        >
          <button
            onClick={signOutAndRedirect}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors`}
            title={sidebarCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center flex-shrink-0">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-10 w-10"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {activeTab === "users" ? "User Administration" : activeTab === "etf-data" ? "ETF Data Management" : "Site Settings"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-foreground">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  Admin
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {activeTab === "users" && (
              <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-5 border-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    Total users
                  </span>
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {totalUsers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {adminCount} admins, {premiumCount} premium, {guestCount} guests
                </p>
              </Card>
              <Card className="p-5 border-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    Admins
                  </span>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {adminCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Full system access
                </p>
              </Card>
              <Card className="p-5 border-2 border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    Premium users
                  </span>
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {premiumCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {guestCount} guests remaining
                </p>
              </Card>
            </div>
            <Card className="border-2 border-slate-200">
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name, email, or role"
                      className="pl-10 h-10 border-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const emails = profiles.map(p => p.email).join(', ');
                        navigator.clipboard.writeText(emails);
                        toast({
                          title: "Emails copied",
                          description: `${profiles.length} email addresses copied to clipboard`,
                        });
                      }}
                      disabled={loading || profiles.length === 0}
                      className="h-10 border-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                      Copy Emails
                    </Button>
                    <Button
                      variant="outline"
                      onClick={fetchProfiles}
                      disabled={loading}
                      className="h-10 border-2"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200 bg-white">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Premium
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Last In
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Visits
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                          >
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredProfiles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                          >
                            No users found for "{searchQuery}"
                          </td>
                        </tr>
                      ) : (
                        filteredProfiles.map((profile) => {
                          const roleKey = `${profile.id}-role`;
                          const premiumKey = `${profile.id}-premium`;
                          return (
                            <tr
                              key={profile.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm font-medium text-foreground">
                                {profile.display_name || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {profile.email}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                  profile.role === "admin"
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : profile.is_premium
                                    ? "border-green-300 bg-green-50 text-green-700"
                                    : "border-slate-300 bg-slate-50 text-slate-700"
                                }`}>
                                  {profile.role === "admin"
                                    ? "Admin"
                                    : profile.is_premium
                                    ? "Premium"
                                    : "Guest"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                <Switch
                                  checked={profile.is_premium}
                                  onCheckedChange={(checked) =>
                                    handlePremiumToggle(profile, checked)
                                  }
                                  disabled={updatingId === premiumKey}
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {profile.last_login ? formatDate(profile.last_login) : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {profile.visit_count || 0}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {formatDate(profile.created_at)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRoleToggle(profile)}
                                    disabled={updatingId === roleKey}
                                    className="border-2"
                                  >
                                    {profile.role === "admin"
                                      ? "Remove admin"
                                      : "Make admin"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog(profile)}
                                    disabled={updatingId === `${profile.id}-delete`}
                                    className="border-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
              </>
            )}

            {activeTab === "etf-data" && (
              <Card className="border-2 border-slate-200">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-2">
                      Upload DTR Spreadsheet
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Upload the DTR Excel file (e.g., DTR 11-16-25.xlsx) to update all ETF data in the system.
                      The file should have a Sheet1 with the standard DTR format.
                    </p>
                  </div>

                  <Card className="bg-gradient-to-br from-primary/5 to-blue-50 border-2 border-primary/20 p-5">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label htmlFor="dtr-file-input" className="block text-sm font-semibold text-slate-900 mb-2">
                            Select Excel File
                          </label>
                          <Input
                            id="dtr-file-input"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="border-2 bg-white"
                          />
                          {uploadFile && (
                            <p className="text-sm text-slate-700 mt-2 font-medium">
                              Selected: {uploadFile.name}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={handleUploadDTR}
                          disabled={!uploadFile || uploading}
                          className="sm:w-auto"
                          size="lg"
                        >
                          {uploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload & Process
                            </>
                          )}
                        </Button>
                      </div>

                      {uploadStatus && (
                        <Card className={`p-4 ${uploadStatus.startsWith("Error") ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                          <p className={`text-sm font-medium ${uploadStatus.startsWith("Error") ? "text-red-800" : "text-green-800"}`}>
                            {uploadStatus}
                          </p>
                        </Card>
                      )}
                    </div>
                  </Card>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Expected File Format
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-700 space-y-2 font-mono">
                      <p>Sheet Name: Sheet1</p>
                      <p>Row 1 (Headers): Favorites | SYMBOL | Issuer | DESC | Pay Day | IPO PRICE | Price | Price Change | Dividend | # Pmts | Annual Div | Forward Yield | Dividend Volatility Index | Weighted Rank | 3 YR Annlzd | 12 Month | 6 Month | 3 Month | 1 Month | 1 Week</p>
                      <p>Row 2+: Data rows (one ETF per row)</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "settings" && (
              <Card className="border-2 border-slate-200">
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-2">
                      Site Content Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Edit the messages and timestamps displayed on the homepage and in the disclaimer. Changes will be visible to all users immediately.
                    </p>
                  </div>

                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {siteSettings.map((setting, index) => (
                        <div key={setting.key} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              {setting.key === "homepage_subtitle" 
                                ? "Homepage Subtitle" 
                                : setting.key === "homepage_banner"
                                ? "Homepage Info Banner"
                                : "EOD Data Last Updated"}
                            </label>
                            <p className="text-xs text-muted-foreground mb-2">
                              {setting.description}
                            </p>
                          </div>
                          {setting.key === "data_last_updated" ? (
                            <Input
                              type="datetime-local"
                              value={editingSettings[setting.key] || ""}
                              onChange={(e) => setEditingSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              className="border-2"
                            />
                          ) : (
                            <Textarea
                              value={editingSettings[setting.key] || ""}
                              onChange={(e) => setEditingSettings(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              rows={setting.key === "homepage_banner" ? 4 : 2}
                              className="border-2 font-sans resize-none"
                            />
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Last updated: {formatDate(setting.updated_at)}
                            </span>
                            <Button
                              onClick={() => handleUpdateSetting(setting.key)}
                              disabled={updatingId === setting.key || editingSettings[setting.key] === setting.value}
                              size="sm"
                            >
                              {updatingId === setting.key ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </Button>
                          </div>
                          {index !== siteSettings.length - 1 && (
                            <div className="border-t pt-6" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.display_name || userToDelete?.email}</strong>? 
              This action cannot be undone and will permanently remove the user and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;

