import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Upload,
  FileText,
  Link as LinkIcon,
  Users,
  Settings,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from "lucide-react";

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);

  const adminCards = [
    {
      icon: Upload,
      title: "ETF Data Upload",
      description: "Upload Excel files to update ETF information",
      action: "Upload Data",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: FileText,
      title: "Content Management",
      description: "Edit Our Focus page sections and content",
      action: "Manage Content",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: LinkIcon,
      title: "Resources Manager",
      description: "Add, edit, and organize resource links",
      action: "Manage Resources",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Users,
      title: "User Management",
      description: "View and manage registered users",
      action: "View Users",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "View site usage and engagement metrics",
      action: "View Analytics",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: Settings,
      title: "Site Settings",
      description: "Configure global site settings and preferences",
      action: "Manage Settings",
      color: "from-gray-500 to-gray-600",
    },
  ];

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
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
            } rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-foreground`}
            title={sidebarCollapsed ? "Dashboard" : ""}
          >
            <BarChart3 className="w-5 h-5" />
            {!sidebarCollapsed && "Dashboard"}
          </button>
          {!sidebarCollapsed && (
            <div>
              <button
                onClick={() => setAdminPanelExpanded(!adminPanelExpanded)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-primary text-white"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  Admin Panel
                </div>
                {adminPanelExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {adminPanelExpanded && (
                <div className="pl-4 mt-1 space-y-1">
                  <button
                    onClick={() => navigate("/admin?tab=users")}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </button>
                  <button
                    onClick={() => navigate("/admin?tab=upload")}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-foreground transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Data
                  </button>
                </div>
              )}
            </div>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center justify-center px-0 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary"
              title="Admin Panel"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
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
            onClick={logout}
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.isAdmin ? "Admin" : "Investor"}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0)}
                </div>
              </div>
              <div className="sm:hidden w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your ETF analytics platform</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer border-2 hover:border-primary/20">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {card.description}
                  </p>
                  <Button className="w-full group-hover:bg-primary group-hover:text-white transition-all">
                    {card.action}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">20</div>
                    <div className="text-xs text-muted-foreground mt-1">Total ETFs</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1.2K</div>
                    <div className="text-xs text-muted-foreground mt-1">Active Users</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">42</div>
                    <div className="text-xs text-muted-foreground mt-1">Resources</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">98%</div>
                    <div className="text-xs text-muted-foreground mt-1">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;












