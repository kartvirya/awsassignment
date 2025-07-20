import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import StudentDashboard from "@/pages/student-dashboard";
import CounsellorDashboard from "@/pages/counsellor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();

  console.log("Router render:", { isAuthenticated, isLoading, user, location });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For unauthenticated users
  if (!isAuthenticated) {
    switch (location) {
      case "/":
        return <Landing />;
      case "/login":
        return <Login />;
      case "/signup":
        return <Signup />;
      default:
        return <NotFound />;
    }
  }

  // For authenticated users
  switch (location) {
    case "/":
      if (user?.role === 'student') return <StudentDashboard />;
      if (user?.role === 'counsellor') return <CounsellorDashboard />;
      if (user?.role === 'admin') return <AdminDashboard />;
      return <Landing />;
    case "/student-dashboard":
      return <StudentDashboard />;
    case "/counsellor-dashboard":
      return <CounsellorDashboard />;
    case "/admin-dashboard":
      return <AdminDashboard />;
    default:
      if (user?.role === 'student') return <StudentDashboard />;
      if (user?.role === 'counsellor') return <CounsellorDashboard />;
      if (user?.role === 'admin') return <AdminDashboard />;
      return <Landing />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
