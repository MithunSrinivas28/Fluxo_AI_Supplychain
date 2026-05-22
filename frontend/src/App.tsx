import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { UISettingsProvider } from "@/context/UISettingsContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Requests from "./pages/Requests";
import Inventory from "./pages/Inventory";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Insights from "./pages/Insights";
import { pingHealth } from "@/services/api";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/unauthorized" state={{ from: window.location.pathname }} replace />;
  return <>{children}</>;
};

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" state={{ from: window.location.pathname }} replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/requests" element={<RoleRoute allowedRoles={["admin", "retailer"]}><Requests /></RoleRoute>} />
      <Route path="/requests/new" element={<RoleRoute allowedRoles={["admin", "retailer"]}><Requests initialIntakeOpen /></RoleRoute>} />
      <Route path="/inventory" element={<RoleRoute allowedRoles={["admin", "warehouse"]}><Inventory /></RoleRoute>} />
      <Route path="/inventory/:warehouseId" element={<RoleRoute allowedRoles={["admin", "warehouse"]}><Inventory /></RoleRoute>} />
      <Route path="/inventory/:warehouseId/:productId" element={<RoleRoute allowedRoles={["admin", "warehouse"]}><Inventory /></RoleRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    pingHealth()
      .then(() => console.log("Backend reachable"))
      .catch(err => console.error("Backend unreachable:", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UISettingsProvider>
        <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
        </CompanyProvider>
      </UISettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
