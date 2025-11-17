import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { listProfiles, updateProfile, ProfileRow } from "@/services/admin";
import {
  BarChart3,
  ChevronLeft,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
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
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
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

  const signOutAndRedirect = async () => {
    await signOut();
    navigate("/login");
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
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium bg-primary text-white`}
            title={sidebarCollapsed ? "Users" : ""}
          >
            <Users className="w-5 h-5" />
            {!sidebarCollapsed && "User Administration"}
          </button>
          <button
            onClick={() => navigate("/settings")}
            className={`w-full flex items-center ${
              sidebarCollapsed
                ? "justify-center px-0 py-2.5"
                : "gap-3 px-4 py-3"
            } rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors`}
            title={sidebarCollapsed ? "Settings" : ""}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && "Settings"}
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
                User Administration
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
                          Created
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                          >
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredProfiles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-muted-foreground"
                          >
                            No users found for “{searchQuery}”
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
                                {formatDate(profile.created_at)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

