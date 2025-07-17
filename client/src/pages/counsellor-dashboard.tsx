import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import CounsellorOverview from "@/components/counsellor/overview";
import CounsellorSessions from "@/components/counsellor/sessions";
import CounsellorStudents from "@/components/counsellor/students";
import CounsellorResources from "@/components/counsellor/resources";
import CounsellorMessages from "@/components/counsellor/messages";

export default function CounsellorDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState("overview");

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <CounsellorOverview />;
      case "sessions":
        return <CounsellorSessions />;
      case "students":
        return <CounsellorStudents />;
      case "resources":
        return <CounsellorResources />;
      case "messages":
        return <CounsellorMessages />;
      default:
        return <CounsellorOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar 
          role="counsellor" 
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
