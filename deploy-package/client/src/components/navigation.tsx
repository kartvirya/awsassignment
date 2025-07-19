import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        } else {
          console.error('Logout failed:', response.statusText);
          // Even if logout fails on server, clear local token and redirect
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      } else {
        // No token found, just redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token and redirect even on error
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              Youth Hub
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-neutral-600">
              Welcome, {user?.firstName || user?.email}
            </div>
            <div className="text-xs text-neutral-500 capitalize bg-neutral-100 px-2 py-1 rounded">
              {user?.role}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-neutral-200">
            <div className="px-3 py-2 text-sm text-neutral-600">
              Welcome, {user?.firstName || user?.email}
            </div>
            <div className="px-3 py-1">
              <div className="text-xs text-neutral-500 capitalize bg-neutral-100 px-2 py-1 rounded inline-block">
                {user?.role}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2 mx-3"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}