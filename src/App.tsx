import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

import Login from "./pages/Login";
import StudentRegister from "./pages/StudentRegister";
import AdminRegister from "./pages/AdminRegister";
import NotFound from "./pages/NotFound";

import DashboardLayout from "./components/DashboardLayout";
import RegisterRoom from "./pages/student/RegisterRoom";
import RaiseComplaint from "./pages/student/RaiseComplaint";
import MyComplaints from "./pages/student/MyComplaints";
import ViewStudents from "./pages/admin/ViewStudents";
import ComplaintsPanel from "./pages/admin/ComplaintsPanel";
import SOSAlerts from "./pages/admin/SOSAlerts";
import AdminManagement from "./pages/primary/AdminManagement";
import PrimarySettings from "./pages/primary/Settings";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user || !profile) return <Navigate to="/login" replace />;
  if (!roles.includes(profile.role)) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user && profile) {
    if (profile.role === "student") return <Navigate to="/student/register-room" replace />;
    if (profile.role === "admin") return <Navigate to="/admin/students" replace />;
    return <Navigate to="/primary/admins" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register/student" element={<PublicRoute><StudentRegister /></PublicRoute>} />
            <Route path="/register/admin" element={<PublicRoute><AdminRegister /></PublicRoute>} />

            <Route path="/student/register-room" element={<ProtectedRoute roles={["student"]}><RegisterRoom /></ProtectedRoute>} />
            <Route path="/student/raise-complaint" element={<ProtectedRoute roles={["student"]}><RaiseComplaint /></ProtectedRoute>} />
            <Route path="/student/my-complaints" element={<ProtectedRoute roles={["student"]}><MyComplaints /></ProtectedRoute>} />

            <Route path="/admin/students" element={<ProtectedRoute roles={["admin"]}><ViewStudents /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute roles={["admin"]}><ComplaintsPanel /></ProtectedRoute>} />
            <Route path="/admin/sos" element={<ProtectedRoute roles={["admin"]}><SOSAlerts /></ProtectedRoute>} />

            <Route path="/primary/admins" element={<ProtectedRoute roles={["primary_admin"]}><AdminManagement /></ProtectedRoute>} />
            <Route path="/primary/students" element={<ProtectedRoute roles={["primary_admin"]}><ViewStudents /></ProtectedRoute>} />
            <Route path="/primary/complaints" element={<ProtectedRoute roles={["primary_admin"]}><ComplaintsPanel /></ProtectedRoute>} />
            <Route path="/primary/sos" element={<ProtectedRoute roles={["primary_admin"]}><SOSAlerts /></ProtectedRoute>} />
            <Route path="/primary/settings" element={<ProtectedRoute roles={["primary_admin"]}><PrimarySettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
