import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  FileText,
  PlusCircle,
  Users,
  ClipboardList,
  AlertTriangle,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  badge?: number;
}

function useSOSCount(role: string | undefined) {
  const { data } = useQuery({
    queryKey: ["sos-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("sos_alerts")
        .select("*", { count: "exact", head: true })
        .eq("active", true);
      return count || 0;
    },
    enabled: role === "admin" || role === "primary_admin",
    refetchInterval: 5000,
  });
  return data || 0;
}

function getNavItems(role: string, sosCount: number): NavItem[] {
  if (role === "student") {
    return [
      { label: "Register Room", to: "/student/register-room", icon: <Home className="h-4 w-4" /> },
      { label: "Raise Complaint", to: "/student/raise-complaint", icon: <PlusCircle className="h-4 w-4" /> },
      { label: "My Complaints", to: "/student/my-complaints", icon: <FileText className="h-4 w-4" /> },
    ];
  }

  if (role === "admin") {
    return [
      { label: "View Students", to: "/admin/students", icon: <Users className="h-4 w-4" /> },
      { label: "Complaints", to: "/admin/complaints", icon: <ClipboardList className="h-4 w-4" /> },
      { label: "SOS Alerts", to: "/admin/sos", icon: <AlertTriangle className="h-4 w-4" />, badge: sosCount },
    ];
  }

  return [
    { label: "Admin Management", to: "/primary/admins", icon: <Shield className="h-4 w-4" /> },
    { label: "View Students", to: "/primary/students", icon: <Users className="h-4 w-4" /> },
    { label: "Complaints", to: "/primary/complaints", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "SOS Alerts", to: "/primary/sos", icon: <AlertTriangle className="h-4 w-4" />, badge: sosCount },
    { label: "Settings", to: "/primary/settings", icon: <Settings className="h-4 w-4" /> },
  ];
}

function getRoleLabel(role: string) {
  if (role === "primary_admin") return "Primary Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sosCount = useSOSCount(profile?.role);

  if (!profile) return null;

  const navItems = getNavItems(profile.role, sosCount);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
          <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">Dorm Connect</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto bg-sos text-sos-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-sos">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{profile.name || profile.username}</span>
            </span>
            <Badge variant="secondary" className="text-xs">
              {getRoleLabel(profile.role)}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
