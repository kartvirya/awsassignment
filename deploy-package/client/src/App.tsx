import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useDevAuth } from "@/hooks/useDevAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import StudentDashboard from "@/pages/student-dashboard";
import CounsellorDashboard from "@/pages/counsellor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import DevUserSwitcher from "@/components/dev-user-switcher";

function Router() {
  const auth = useAuth();
  const devAuth = useDevAuth();
  
  // Use dev auth in development mode, otherwise use normal auth
  const currentAuth = import.meta.env.DEV && devAuth.currentUserId ? devAuth : auth;
  const { isAuthenticated, isLoading, user } = currentAuth;

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

  return (
    <>
      <Switch>
        {/* Login route should always be accessible */}
        <Route path="/login" component={Login} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={() => {
              if (user?.role === 'student') return <StudentDashboard />;
              if (user?.role === 'counsellor') return <CounsellorDashboard />;
              if (user?.role === 'admin') return <AdminDashboard />;
              return <Landing />;
            }} />
            <Route path="/student" component={StudentDashboard} />
            <Route path="/counsellor" component={CounsellorDashboard} />
            <Route path="/admin" component={AdminDashboard} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* Dev mode user switcher */}
      {import.meta.env.DEV && (
        <DevUserSwitcher
          onUserSelect={devAuth.switchToUser}
          currentUserId={devAuth.currentUserId || undefined}
        />
      )}
    </>
  );
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
