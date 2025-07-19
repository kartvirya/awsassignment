import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import AdminOverview from "@/components/admin/overview";
import AdminUsers from "@/components/admin/users";
import AdminSessions from "@/components/admin/sessions";
import AdminResources from "@/components/admin/resources";
import AdminSettings from "@/components/admin/settings";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("overview");

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <AdminOverview setActiveView={setActiveView} />;
      case "users":
        return <AdminUsers />;
      case "sessions":
        return <AdminSessions />;
      case "resources":
        return <AdminResources />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar 
          role="admin" 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <main className="flex-1 overflow-x-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
